class AppError extends Error {
  constructor(message, statusCode, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message || 'Validation failed', 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message) {
    super(message || 'Authentication failed', 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message) {
    super(message || 'Access denied', 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message || 'Resource not found', 404, 'NOT_FOUND_ERROR');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message || 'Resource conflict occurred', 409, 'CONFLICT_ERROR');
  }
}

class BusinessRuleError extends AppError {
  constructor(message) {
    super(message || 'Business rule violation', 422, 'BUSINESS_RULE_ERROR');
  }
}

class DatabaseError extends AppError {
  constructor(message) {
    super(message || 'Database error occurred', 500, 'DATABASE_ERROR');
  }
}

class FileUploadError extends AppError {
  constructor(message) {
    super(message || 'File upload failed', 400, 'FILE_UPLOAD_ERROR');
  }
}

class RateLimitError extends AppError {
  constructor(message) {
    super(message || 'Too many requests, please try again later', 429, 'RATE_LIMIT_ERROR');
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessRuleError,
  DatabaseError,
  FileUploadError,
  RateLimitError
};
