const projectService = require('./service');
const ProjectDto = require('./dto');
const { AuthorizationError } = require('../../utils/errors');

class ProjectController {
  async create(req, res, next) {
    try {
      // 1. Static CASL check: Can user create projects?
      if (req.ability.cannot('create', 'Project')) {
        throw new AuthorizationError('You do not have permission to create projects');
      }

      // 2. Perform creation
      const project = await projectService.createProject(req.body, req.user._id);

      res.status(201).json({
        status: 'success',
        data: {
          project: ProjectDto.toResponse(project),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      // Fetch projects filtered automatically at database level by CASL Mongo ability
      const projects = await projectService.listProjects({}, req.ability);

      res.status(200).json({
        status: 'success',
        results: projects.length,
        data: {
          projects: ProjectDto.toCollectionResponse(projects),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const project = await projectService.getProject(req.params.id);

      // Instance Level CASL check: Can user read this specific project?
      if (req.ability.cannot('read', project)) {
        throw new AuthorizationError('You do not have permission to view this project');
      }

      res.status(200).json({
        status: 'success',
        data: {
          project: ProjectDto.toResponse(project),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const project = await projectService.getProject(req.params.id);

      // Instance Level CASL check: Can user update this specific project?
      if (req.ability.cannot('update', project)) {
        throw new AuthorizationError('You do not have permission to edit this project');
      }

      const updatedProject = await projectService.updateProject(
        req.params.id,
        req.body,
        req.user._id
      );

      res.status(200).json({
        status: 'success',
        data: {
          project: ProjectDto.toResponse(updatedProject),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const project = await projectService.getProject(req.params.id);

      // Instance Level CASL check: Can user delete this specific project?
      if (req.ability.cannot('delete', project)) {
        throw new AuthorizationError('You do not have permission to delete this project');
      }

      const response = await projectService.deleteProject(req.params.id, req.user._id);

      res.status(200).json({
        status: 'success',
        message: response.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProjectController();
