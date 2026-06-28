const { body } = require('express-validator');
const validate = require('../../../middlewares/validate.middleware');

const registerValidator = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('username')
    .isString()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isString()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
  body('department')
    .optional()
    .isString()
    .trim(),
  body('designation')
    .optional()
    .isString()
    .trim(),
  validate
];

const loginValidator = [
  body('usernameOrEmail')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Username or email is required'),
  body('password')
    .isString()
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

const changePasswordValidator = [
  body('oldPassword')
    .isString()
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isString()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  validate
];

module.exports = {
  registerValidator,
  loginValidator,
  changePasswordValidator
};
