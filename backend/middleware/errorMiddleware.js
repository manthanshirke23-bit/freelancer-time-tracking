const httpError = require('../utils/httpError');

// Runs when no route matched the request.
const notFound = (req, res, next) => {
  next(httpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Central error handler: every error ends up here and becomes a JSON response.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    statusCode = 400;
    message = 'Email is already registered';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body is not valid JSON';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Not authorized, token invalid or expired';
  }

  if (statusCode >= 500) {
    console.error(err);
    message = 'Server error';
  }

  res.status(statusCode).json({ message });
};

module.exports = { notFound, errorHandler };
