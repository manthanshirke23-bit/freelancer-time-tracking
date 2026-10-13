const jwt = require('jsonwebtoken');
const httpError = require('../utils/httpError');

// Reads "Authorization: Bearer <token>", verifies it and sets req.user.id.
const protect = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(httpError(401, 'Not authorized, token missing'));
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    return next();
  } catch {
    return next(httpError(401, 'Not authorized, token invalid or expired'));
  }
};

module.exports = { protect };
