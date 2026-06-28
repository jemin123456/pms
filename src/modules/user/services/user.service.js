const userRepository = require('../repositories/user.repository');
const roleRepository = require('../repositories/role.repository');
const { NotFoundError, ConflictError } = require('../../../errors/customErrors');

class UserService {
  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    return user;
  }

  async createUser(userData) {
    // Check if email or username already exists
    const existingEmail = await userRepository.findByEmail(userData.email);
    if (existingEmail) {
      throw new ConflictError('A user with this email already exists');
    }

    const existingUsername = await userRepository.findByUsername(userData.username);
    if (existingUsername) {
      throw new ConflictError('A user with this username already exists');
    }

    // Resolve role
    let roleId = userData.role;
    if (userData.roleCode) {
      const role = await roleRepository.findByCode(userData.roleCode);
      if (!role) {
        throw new NotFoundError(`Role code ${userData.roleCode} not found`);
      }
      roleId = role._id;
    }

    if (!roleId) {
      // Default to EMPLOYEE
      const defaultRole = await roleRepository.findByCode('EMPLOYEE');
      if (!defaultRole) {
        throw new NotFoundError('Default role EMPLOYEE not found in the database');
      }
      roleId = defaultRole._id;
    }

    const newUser = await userRepository.create({
      ...userData,
      role: roleId
    });

    return userRepository.findById(newUser._id);
  }

  async updateUser(id, updateData, updaterId) {
    const user = await this.getUserById(id);

    // If email is changing, check duplicate
    if (updateData.email && updateData.email !== user.email) {
      const existing = await userRepository.findByEmail(updateData.email);
      if (existing) {
        throw new ConflictError('A user with this email already exists');
      }
    }

    // If role code is passed, resolve it
    if (updateData.roleCode) {
      const role = await roleRepository.findByCode(updateData.roleCode);
      if (!role) {
        throw new NotFoundError(`Role code ${updateData.roleCode} not found`);
      }
      updateData.role = role._id;
      delete updateData.roleCode;
    }

    // Update metadata
    updateData.updatedBy = updaterId;
    updateData.version = (user.version || 1) + 1;

    return userRepository.update(id, updateData);
  }

  async deleteUser(id, deleterId) {
    await this.getUserById(id);
    return userRepository.delete(id, deleterId);
  }

  async listUsers(query = {}, page = 1, limit = 10, sort = '-createdAt') {
    const skip = (page - 1) * limit;
    
    // Convert sort string like "-createdAt" to object for Mongoose
    const sortObj = {};
    if (typeof sort === 'string') {
      if (sort.startsWith('-')) {
        sortObj[sort.substring(1)] = -1;
      } else {
        sortObj[sort] = 1;
      }
    }

    // Build query filter
    const filter = {};
    if (query.department) {
      filter.department = query.department;
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { username: { $regex: query.search, $options: 'i' } }
      ];
    }

    return userRepository.findAll(filter, skip, limit, sortObj);
  }
}

module.exports = new UserService();
