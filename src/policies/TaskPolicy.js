const Policy = require('./Policy');

class TaskPolicy extends Policy {
  canCreate() {
    return true;
  }

  canRead(task) {
    if (!task) return true;
    return task.tenantId.toString() === this.tenantId.toString();
  }

  canUpdate(task) {
    if (!task) return true;
    return this.isAdmin() || (task.assignedTo && task.assignedTo.toString() === this.user._id.toString());
  }

  canDelete(task) {
    return this.isAdmin();
  }
}

module.exports = TaskPolicy;
