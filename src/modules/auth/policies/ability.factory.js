const { createMongoAbility, AbilityBuilder } = require('@casl/ability');

/**
 * Recursively parse and interpolate placeholder values in permission conditions.
 * Example: { "createdBy": "${user._id}" } -> { "createdBy": "60a735c0..." }
 */
const interpolateConditions = (conditions, user) => {
  if (!conditions || typeof conditions !== 'object') return conditions;

  const jsonString = JSON.stringify(conditions);
  const interpolatedString = jsonString.replace(/\${user\._id}/g, user._id.toString())
                                        .replace(/\${user\.id}/g, user._id.toString())
                                        .replace(/\${user\.department}/g, user.department || '');

  return JSON.parse(interpolatedString);
};

const defineAbilityFor = (user) => {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  // If user is not authenticated, they can only view public details
  if (!user || !user.role) {
    return build();
  }

  const roleCode = user.role.code;

  // Super Admin bypass
  if (roleCode === 'SUPER_ADMIN') {
    can('manage', 'all');
    return build();
  }

  // Parse permissions from the user's role
  const permissions = user.role.permissions || [];

  permissions.forEach((perm) => {
    const action = perm.action;
    const subject = perm.subject;
    
    // Interpolate conditions if present
    let conditions = perm.conditions;
    if (conditions) {
      conditions = interpolateConditions(conditions, user);
    }

    const fields = perm.fields && perm.fields.length > 0 ? perm.fields : undefined;

    // Define permission
    can(action, subject, fields, conditions);
  });

  // Base user restrictions (e.g. self profile updating is always allowed unless overridden)
  // An user can manage their own profile anyway:
  can('read', 'User', { _id: user._id });
  can('update', 'User', ['name', 'profilePicture', 'bio', 'contactDetails', 'skills', 'timeZone'], { _id: user._id });

  return build();
};

module.exports = {
  defineAbilityFor
};
