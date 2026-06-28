const Policy = require('./Policy');

class ProjectPolicy extends Policy {
  canCreate() {
    return this.isAdmin() || this.role === 'project manager';
  }

  canRead(project) {
    if (!project) return true;
    return project.tenantId.toString() === this.tenantId.toString();
  }

  canUpdate(project) {
    if (!project) return this.isAdmin() || this.role === 'project manager';
    return (this.isAdmin() || this.role === 'project manager') && project.tenantId.toString() === this.tenantId.toString();
  }

  canDelete(project) {
    if (!project) return this.isAdmin() || this.role === 'project manager';
    return (this.isAdmin() || this.role === 'project manager') && project.tenantId.toString() === this.tenantId.toString();
  }
}

module.exports = ProjectPolicy;
