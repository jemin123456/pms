const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    memberships: [
      {
        tenantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Tenant',
          required: [true, 'Tenant ID is required'],
        },
        role: {
          type: String,
          enum: [
            'super admin',
            'admin',
            'project manager',
            'developer',
            'tester',
            'backend developer',
            'frontend developer',
            'database administrator'
          ],
          default: 'developer',
        },
        status: {
          type: String,
          enum: ['active', 'archived'],
          default: 'active',
        }
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
