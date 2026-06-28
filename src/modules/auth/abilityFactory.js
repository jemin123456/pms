const { createMongoAbility, AbilityBuilder } = require('@casl/ability');

/**
 * Define abilities for a user based on their role and permissions.
 * @param {Object} user - The user object containing role and permissions
 * @returns {MongoAbility}
 */
const defineAbilitiesFor = (user) => {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  if (!user || !user.role) {
    // Guest or unauthenticated user
    return build();
  }

  const roleName = user.role.name;
  const permissions = user.role.permissions || [];

  // Super Admin bypasses all checks
  if (permissions.includes('manage_all') || roleName === 'Super Admin') {
    can('manage', 'all');
    return build();
  }

  // Map permissions from database
  permissions.forEach((permission) => {
    const parts = permission.split('_');
    if (parts.length >= 2) {
      const action = parts[0]; // e.g. 'create', 'read', 'update', 'delete'
      const subject = parts.slice(1).join('_'); // e.g. 'project', 'task', 'user'
      
      // Capitalize subject to match Mongoose Model names (e.g. 'project' -> 'Project')
      const modelName = subject.charAt(0).toUpperCase() + subject.slice(1);
      
      if (permission === 'update_task_status') {
        can('update_status', 'Task');
      } else if (permission === 'apply_leave') {
        can('create', 'Leave');
      } else if (permission === 'log_time') {
        can('create', 'Timesheet');
      } else {
        can(action, modelName);
      }
    }
  });

  // Dynamic conditions (Instance Level Authorization):
  // 1. Users can always read and update their own profile details
  can('update', 'User', { _id: user._id });
  can('read', 'User', { _id: user._id });

  // 2. Project reading scoping: Public, or managed by user, or user is a member
  can('read', 'Project', {
    $or: [
      { visibility: 'Public' },
      { manager: user._id },
      { members: user._id },
    ]
  });

  // 3. Project Managers can manage only projects they are assigned to manage
  if (roleName === 'Project Manager') {
    can(['update', 'delete'], 'Project', { manager: user._id });
  }

  // 3. Employees and Leads can only manage tasks assigned to or reported by them
  if (roleName === 'Employee' || roleName === 'Team Lead') {
    can('update', 'Task', { assignee: user._id });
    can('update', 'Task', { reporter: user._id });
    
    // Can only manage their own leaves/timesheets
    can(['read', 'update', 'delete'], 'Leave', { createdBy: user._id });
    can(['read', 'update', 'delete'], 'Timesheet', { createdBy: user._id });
  }

  return build();
};

module.exports = { defineAbilitiesFor };
