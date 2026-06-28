const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errors: err.errors || undefined,
    });
  }

  // Programming or other unknown error: don't leak error details
  logger.error(`UNEXPECTED ERROR: ${err.message}`, err);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong on the server',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle Mongoose cast errors, validation errors, duplicate keys
  let error = { ...err, message: err.message, stack: err.stack };
  error.name = err.name;
  error.code = err.code;

  if (error.name === 'CastError') {
    const { AppError } = require('../utils/errors');
    error = new AppError(`Invalid ${error.path}: ${error.value}`, 400);
  }
  if (error.code === 11000) {
    const { DuplicateError } = require('../utils/errors');
    const field = Object.keys(err.keyValue)[0];
    error = new DuplicateError(`Duplicate value for field: ${field}. Please use another value.`);
  }
  if (error.name === 'ValidationError') {
    const { ValidationError } = require('../utils/errors');
    if (!(err instanceof ValidationError)) {
      const messages = Object.values(err.errors).map(el => el.message);
      error = new ValidationError(`Invalid input data. ${messages.join('. ')}`, messages);
    }
  }
  if (error.name === 'JsonWebTokenError') {
    const { AuthenticationError } = require('../utils/errors');
    error = new AuthenticationError('Invalid token. Please log in again.');
  }
  if (error.name === 'TokenExpiredError') {
    const { AuthenticationError } = require('../utils/errors');
    error = new AuthenticationError('Your token has expired. Please log in again.');
  }

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};
