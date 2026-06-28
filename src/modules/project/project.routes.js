const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} = require('./project.controller');
const { protect } = require('../auth/auth.middleware');
const attachAbility = require('../../middleware/attachAbility');
const authorize = require('../../middleware/authorize');
const policyGate = require('../../middleware/policyGate');

router.use(protect);
router.use(attachAbility);

router.route('/')
  .post(authorize('create', 'Project'), createProject)
  .get(authorize('read', 'Project'), getProjects);

router.route('/:id')
  .get(policyGate('ProjectPolicy', 'read'), getProject)
  .put(policyGate('ProjectPolicy', 'update'), updateProject)
  .delete(policyGate('ProjectPolicy', 'delete'), deleteProject);

module.exports = router;
