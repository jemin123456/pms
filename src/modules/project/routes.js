const express = require('express');
const projectController = require('./controller');
const {
  createProjectValidator,
  updateProjectValidator,
  projectIdValidator,
} = require('./validator');
const { authenticate } = require('../../middlewares/auth');

const router = express.Router();

// All project routes require authentication
router.use(authenticate);

router.post('/', createProjectValidator, (req, res, next) => projectController.create(req, res, next));
router.get('/', (req, res, next) => projectController.list(req, res, next));

router.get('/:id', projectIdValidator, (req, res, next) => projectController.getById(req, res, next));
router.put('/:id', updateProjectValidator, (req, res, next) => projectController.update(req, res, next));
router.delete('/:id', projectIdValidator, (req, res, next) => projectController.delete(req, res, next));

module.exports = router;
