const User = require('./model');
const Role = require('./roleModel');

class UserRepository {
  async findByEmail(email, selectPassword = false) {
    let query = User.findOne({ email }).populate('role');
    if (selectPassword) {
      query = query.select('+password');
    }
    return query;
  }

  async findById(id) {
    return User.findById(id).populate('role');
  }

  async create(userData) {
    const user = new User(userData);
    await user.save();
    return this.findById(user._id); // Return populated user
  }

  async update(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, { new: true }).populate('role');
  }

  async findRoleByName(roleName) {
    return Role.findOne({ name: roleName });
  }

  async exists(email) {
    const count = await User.countDocuments({ email });
    return count > 0;
  }

  async findAll() {
    const User = require('./model');
    return User.find().populate('role');
  }
}

module.exports = new UserRepository();
