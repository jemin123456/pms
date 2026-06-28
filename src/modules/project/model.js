const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a project name'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Please provide a unique project code'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    default: '',
  },
  department: {
    type: String,
    default: '',
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A project must have an assigned manager'],
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  budget: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date'],
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date'],
  },
  status: {
    type: String,
    enum: ['Draft', 'Planning', 'Active', 'On Hold', 'Completed', 'Cancelled', 'Archived'],
    default: 'Planning',
  },
  color: {
    type: String,
    default: '#7c3aed',
  },
  tags: {
    type: [String],
    default: [],
  },
  visibility: {
    type: String,
    enum: ['Public', 'Private'],
    default: 'Private',
  },
  projectImage: {
    type: String,
    default: '',
  },
});

module.exports = mongoose.model('Project', projectSchema);
