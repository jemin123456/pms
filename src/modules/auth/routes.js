const express = require('express');
const authController = require('./controller');
const { registerValidator, loginValidator } = require('./validator');
const { authenticate } = require('../../middlewares/auth');

const router = express.Router();

router.post('/register', registerValidator, (req, res, next) => authController.register(req, res, next));
router.post('/login', loginValidator, (req, res, next) => authController.login(req, res, next));
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
router.post('/logout', (req, res, next) => authController.logout(req, res, next));
router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));
router.get('/users', authenticate, (req, res, next) => authController.listUsers(req, res, next));

module.exports = router;
