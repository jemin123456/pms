const { body, param, query } = require('express-validator');
const validate = require('../../../middlewares/validate.middleware');

const getUserByIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  validate
];

const createUserValidator = [
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
  body('roleCode')
    .optional()
    .isString()
    .trim()
    .toUpperCase(),
  validate
];

const updateUserValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('username')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('name')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty'),
  body('profilePicture')
    .optional()
    .isURL()
    .withMessage('Profile picture must be a valid URL'),
  body('employeeId')
    .optional()
    .isString()
    .trim(),
  body('department')
    .optional()
    .isString()
    .trim(),
  body('designation')
    .optional()
    .isString()
    .trim(),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array of strings'),
  body('contactDetails')
    .optional()
    .isObject()
    .withMessage('Contact details must be an object'),
  body('contactDetails.phone')
    .optional()
    .isString()
    .trim(),
  body('contactDetails.address')
    .optional()
    .isString()
    .trim(),
  body('bio')
    .optional()
    .isString()
    .trim(),
  body('experience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience must be a positive integer'),
  body('timeZone')
    .optional()
    .isString()
    .trim(),
  validate
];

const listUsersValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('sort')
    .optional()
    .isString()
    .trim(),
  query('department')
    .optional()
    .isString()
    .trim(),
  query('search')
    .optional()
    .isString()
    .trim(),
  validate
];

const deleteUserValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  validate
];

module.exports = {
  getUserByIdValidator,
  createUserValidator,
  updateUserValidator,
  listUsersValidator,
  deleteUserValidator
};
