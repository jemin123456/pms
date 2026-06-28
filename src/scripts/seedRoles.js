require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../modules/user/roleModel');
const logger = require('../utils/logger');

const roles = [
  {
    name: 'Super Admin',
    description: 'Complete control over the system, roles, permissions, and audit logs.',
    permissions: ['manage_all'],
  },
  {
    name: 'Admin',
    description: 'System administration, user creation, standard reports, and configurations.',
    permissions: [
      'read_user', 'create_user', 'update_user', 'delete_user',
      'read_project', 'create_project', 'update_project', 'delete_project',
      'read_task', 'create_task', 'update_task', 'delete_task',
      'read_team', 'create_team', 'update_team', 'delete_team',
      'read_report', 'export_report',
      'read_attendance', 'manage_attendance',
      'read_leave', 'manage_leave',
      'read_budget', 'manage_budget'
    ],
  },
  {
    name: 'Project Manager',
    description: 'Manages assigned projects, project teams, tasks, and workloads.',
    permissions: [
      'read_user',
      'read_project', 'create_project', 'update_project',
      'read_task', 'create_task', 'update_task', 'delete_task',
      'read_team', 'create_team', 'update_team',
      'read_report', 'export_report',
      'read_attendance',
      'read_leave', 'approve_leave',
      'read_budget', 'create_budget', 'update_budget'
    ],
  },
  {
    name: 'Team Lead',
    description: 'Leads sprint planning, tasks assignment, and workload tracking.',
    permissions: [
      'read_user',
      'read_project',
      'read_task', 'create_task', 'update_task',
      'read_team',
      'read_report',
      'read_attendance',
      'read_leave'
    ],
  },
  {
    name: 'Employee',
    description: 'Regular team member working on tasks, logging time and attendance.',
    permissions: [
      'read_user',
      'read_project',
      'read_task', 'update_task_status',
      'read_attendance', 'log_attendance',
      'read_leave', 'apply_leave',
      'log_time'
    ],
  },
  {
    name: 'Client',
    description: 'External client accessing project progress, deliverables, and reports.',
    permissions: [
      'read_project',
      'read_task',
      'read_report',
      'approve_deliverables',
      'create_comment'
    ],
  },
];

const seedRoles = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables.');
    }

    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB for seeding roles...');

    // Clear existing roles
    await Role.deleteMany({});
    logger.info('Cleared existing roles.');

    // Insert standard roles
    await Role.insertMany(roles);
    logger.info('Successfully seeded default roles and permissions!');

    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    logger.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedRoles();
