const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
} = require('./project.controller');
const { protect } = require('../auth/auth.middleware');
const attachAbility = require('../../middleware/attachAbility');
const authorize = require('../../middleware/authorize');
const policyGate = require('../../middleware/policyGate');

// All routes require authentication
router.use(protect);
router.use(attachAbility);

// ── Project CRUD ──────────────────────────────────────────────────────────────
router.route('/')
  .post(authorize('create', 'Project'), createProject)
  .get(authorize('read', 'Project'), getProjects);

router.route('/:id')
  .get(policyGate('ProjectPolicy', 'read'), getProject)
  .put(policyGate('ProjectPolicy', 'update'), updateProject)
  .delete(policyGate('ProjectPolicy', 'delete'), deleteProject);

// ── Project Members ───────────────────────────────────────────────────────────
// GET  /api/projects/:id/members     — view project team (any workspace member)
// POST /api/projects/:id/members     — add member (admin/super admin only; enforced in controller)
router.route('/:id/members')
  .get(policyGate('ProjectPolicy', 'read'), getProjectMembers)
  .post(policyGate('ProjectPolicy', 'read'), addProjectMember);

// DELETE /api/projects/:id/members/:userId  — remove member (admin/super admin only)
router.delete('/:id/members/:userId', policyGate('ProjectPolicy', 'read'), removeProjectMember);

module.exports = router;
