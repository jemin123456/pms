const { body, validationResult } = require('express-validator');
const { ValidationError } = require('../../utils/errors');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    const compiledMessage = `Validation failed: ${extractedErrors.map(e => e.message).join(', ')}`;
    next(new ValidationError(compiledMessage, extractedErrors));
  };
};

const registerValidator = validate([
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('roleName')
    .optional()
    .isIn(['Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Employee', 'Client'])
    .withMessage('Invalid role type'),
]);

const loginValidator = validate([
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
]);

module.exports = {
  registerValidator,
  loginValidator,
};
