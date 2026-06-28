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
    
    // Admins, Super Admins, and Project Managers can update any task in the tenant
    const isLeadOrAdmin = this.isAdmin() || this.role === 'project manager';
    if (isLeadOrAdmin) {
      return task.tenantId.toString() === this.tenantId.toString();
    }

    // Task assignee or creator can also update it
    const isAssignee = task.assignedTo && task.assignedTo.toString() === this.user._id.toString();
    const isCreator = task.createdBy && task.createdBy.toString() === this.user._id.toString();
    
    return (isAssignee || isCreator) && task.tenantId.toString() === this.tenantId.toString();
  }

  canUpdateStatus(task) {
    if (!task) return true;

    // Anyone authorized to update can update the status
    return this.canUpdate(task);
  }

  canDelete(task) {
    if (!task) return this.isAdmin() || this.role === 'project manager';
    
    // Only Admins, Super Admins, and Project Managers can delete tasks
    return (this.isAdmin() || this.role === 'project manager') && task.tenantId.toString() === this.tenantId.toString();
  }
}

module.exports = TaskPolicy;
