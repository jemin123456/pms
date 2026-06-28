const { body, param, validationResult } = require('express-validator');
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

const createProjectValidator = validate([
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Project code is required')
    .isAlphanumeric()
    .withMessage('Project code must be alphanumeric (no spaces or special characters)'),
  body('manager').isMongoId().withMessage('Valid manager user ID is required'),
  body('members').optional().isArray().withMessage('Members must be an array of IDs'),
  body('members.*').optional().isMongoId().withMessage('Each member ID must be a valid Mongo ID'),
  body('client').optional().isMongoId().withMessage('Client ID must be a valid Mongo ID'),
  body('budget').optional().isNumeric().withMessage('Budget must be a number'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid priority level'),
  body('status')
    .optional()
    .isIn(['Draft', 'Planning', 'Active', 'On Hold', 'Completed', 'Cancelled', 'Archived'])
    .withMessage('Invalid project status'),
  body('visibility').optional().isIn(['Public', 'Private']).withMessage('Visibility must be Public or Private'),
  body('startDate').isISO8601().toDate().withMessage('Start date must be a valid date'),
  body('endDate').isISO8601().toDate().withMessage('End date must be a valid date'),
]);

const updateProjectValidator = validate([
  param('id').isMongoId().withMessage('Invalid project ID parameter'),
  body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty'),
  body('code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Project code cannot be empty')
    .isAlphanumeric()
    .withMessage('Project code must be alphanumeric'),
  body('manager').optional().isMongoId().withMessage('Manager ID must be a valid Mongo ID'),
  body('members').optional().isArray().withMessage('Members must be an array of IDs'),
  body('members.*').optional().isMongoId().withMessage('Each member ID must be a valid Mongo ID'),
  body('client').optional().isMongoId().withMessage('Client ID must be a valid Mongo ID'),
  body('budget').optional().isNumeric().withMessage('Budget must be a number'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid priority level'),
  body('status')
    .optional()
    .isIn(['Draft', 'Planning', 'Active', 'On Hold', 'Completed', 'Cancelled', 'Archived'])
    .withMessage('Invalid project status'),
  body('visibility').optional().isIn(['Public', 'Private']).withMessage('Visibility must be Public or Private'),
  body('startDate').optional().isISO8601().toDate().withMessage('Start date must be a valid date'),
  body('endDate').optional().isISO8601().toDate().withMessage('End date must be a valid date'),
]);

const projectIdValidator = validate([
  param('id').isMongoId().withMessage('Invalid project ID parameter'),
]);

module.exports = {
  createProjectValidator,
  updateProjectValidator,
  projectIdValidator,
};
