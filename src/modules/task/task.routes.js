const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} = require('./task.controller');
const { protect } = require('../auth/auth.middleware');
const attachAbility = require('../../middleware/attachAbility');
const authorize = require('../../middleware/authorize');
const policyGate = require('../../middleware/policyGate');

// All routes require authentication
router.use(protect);
router.use(attachAbility);

// --- Task CRUD ---
router.route('/')
  .post(authorize('create', 'Task'), createTask)
  .get(authorize('read', 'Task'), getTasks);

router.route('/:id')
  .get(policyGate('TaskPolicy', 'read'), getTask)
  .put(policyGate('TaskPolicy', 'update'), updateTask)
  .delete(policyGate('TaskPolicy', 'delete'), deleteTask);

// --- Task status updates ---
router.route('/:id/status')
  .patch(policyGate('TaskPolicy', 'updateStatus'), updateTaskStatus)
  .put(policyGate('TaskPolicy', 'updateStatus'), updateTaskStatus);

module.exports = router;
