const Role = require('../models/role.model');

class RoleRepository {
  async findById(id) {
    return Role.findById(id);
  }

  async findByCode(code) {
    return Role.findOne({ code });
  }

  async create(roleData) {
    return Role.create(roleData);
  }

  async findAll() {
    return Role.find({ isDeleted: false });
  }
}

module.exports = new RoleRepository();
