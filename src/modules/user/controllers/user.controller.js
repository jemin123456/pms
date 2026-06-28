const userService = require('../services/user.service');
const UserPolicy = require('../policies/user.policy');
const UserDto = require('../dtos/user.dto');
const { AuthorizationError } = require('../../../errors/customErrors');

class UserController {
  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);

      // CASL Authorization Check
      if (!UserPolicy.canRead(req.ability, user)) {
        throw new AuthorizationError('You are not authorized to view this user profile.');
      }

      res.status(200).json({
        status: 'success',
        data: UserDto.toResponse(user)
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      // CASL Authorization Check
      if (!UserPolicy.canCreate(req.ability)) {
        throw new AuthorizationError('You are not authorized to create users.');
      }

      const user = await userService.createUser({
        ...req.body,
        createdBy: req.user ? req.user._id : null
      });

      res.status(201).json({
        status: 'success',
        data: UserDto.toResponse(user)
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const userToUpdate = await userService.getUserById(req.params.id);

      // CASL Authorization Check
      const updatedFields = Object.keys(req.body);
      if (!UserPolicy.canUpdate(req.ability, userToUpdate, updatedFields)) {
        throw new AuthorizationError('You are not authorized to update this user profile or these specific fields.');
      }

      // Check if user is changing role (only Super Admin / Admin can change roles)
      if (req.body.roleCode || req.body.role) {
        const canManageRoles = req.ability.can('manage', 'Role') || req.ability.can('assign', 'Role');
        if (!canManageRoles) {
          throw new AuthorizationError('You are not authorized to change roles.');
        }
      }

      const updatedUser = await userService.updateUser(req.params.id, req.body, req.user._id);

      res.status(200).json({
        status: 'success',
        data: UserDto.toResponse(updatedUser)
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const userToDelete = await userService.getUserById(req.params.id);

      // CASL Authorization Check
      if (!UserPolicy.canDelete(req.ability, userToDelete)) {
        throw new AuthorizationError('You are not authorized to delete this user.');
      }

      await userService.deleteUser(req.params.id, req.user._id);

      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req, res, next) {
    try {
      // Check if actor has ability to read list of Users
      if (!req.ability.can('read', 'User')) {
        throw new AuthorizationError('You are not authorized to list users.');
      }

      const page = req.query.page || 1;
      const limit = req.query.limit || 10;
      const sort = req.query.sort || '-createdAt';
      
      const { items, total } = await userService.listUsers(req.query, page, limit, sort);

      res.status(200).json({
        status: 'success',
        results: items.length,
        total,
        page,
        limit,
        data: UserDto.toResponseList(items)
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
