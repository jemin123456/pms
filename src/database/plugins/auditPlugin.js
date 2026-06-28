const mongoose = require('mongoose');

function auditPlugin(schema, options) {
  // Add audit fields
  schema.add({
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
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
    },
  });

  // Pre-save middleware to update timestamps and version numbers
  schema.pre('save', function (next) {
    this.updatedAt = new Date();
    if (this.isNew) {
      this.createdAt = new Date();
      this.version = 1;
    } else {
      this.version = (this.version || 0) + 1;
    }
    next();
  });

  // Pre-update middleware for updating updatedAt
  schema.pre('findOneAndUpdate', function (next) {
    this.set({ updatedAt: new Date() });
    const update = this.getUpdate();
    if (update && update.$inc && update.$inc.version) {
      // Version handled manually if update does it
    } else {
      this.set({ $inc: { version: 1 } });
    }
    next();
  });

  // Query middleware to automatically filter out deleted records
  const excludeDeleted = function (next) {
    const query = this.getQuery();
    if (query.isDeleted === undefined) {
      this.where({ isDeleted: { $ne: true } });
    }
    next();
  };

  schema.pre('find', excludeDeleted);
  schema.pre('findOne', excludeDeleted);
  schema.pre('findOneAndUpdate', excludeDeleted);
  schema.pre('countDocuments', excludeDeleted);

  // Soft delete method instance
  schema.methods.softDelete = async function (userId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    if (userId) this.updatedBy = userId;
    return this.save();
  };
}

module.exports = auditPlugin;
