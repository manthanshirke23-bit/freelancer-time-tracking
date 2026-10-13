const jwt = require('jsonwebtoken');

// The token payload contains only the user's ID.
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

module.exports = generateToken;
