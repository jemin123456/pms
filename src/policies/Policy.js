class Policy {
  constructor(user, tenantId, role) {
    this.user = user;
    this.tenantId = tenantId;
    this.role = role;
  }

  isAdmin() {
    return this.role === 'super admin' || this.role === 'admin';
  }

  isEmployee() {
    return this.role !== 'super admin' && this.role !== 'admin';
  }
}

module.exports = Policy;
