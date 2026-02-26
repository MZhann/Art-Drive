const User = require('../models/User.model');
const bcrypt = require('bcryptjs');

/**
 * Seed the default admin account if it doesn't already exist.
 * admin@gmail.com / Qwerty1234
 */
const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Qwerty1234';

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`✅ Admin account already exists (${adminEmail})`);
      return existingAdmin;
    }

    const admin = await User.create({
      email: adminEmail,
      password: adminPassword,
      username: 'admin',
      fullName: 'ArtDrive Admin',
      role: 'admin',
      bio: 'Platform administrator for ArtDrive.',
      location: {
        city: 'Almaty',
        country: 'Kazakhstan'
      },
      isVerified: true,
      isActive: true
    });

    console.log(`✅ Admin account seeded successfully (${adminEmail})`);
    return admin;
  } catch (error) {
    // Handle duplicate key error gracefully (race condition)
    if (error.code === 11000) {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
      console.log(`✅ Admin account already exists (${adminEmail})`);
      return await User.findOne({ email: adminEmail });
    }
    console.error('❌ Error seeding admin account:', error.message);
    return null;
  }
};

module.exports = seedAdmin;

