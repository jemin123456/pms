const Project = require('./model');
const { accessibleBy } = require('@casl/mongoose');

class ProjectRepository {
  async findByCode(code) {
    return Project.findOne({ code })
      .populate('manager', 'name email designation profilePicture')
      .populate('members', 'name email designation profilePicture')
      .populate('client', 'name email designation');
  }

  async findById(id) {
    return Project.findById(id)
      .populate('manager', 'name email designation profilePicture')
      .populate('members', 'name email designation profilePicture')
      .populate('client', 'name email designation');
  }

  async findAll(filter = {}, ability = null) {
    let queryFilter = { ...filter };
    
    // Scopes queries dynamically via CASL rules
    if (ability) {
      const caslFilter = accessibleBy(ability, 'read');
      queryFilter = {
        $and: [
          caslFilter,
          queryFilter
        ]
      };
    }

    return Project.find(queryFilter)
      .populate('manager', 'name email designation profilePicture')
      .populate('members', 'name email designation profilePicture')
      .populate('client', 'name email designation')
      .sort({ createdAt: -1 });
  }

  async create(projectData) {
    const project = new Project(projectData);
    await project.save();
    return this.findById(project._id);
  }

  async update(id, updateData) {
    return Project.findByIdAndUpdate(id, updateData, { new: true })
      .populate('manager', 'name email designation profilePicture')
      .populate('members', 'name email designation profilePicture')
      .populate('client', 'name email designation');
  }

  async delete(id, userId) {
    const project = await Project.findById(id);
    if (!project) return null;
    return project.softDelete(userId);
  }
}

module.exports = new ProjectRepository();
