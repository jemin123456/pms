const Policy = require('./Policy');

class ProjectPolicy extends Policy {
  canCreate() {
    return this.isAdmin();
  }

  canRead(project) {
    if (!project) return true;
    return project.tenantId.toString() === this.tenantId.toString();
  }

  canUpdate(project) {
    if (!project) return this.isAdmin();
    return this.isAdmin() && project.tenantId.toString() === this.tenantId.toString();
  }

  canDelete(project) {
    if (!project) return this.isAdmin();
    return this.isAdmin() && project.tenantId.toString() === this.tenantId.toString();
  }
}

module.exports = ProjectPolicy;
