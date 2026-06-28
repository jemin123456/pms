class Policy {
  constructor(user, tenantId, role) {
    this.user = user;
    this.tenantId = tenantId;
    this.role = role;
  }

  isAdmin() {
    return this.role === 'admin';
  }

  isEmployee() {
    return this.role === 'employee';
  }
}

module.exports = Policy;
