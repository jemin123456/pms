const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../../../middlewares/auth.middleware');
const validators = require('../validators/user.validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.route('/')
  .get(validators.listUsersValidator, userController.listUsers)
  .post(validators.createUserValidator, userController.createUser);

router.route('/:id')
  .get(validators.getUserByIdValidator, userController.getUserById)
  .put(validators.updateUserValidator, userController.updateUser)
  .delete(validators.deleteUserValidator, userController.deleteUser);

module.exports = router;
