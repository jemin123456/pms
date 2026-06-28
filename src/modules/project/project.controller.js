const Project = require('./project.model');

exports.createProject = async (req, res, next) => {
  try {
    const { name, description, techStack, budget, status } = req.body;

    const project = await Project.create({
      name,
      description,
      techStack,
      budget,
      status,
      tenantId: req.tenantId,
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    next(error);
  }
};

exports.getProject = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: req.project });
  } catch (error) {
    next(error);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.tenantId;

    const project = await Project.findByIdAndUpdate(
      req.project._id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    await Project.findByIdAndDelete(req.project._id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
