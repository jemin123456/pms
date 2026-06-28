const Task = require('./task.model');
const Project = require('../project/project.model');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (All workspace members can create tasks)
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, projectId, assignedTo, dueDate } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide task title and project ID',
      });
    }

    // Validate that project exists and belongs to the same tenant workspace
    const project = await Project.findOne({ _id: projectId, tenantId: req.tenantId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Associated Project not found in this workspace',
      });
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      projectId,
      tenantId: req.tenantId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      dueDate: dueDate || null,
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks in active workspace
// @route   GET /api/tasks
// @access  Private (Read tasks)
exports.getTasks = async (req, res, next) => {
  try {
    const query = { tenantId: req.tenantId };

    // Support optional filter by project
    if (req.query.projectId) {
      query.projectId = req.query.projectId;
    }

    // Support optional filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Support optional filter by assignedTo
    if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private (Workspace member)
exports.getTask = async (req, res, next) => {
  try {
    const task = await req.task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'projectId', select: 'name' }
    ]);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private (Admins, PMs, Assignees/Creators)
exports.updateTask = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    
    // Protect internal fields from direct body modification
    delete updates.tenantId;
    delete updates.createdBy;

    // Check authority: regular users (developers/testers/etc.) can only update status
    const isLeadOrAdmin = req.userRole === 'super admin' || req.userRole === 'admin' || req.userRole === 'project manager';
    if (!isLeadOrAdmin) {
      const allowedKeys = ['status'];
      const updateKeys = Object.keys(updates);
      const isViolation = updateKeys.some(key => !allowedKeys.includes(key));
      
      if (isViolation) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Regular users are only permitted to update task status',
        });
      }
    }

    // If project is being changed, validate new project belongs to workspace
    if (updates.projectId) {
      const project = await Project.findOne({ _id: updates.projectId, tenantId: req.tenantId });
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Target Project not found in this workspace',
        });
      }
    }

    const task = await Task.findByIdAndUpdate(
      req.task._id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'projectId', select: 'name' }
    ]);

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task status specifically
// @route   PATCH /api/tasks/:id/status
// @access  Private (Admins, PMs, Assignees/Creators)
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status value is required',
      });
    }

    const task = await Task.findByIdAndUpdate(
      req.task._id,
      { status },
      { new: true, runValidators: true }
    ).populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'projectId', select: 'name' }
    ]);

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Admins and PMs only)
exports.deleteTask = async (req, res, next) => {
  try {
    await Task.findByIdAndDelete(req.task._id);
    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};
