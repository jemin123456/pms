const ForbiddenError = require('../errors/ForbiddenError');

const authorize = (action, subject) => {
  return (req, res, next) => {
    if (!req.ability) {
      return next(new ForbiddenError('Access denied: Authentication context missing'));
    }

    if (req.ability.can(action, subject)) {
      return next();
    }

    return next(new ForbiddenError(`Access denied: You do not have permission to ${action} ${subject}`));
  };
};

module.exports = authorize;
