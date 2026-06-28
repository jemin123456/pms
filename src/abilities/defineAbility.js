const { AbilityBuilder, PureAbility } = require('@casl/ability');

/**
 * Defines CASL abilities for the user in the active tenant workspace.
 */
function defineAbility(user, activeTenantId) {
  const { can, cannot, build } = new AbilityBuilder(PureAbility);

  if (!user || !user.memberships || !activeTenantId) {
    return build();
  }

  // Find membership in active tenant
  const membership = user.memberships.find(
    (m) => m.tenantId.toString() === activeTenantId.toString()
  );

  if (membership && membership.status !== 'archived') {
    const role = membership.role;

    if (role === 'super admin' || role === 'admin') {
      // Full admin rights
      can('manage', 'all');
    } else if (role === 'project manager') {
      // Can view all documents and create/update projects, but cannot manage users
      can('read', 'all');
      can('create', 'Project');
      can('update', 'Project');
      can('delete', 'Project');
      can('manage', 'Task');
    } else {
      // Developer, Tester, backend, frontend, DBA get read-only by default
      can('read', 'all');
      
      // Allow they to manage tasks assigned to them, and create tasks
      can('create', 'Task');
      can('read', 'Task');
    }
  }

  return build();
}

module.exports = defineAbility;
