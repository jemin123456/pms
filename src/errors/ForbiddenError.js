class ForbiddenError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

module.exports = ForbiddenError;
