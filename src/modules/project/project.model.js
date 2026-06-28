const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
    },
    techStack: {
      type: String,
      required: [true, 'Tech stack is required'],
      trim: true,
    },
    budget: {
      type: Number,
      required: [true, 'Project budget is required'],
      min: [0, 'Budget cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Planning', 'In Progress', 'Completed', 'On Hold'],
      default: 'Planning',
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Project', projectSchema);
