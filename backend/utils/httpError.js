// Creates an Error that carries an HTTP status code.
const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = httpError;
