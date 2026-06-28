require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../modules/user/models/role.model');
const User = require('../modules/user/models/user.model');
const logger = require('../config/logger');

const rolesData = [
  {
    name: 'Super Admin',
    code: 'SUPER_ADMIN',
    permissions: [
      { action: 'manage', subject: 'all' }
    ]
  },
  {
    name: 'Admin',
    code: 'ADMIN',
    permissions: [
      { action: 'manage', subject: 'User' },
      { action: 'manage', subject: 'Project' },
      { action: 'manage', subject: 'Task' },
      { action: 'manage', subject: 'Role' },
      { action: 'manage', subject: 'Comment' }
    ]
  },
  {
    name: 'Project Manager',
    code: 'PROJECT_MANAGER',
    permissions: [
      { action: 'read', subject: 'User' },
      { action: 'create', subject: 'Project' },
      { action: 'read', subject: 'Project' },
      { action: 'update', subject: 'Project', conditions: { manager: '${user._id}' } },
      { action: 'manage', subject: 'Task' },
      { action: 'manage', subject: 'Comment' }
    ]
  },
  {
    name: 'Team Lead',
    code: 'TEAM_LEAD',
    permissions: [
      { action: 'read', subject: 'User' },
      { action: 'read', subject: 'Project' },
      { action: 'create', subject: 'Task' },
      { action: 'read', subject: 'Task' },
      { action: 'update', subject: 'Task', conditions: { teamLead: '${user._id}' } },
      { action: 'manage', subject: 'Comment' }
    ]
  },
  {
    name: 'Employee',
    code: 'EMPLOYEE',
    permissions: [
      { action: 'read', subject: 'User' },
      { action: 'read', subject: 'Project' },
      { action: 'read', subject: 'Task' },
      { action: 'update', subject: 'Task', conditions: { assignee: '${user._id}' } },
      { action: 'manage', subject: 'Comment', conditions: { createdBy: '${user._id}' } }
    ]
  },
  {
    name: 'Client',
    code: 'CLIENT',
    permissions: [
      { action: 'read', subject: 'Project', conditions: { client: '${user._id}' } },
      { action: 'read', subject: 'Task' },
      { action: 'create', subject: 'Comment' }
    ]
  }
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/epms';
    logger.info(`Seeding database at ${mongoUri}...`);
    
    await mongoose.connect(mongoUri);

    // Delete existing roles
    await Role.deleteMany({});
    logger.info('Deleted existing roles.');

    // Seed roles
    const createdRoles = await Role.insertMany(rolesData);
    logger.info(`Seeded ${createdRoles.length} roles successfully.`);

    // Find Super Admin Role ID
    const superAdminRole = createdRoles.find(r => r.code === 'SUPER_ADMIN');

    // Create a Super Admin user if not exists
    const adminEmail = 'admin@epms.com';
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      adminUser = new User({
        email: adminEmail,
        username: 'admin',
        password: 'adminpassword123', // Will be hashed in pre-save hook
        role: superAdminRole._id,
        name: 'System Admin',
        designation: 'CTO',
        department: 'Management',
        isEmailVerified: true
      });
      await adminUser.save();
      logger.info(`Created default Super Admin user: ${adminEmail} (password: adminpassword123)`);
    } else {
      logger.info('Super Admin user already exists.');
    }

    // Seed a couple of standard roles users for testing
    const employeeRole = createdRoles.find(r => r.code === 'EMPLOYEE');
    const employeeEmail = 'employee@epms.com';
    let employeeUser = await User.findOne({ email: employeeEmail });

    if (!employeeUser) {
      employeeUser = new User({
        email: employeeEmail,
        username: 'employee',
        password: 'employeepassword123',
        role: employeeRole._id,
        name: 'John Doe',
        designation: 'Software Engineer',
        department: 'Engineering',
        isEmailVerified: true
      });
      await employeeUser.save();
      logger.info(`Created default Employee user: ${employeeEmail} (password: employeepassword123)`);
    }

    logger.info('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error(`Seeding database failed: ${error.message}`, error);
    process.exit(1);
  }
};

seedDatabase();
