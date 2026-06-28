const User = require('../models/user.model');

class UserRepository {
  async findById(id) {
    return User.findById(id).populate('role');
  }

  async findByEmail(email) {
    // Include password field in case it is needed for verification, select(+password)
    return User.findOne({ email }).select('+password').populate('role');
  }

  async findByUsername(username) {
    return User.findOne({ username }).select('+password').populate('role');
  }

  async create(userData) {
    return User.create(userData);
  }

  async update(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('role');
  }

  async delete(id, deletedByUserId) {
    return User.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        updatedBy: deletedByUserId
      },
      { new: true }
    );
  }

  async findAll(filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 }) {
    const query = { isDeleted: false, ...filter };
    const items = await User.find(query)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .populate('role');
    const total = await User.countDocuments(query);
    return { items, total };
  }
}

module.exports = new UserRepository();
