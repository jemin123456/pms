const Policy = require('./Policy');

class UserPolicy extends Policy {
  canRead(targetUser) {
    if (!targetUser) return true;
    return targetUser.memberships.some(m => m.tenantId.toString() === this.tenantId.toString());
  }

  canUpdate(targetUser) {
    return this.isAdmin();
  }
}

module.exports = UserPolicy;
