const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { requireString, isValidEmail } = require('../utils/validate');

const MIN_PASSWORD_LENGTH = 6;

const userResponse = (user) => ({ id: user._id, name: user.name, email: user.email });

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const name = requireString(req.body.name, 'Name');
  const email = requireString(req.body.email, 'Email').toLowerCase();
  const { password } = req.body;

  if (!isValidEmail(email)) {
    throw httpError(400, 'Please provide a valid email');
  }
  if (typeof password !== 'string' || !password) {
    throw httpError(400, 'Password is required');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw httpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw httpError(400, 'Email is already registered');
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({ token: generateToken(user._id), user: userResponse(user) });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const email = requireString(req.body.email, 'Email').toLowerCase();
  const { password } = req.body;

  if (typeof password !== 'string' || !password) {
    throw httpError(400, 'Password is required');
  }

  // The password field is hidden by default, so it must be requested here.
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw httpError(401, 'Invalid email or password');
  }

  res.status(200).json({ token: generateToken(user._id), user: userResponse(user) });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw httpError(401, 'User no longer exists');
  }
  res.status(200).json(userResponse(user));
});

module.exports = { register, login, getMe };
