const { subject } = require('@casl/ability');

class UserPolicy {
  /**
   * Checks if the actor can read a user profile.
   */
  static canRead(ability, targetUser) {
    // If targetUser is a plain object, wrap it with CASL subject name so conditions can be matched
    const target = typeof targetUser === 'object' && targetUser.constructor.name === 'Object' 
      ? subject('User', targetUser) 
      : targetUser;
    return ability.can('read', target);
  }

  /**
   * Checks if the actor can update a user profile, optionally checking specific fields.
   */
  static canUpdate(ability, targetUser, fields = []) {
    const target = typeof targetUser === 'object' && targetUser.constructor.name === 'Object' 
      ? subject('User', targetUser) 
      : targetUser;

    if (fields.length > 0) {
      return fields.every(field => ability.can('update', target, field));
    }
    return ability.can('update', target);
  }

  /**
   * Checks if the actor can create a user.
   */
  static canCreate(ability) {
    return ability.can('create', 'User');
  }

  /**
   * Checks if the actor can delete a user.
   */
  static canDelete(ability, targetUser) {
    const target = typeof targetUser === 'object' && targetUser.constructor.name === 'Object' 
      ? subject('User', targetUser) 
      : targetUser;
    return ability.can('delete', target);
  }
}

module.exports = UserPolicy;
