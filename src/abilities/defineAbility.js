const { AbilityBuilder, PureAbility } = require("@casl/ability");

/**
 * Defines CASL abilities for the user in the active tenant workspace.
 *
 * Role hierarchy (controller layer enforces fine-grained role-rank checks):
 *   super admin (5) > admin (4) > project manager (3) > developer/tester/etc (2)
 */
function defineAbility(user, activeTenantId) {
  const { can, cannot, build } = new AbilityBuilder(PureAbility);

  if (!user || !user.memberships || !activeTenantId) {
    return build();
  }

  // Find membership in active tenant
  const membership = user.memberships.find(
    (m) => m.tenantId.toString() === activeTenantId.toString(),
  );

  if (membership && membership.status !== "archived") {
    const role = membership.role;

    if (role === "super admin") {
      // Unrestricted — full system control
      can("manage", "all");

    } else if (role === "admin") {
      // Full workspace management except cannot manage super admins
      // (fine-grained hierarchy checks are enforced at the controller layer)
      can("manage", "all");
      // Explicit: admins cannot promote anyone to super admin
      cannot("assign", "SuperAdminRole");

    } else if (role === "project manager") {
      // Can manage all project & task data, but NOT workspace users
      can("read", "all");
      can("create", "Project");
      can("update", "Project");
      can("delete", "Project");
      can("manage", "Task");
      cannot("manage", "User");

    } else {
      // Developer, Tester, Backend Developer, Frontend Developer, DBA
      // Read-only access; can create tasks
      can("read", "all");
      can("create", "Task");
      can("read", "Task");
      cannot("manage", "User");
      cannot("manage", "Project");
    }
  }

  return build();
}

module.exports = defineAbility;
