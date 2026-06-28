const mongoose = require('mongoose');
const { accessibleRecordsPlugin } = require('@casl/mongoose');

const permissionSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  conditions: {
    type: mongoose.Schema.Types.Mixed,
    default: undefined,
  },
  fields: {
    type: [String],
    default: undefined,
  }
}, { _id: false });

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  permissions: {
    type: [permissionSchema],
    default: [],
  },
  // Metadata fields
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  version: {
    type: Number,
    default: 1,
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// CASL mongoose plugin
roleSchema.plugin(accessibleRecordsPlugin);

// Query middleware to filter out deleted roles by default
roleSchema.pre(/^find/, function (next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

module.exports = mongoose.model('Role', roleSchema);
