const User = require('../user/user.model');

// @desc    Get all users in active workspace
// @route   GET /api/user-management/users
// @access  Private (Admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      'memberships.tenantId': req.tenantId
    }).select('name email memberships');

    const mapped = users.map(user => {
      const membership = user.memberships.find(m => m.tenantId.toString() === req.tenantId.toString());
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: membership.role,
        status: membership.status || 'active'
      };
    });

    res.status(200).json({ success: true, data: mapped });
  } catch (err) {
    next(err);
  }
};

// @desc    Add new user to workspace
// @route   POST /api/user-management/users
// @access  Private (Admin only)
exports.addUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Find user by email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Check if they are already in this workspace
      const isMember = user.memberships.some(m => m.tenantId.toString() === req.tenantId.toString());
      if (isMember) {
        return res.status(400).json({ success: false, message: 'User is already a member of this workspace' });
      }

      // Link existing user to this workspace
      user.memberships.push({
        tenantId: req.tenantId,
        role,
        status: 'active'
      });
      await user.save();
    } else {
      // Create a new user profile completely
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        memberships: [{
          tenantId: req.tenantId,
          role,
          status: 'active'
        }]
      });
    }

    res.status(201).json({
      success: true,
      message: `User ${user.name} added successfully with the role ${role}!`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
        status: 'active'
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign role to user
// @route   PUT /api/user-management/users/:id/role
// @access  Private (Admin only)
exports.assignRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required' });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const membership = user.memberships.find(m => m.tenantId.toString() === req.tenantId.toString());
    if (!membership) {
      return res.status(400).json({ success: false, message: 'User is not a member of this workspace' });
    }

    membership.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Role updated to ${role} successfully for ${user.name}!`,
      data: { id: user._id, name: user.name, email: user.email, role, status: membership.status }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Archive user in active workspace
// @route   PUT /api/user-management/users/:id/archive
// @access  Private (Admin only)
exports.archiveUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    // Prevent self-archiving!
    if (targetUserId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot archive your own user account' });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const membership = user.memberships.find(m => m.tenantId.toString() === req.tenantId.toString());
    if (!membership) {
      return res.status(400).json({ success: false, message: 'User is not a member of this workspace' });
    }

    membership.status = 'archived';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been archived in this workspace.`,
      data: { id: user._id, name: user.name, email: user.email, role: membership.role, status: 'archived' }
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
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const membership = user.memberships.find(m => m.tenantId.toString() === req.tenantId.toString());
    if (!membership) {
      return res.status(400).json({ success: false, message: 'User is not a member of this workspace' });
    }

    membership.status = 'active';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been reactivated in this workspace.`,
      data: { id: user._id, name: user.name, email: user.email, role: membership.role, status: 'active' }
    });
  } catch (err) {
    next(err);
  }
};
