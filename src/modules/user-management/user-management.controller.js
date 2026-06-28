const User = require("../user/user.model");

// ─────────────────────────────────────────────
// Role Hierarchy — higher number = more authority
// ─────────────────────────────────────────────
const ROLE_HIERARCHY = {
  "super admin": 5,
  admin: 4,
  "project manager": 3,
  developer: 2,
  tester: 2,
  "backend developer": 2,
  "frontend developer": 2,
  "database administrator": 2,
};

/**
 * Returns true if the actor has MORE authority than the target.
 * Super admin can always act on anyone.
 * Anyone else can only act on roles strictly LOWER than their own.
 */
const canActOnRole = (actorRole, targetRole) => {
  if (actorRole === "super admin") return true;
  const actorRank = ROLE_HIERARCHY[actorRole] || 0;
  const targetRank = ROLE_HIERARCHY[targetRole] || 0;
  return actorRank > targetRank;
};

// @desc    Get all users in active workspace
// @route   GET /api/user-management/users
// @access  Private (Admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      "memberships.tenantId": req.tenantId,
    }).select("name email memberships");

    const mapped = users.map((user) => {
      const membership = user.memberships.find(
        (m) => m.tenantId.toString() === req.tenantId.toString(),
      );
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: membership.role,
        status: membership.status || "active",
      };
    });

    res.status(200).json({ success: true, data: mapped });
  } catch (err) {
    next(err);
  }
};

// @desc    Add new user to workspace (direct creation)
// @route   POST /api/user-management/users
// @access  Private (Admin only)
exports.addUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // ── Policy: Cannot assign a role equal to or higher than own role ──
    if (!canActOnRole(req.userRole, role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: You cannot assign the "${role}" role as it equals or exceeds your own authority level`,
      });
    }

    // Find user by email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Check if they are already in this workspace
      const isMember = user.memberships.some(
        (m) => m.tenantId.toString() === req.tenantId.toString(),
      );
      if (isMember) {
        return res.status(400).json({
          success: false,
          message: "User is already a member of this workspace",
        });
      }

      // Link existing user to this workspace
      user.memberships.push({
        tenantId: req.tenantId,
        role,
        status: "active",
      });
      await user.save();
    } else {
      // Create a new user profile completely
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        memberships: [
          {
            tenantId: req.tenantId,
            role,
            status: "active",
          },
        ],
      });
    }

    res.status(201).json({
      success: true,
      message: `User ${user.name} added successfully with the role "${role}"!`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
        status: "active",
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign/update role for a workspace user
// @route   PUT /api/user-management/users/:id/role
// @access  Private (Admin only)
exports.assignRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;

    if (!role) {
      return res
        .status(400)
        .json({ success: false, message: "Role is required" });
    }

    // ── Policy: Cannot change your own role ──
    if (targetUserId.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const membership = user.memberships.find(
      (m) => m.tenantId.toString() === req.tenantId.toString(),
    );
    if (!membership) {
      return res.status(400).json({
        success: false,
        message: "User is not a member of this workspace",
      });
    }

    // ── Policy: Cannot modify a user with equal or higher role ──
    if (!canActOnRole(req.userRole, membership.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: You cannot modify a user with the "${membership.role}" role as it equals or exceeds your authority level`,
      });
    }

    // ── Policy: Cannot assign a role equal to or higher than own ──
    if (!canActOnRole(req.userRole, role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: You cannot assign the "${role}" role as it equals or exceeds your own authority level`,
      });
    }

    membership.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Role updated to "${role}" successfully for ${user.name}!`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
        status: membership.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Archive user in active workspace (soft-disable)
// @route   PUT /api/user-management/users/:id/archive
// @access  Private (Admin only)
exports.archiveUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    // ── Policy: Cannot archive yourself ──
    if (targetUserId.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot archive your own account",
      });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const membership = user.memberships.find(
      (m) => m.tenantId.toString() === req.tenantId.toString(),
    );
    if (!membership) {
      return res.status(400).json({
        success: false,
        message: "User is not a member of this workspace",
      });
    }

    // ── Policy: Cannot archive a user with equal or higher role ──
    if (!canActOnRole(req.userRole, membership.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: You cannot archive a user with the "${membership.role}" role as it equals or exceeds your authority level`,
      });
    }

    // ── Policy: Cannot re-archive an already archived user ──
    if (membership.status === "archived") {
      return res.status(400).json({
        success: false,
        message: "User is already archived in this workspace",
      });
    }

    membership.status = "archived";
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been archived from this workspace.`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: membership.role,
        status: "archived",
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reactivate archived user in workspace
// @route   PUT /api/user-management/users/:id/activate
// @access  Private (Admin only)
exports.activateUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    const user = await User.findById(targetUserId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const membership = user.memberships.find(
      (m) => m.tenantId.toString() === req.tenantId.toString(),
    );
    if (!membership) {
      return res.status(400).json({
        success: false,
        message: "User is not a member of this workspace",
      });
    }

    // ── Policy: Cannot reactivate a user with equal or higher role ──
    if (!canActOnRole(req.userRole, membership.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: You cannot reactivate a user with the "${membership.role}" role as it equals or exceeds your authority level`,
      });
    }

    // ── Policy: Cannot reactivate an already-active user ──
    if (membership.status === "active") {
      return res.status(400).json({
        success: false,
        message: "User is already active in this workspace",
      });
    }

    membership.status = "active";
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been reactivated in this workspace.`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: membership.role,
        status: "active",
      },
    });
  } catch (err) {
    next(err);
  }
};
