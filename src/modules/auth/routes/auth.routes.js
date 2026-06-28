const express = require('express');
const authController = require('../controllers/auth.controller');
const validators = require('../validators/auth.validator');
const { authenticate } = require('../../../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', validators.registerValidator, authController.register);
router.post('/login', validators.loginValidator, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refresh);

// Protected routes
router.post('/change-password', authenticate, validators.changePasswordValidator, authController.changePassword);
router.get('/me', authenticate, authController.getProfile);

module.exports = router;
