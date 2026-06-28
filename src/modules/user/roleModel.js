const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Employee', 'Client'],
  },
  permissions: {
    type: [String],
    default: [],
  },
  description: {
    type: String,
    default: '',
  },
});

module.exports = mongoose.model('Role', roleSchema);
