const Project = require('./project.model');
const User = require('../user/user.model');

// ─────────────────────────────────────────────────────────────────────────────
// Role Hierarchy — higher number = more authority
// (mirrors the same map in user-management.controller.js)
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_HIERARCHY = {
  'super admin': 5,
  admin: 4,
  'project manager': 3,
  developer: 2,
  tester: 2,
  'backend developer': 2,
  'frontend developer': 2,
  'database administrator': 2,
};

const canActOnRole = (actorRole, targetRole) => {
  if (actorRole === 'super admin') return true;
  return (ROLE_HIERARCHY[actorRole] || 0) > (ROLE_HIERARCHY[targetRole] || 0);
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin / Project Manager)
// ─────────────────────────────────────────────────────────────────────────────
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, techStack, budget, status } = req.body;

    const project = await Project.create({
      name,
      description,
      techStack,
      budget,
      status,
      tenantId: req.tenantId,
      members: [],
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all projects for active workspace
// @route   GET /api/projects
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private (same tenant)
// ─────────────────────────────────────────────────────────────────────────────
exports.getProject = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: req.project });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin / Project Manager, same tenant)
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProject = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.tenantId;
    delete updates.members; // Members are managed via dedicated routes

    const project = await Project.findByIdAndUpdate(
      req.project._id,
      updates,
      { new: true, runValidators: true },
    );

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin / Project Manager, same tenant)
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteProject = async (req, res, next) => {
  try {
    await Project.findByIdAndDelete(req.project._id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT MEMBER MANAGEMENT
// Members are workspace users explicitly added to a specific project.
// Separate from workspace-level user management (done on the dashboard).
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Get project team members
// @route   GET /api/projects/:id/members
// @access  Private (any workspace member can view)
exports.getProjectMembers = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members.userId', 'name email memberships');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Tenant isolation: project must belong to the active workspace
    if (project.tenantId.toString() !== req.tenantId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: Project not in your workspace' });
    }

    // Map each member to a clean response including their workspace role/status
    const members = project.members.map(m => {
      const user = m.userId;
      if (!user) return null;

      const membership = user.memberships?.find(
        ms => ms.tenantId.toString() === req.tenantId.toString(),
      );

      return {
        userId:        user._id,
        name:          user.name,
        email:         user.email,
        workspaceRole: membership?.role   || 'developer',
        status:        membership?.status || 'active',
        addedAt:       m.addedAt,
      };
    }).filter(Boolean); // Remove nulls from deleted users

    res.status(200).json({ success: true, count: members.length, data: members });
  } catch (err) {
    next(err);
  }
};

// @desc    Add a workspace user to the project team
// @route   POST /api/projects/:id/members
// @access  Private (Admin / Super Admin only)
exports.addProjectMember = async (req, res, next) => {
  try {
    const { userId } = req.body;

    // ── Policy: Only admin/super admin can add project members ──
    if (!['super admin', 'admin'].includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only administrators can add project team members',
      });
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // ── Tenant isolation ──
    if (project.tenantId.toString() !== req.tenantId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: Project not in your workspace' });
    }

    // ── Verify target user is a workspace member ──
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const targetMembership = targetUser.memberships.find(
      m => m.tenantId.toString() === req.tenantId.toString(),
    );
    if (!targetMembership) {
      return res.status(400).json({
        success: false,
        message: 'User is not a member of this workspace — add them to the workspace first',
      });
    }

    // ── Policy: Cannot add a user with equal/higher workspace role ──
    if (!canActOnRole(req.userRole, targetMembership.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: You cannot add a user with the "${targetMembership.role}" role as it equals or exceeds your authority level`,
      });
    }

    // ── Policy: Cannot add an archived user ──
    if (targetMembership.status === 'archived') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add an archived user to the project — reactivate them first',
      });
    }

    // ── Idempotency: already a project member? ──
    const alreadyMember = project.members.some(
      m => m.userId.toString() === userId.toString(),
    );
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this project' });
    }

    project.members.push({ userId, addedAt: new Date() });
    await project.save();

    res.status(200).json({
      success: true,
      message: `${targetUser.name} added to the project team successfully!`,
      data: {
        userId:        targetUser._id,
        name:          targetUser.name,
        email:         targetUser.email,
        workspaceRole: targetMembership.role,
        status:        targetMembership.status,
        addedAt:       new Date(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove a user from the project team
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Admin / Super Admin only)
exports.removeProjectMember = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;

    // ── Policy: Only admin/super admin can remove project members ──
    if (!['super admin', 'admin'].includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only administrators can remove project team members',
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // ── Tenant isolation ──
    if (project.tenantId.toString() !== req.tenantId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: Project not in your workspace' });
    }

    // ── Policy: Role hierarchy check on target ──
    const targetUser = await User.findById(targetUserId);
    if (targetUser) {
      const targetMembership = targetUser.memberships.find(
        m => m.tenantId.toString() === req.tenantId.toString(),
      );
      if (targetMembership && !canActOnRole(req.userRole, targetMembership.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied: You cannot remove a user with the "${targetMembership.role}" role as it equals or exceeds your authority level`,
        });
      }
    }

    // ── Find and remove ──
    const memberIndex = project.members.findIndex(
      m => m.userId.toString() === targetUserId.toString(),
    );
    if (memberIndex === -1) {
      return res.status(400).json({ success: false, message: 'User is not a member of this project' });
    }

    project.members.splice(memberIndex, 1);
    await project.save();

    res.status(200).json({
      success: true,
      message: `${targetUser?.name || 'User'} removed from the project team.`,
    });
  } catch (err) {
    next(err);
  }
};
