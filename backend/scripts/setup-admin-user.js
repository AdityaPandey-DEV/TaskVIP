const mongoose = require('mongoose');
const User = require('../models/User');
const errorLogger = require('../utils/errorLogger');

async function setupAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskvip');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@taskvip.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

    const adminUser = new User({
      email: adminEmail,
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isAdmin: true,
      userType: 'vip',
      vipLevel: 3,
      isVipActive: true,
      vipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      isActive: true,
      emailVerified: true,
      kycStatus: 'verified'
    });

    await adminUser.save();
    console.log('Admin user created successfully:', adminUser.email);
    
    errorLogger.logAdminAction('ADMIN_USER_CREATED', {
      email: adminUser.email,
      role: adminUser.role
    });

  } catch (error) {
    console.error('Error setting up admin user:', error);
    errorLogger.logPaymentError(error, {
      type: 'ADMIN_SETUP_ERROR',
      context: 'setupAdminUser'
    });
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the setup
if (require.main === module) {
  setupAdminUser();
}

module.exports = setupAdminUser;
