const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const connectDB = require('../config/db');
const User = require('../modules/user/user.model');
const Tenant = require('../modules/tenant/tenant.model');

const seedRoles = async () => {
  try {
    await connectDB();
    console.log('Seeder connected to MongoDB.');

    // Find the first registered user
    let user = await User.findOne();
    if (!user) {
      console.log('No user found in the database. Please register a user first on the registration page.');
      process.exit(0);
    }

    console.log(`Found user: ${user.name} (${user.email})`);

    // Create Beta Software Labs tenant (Employee workspace)
    let betaTenant = await Tenant.findOne({ slug: 'beta-software' });
    if (!betaTenant) {
      betaTenant = await Tenant.create({
        name: 'Beta Software Labs',
        slug: 'beta-software',
      });
      console.log(`Created Tenant: ${betaTenant.name}`);
    } else {
      console.log(`Tenant already exists: ${betaTenant.name}`);
    }

    // Create Gamma Tech Solutions tenant (Admin workspace)
    let gammaTenant = await Tenant.findOne({ slug: 'gamma-tech' });
    if (!gammaTenant) {
      gammaTenant = await Tenant.create({
        name: 'Gamma Tech Solutions',
        slug: 'gamma-tech',
      });
      console.log(`Created Tenant: ${gammaTenant.name}`);
    } else {
      console.log(`Tenant already exists: ${gammaTenant.name}`);
    }

    // Add memberships
    const hasBeta = user.memberships.some(m => m.tenantId.toString() === betaTenant._id.toString());
    const hasGamma = user.memberships.some(m => m.tenantId.toString() === gammaTenant._id.toString());

    let updated = false;

    if (!hasBeta) {
      user.memberships.push({
        tenantId: betaTenant._id,
        role: 'employee', // Employee role (read-only)
      });
      console.log(`Added membership: ${betaTenant.name} as EMPLOYEE`);
      updated = true;
    }

    if (!hasGamma) {
      user.memberships.push({
        tenantId: gammaTenant._id,
        role: 'admin', // Admin role (read-write)
      });
      console.log(`Added membership: ${gammaTenant.name} as ADMIN`);
      updated = true;
    }

    if (updated) {
      await user.save();
      console.log('User memberships updated successfully!');
    } else {
      console.log('User already has all memberships.');
    }

    console.log('Done!');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedRoles();
