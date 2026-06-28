const projectRepository = require('./repository');
const userRepository = require('../user/repository');
const {
  ValidationError,
  NotFoundError,
  DuplicateError,
} = require('../../utils/errors');

class ProjectService {
  async createProject(projectData, creatorId) {
    const { name, code, manager, members, client } = projectData;

    // 1. Verify code uniqueness
    const codeExists = await projectRepository.findByCode(code);
    if (codeExists) {
      throw new DuplicateError(`Project code '${code}' is already in use`);
    }

    // 2. Validate Manager
    const managerUser = await userRepository.findById(manager);
    if (!managerUser) {
      throw new ValidationError(`Designated manager with ID '${manager}' does not exist`);
    }

    // 3. Validate Members
    if (members && members.length > 0) {
      for (const memberId of members) {
        const memberUser = await userRepository.findById(memberId);
        if (!memberUser) {
          throw new ValidationError(`Team member with ID '${memberId}' does not exist`);
        }
      }
    }

    // 4. Validate Client if provided
    if (client) {
      const clientUser = await userRepository.findById(client);
      if (!clientUser) {
        throw new ValidationError(`Client with ID '${client}' does not exist`);
      }
    }

    // 5. Build project
    const finalProjectData = {
      ...projectData,
      createdBy: creatorId,
      updatedBy: creatorId,
    };

    return projectRepository.create(finalProjectData);
  }

  async listProjects(filter = {}, ability = null) {
    return projectRepository.findAll(filter, ability);
  }

  async getProject(id) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError(`Project not found`);
    }
    return project;
  }

  async updateProject(id, updateData, updaterId) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError(`Project not found`);
    }

    // If code is changed, verify uniqueness
    if (updateData.code && updateData.code.toUpperCase() !== project.code) {
      const codeExists = await projectRepository.findByCode(updateData.code);
      if (codeExists) {
        throw new DuplicateError(`Project code '${updateData.code}' is already in use`);
      }
    }

    // Validate Manager if updated
    if (updateData.manager && updateData.manager !== project.manager.toString()) {
      const managerUser = await userRepository.findById(updateData.manager);
      if (!managerUser) {
        throw new ValidationError(`Designated manager with ID '${updateData.manager}' does not exist`);
      }
    }

    // Validate Members if updated
    if (updateData.members) {
      for (const memberId of updateData.members) {
        const memberUser = await userRepository.findById(memberId);
        if (!memberUser) {
          throw new ValidationError(`Team member with ID '${memberId}' does not exist`);
        }
      }
    }

    const finalUpdateData = {
      ...updateData,
      updatedBy: updaterId,
    };

    return projectRepository.update(id, finalUpdateData);
  }

  async deleteProject(id, userId) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError(`Project not found`);
    }

    await projectRepository.delete(id, userId);
    return { message: 'Project deleted successfully' };
  }
}

module.exports = new ProjectService();
