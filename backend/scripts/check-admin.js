const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function checkAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskvip');
    console.log('Connected to MongoDB');

    // Check for any admin users
    const adminUsers = await User.find({ 
      $or: [
        { role: 'admin' },
        { isAdmin: true }
      ]
    });

    console.log(`\n🔍 Found ${adminUsers.length} admin users:`);
    
    adminUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. Admin User:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   isAdmin: ${user.isAdmin}`);
      console.log(`   isActive: ${user.isActive}`);
      console.log(`   isAdminUser(): ${user.isAdminUser()}`);
      console.log(`   Created: ${user.createdAt}`);
    });

    if (adminUsers.length === 0) {
      console.log('\n❌ No admin users found!');
      console.log('Creating a default admin user...');
      
      const defaultAdmin = new User({
        email: 'admin@taskvip.com',
        password: 'admin123456',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isAdmin: true,
        userType: 'vip',
        vipLevel: 3,
        isVipActive: true,
        vipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
        emailVerified: true,
        kycStatus: 'verified',
        creditsReady: 1000,
        totalEarned: 1000,
        coinBalance: 1000,
        daysActive: 1,
        currentStreak: 1,
        dailyProgress: 0,
        totalTasksAssigned: 0,
        totalTasksCompleted: 0,
        totalDirectReferrals: 0,
        totalReferralEarnings: 0
      });

      await defaultAdmin.save();
      console.log('✅ Default admin user created: admin@taskvip.com');
      console.log('   Password: admin123456');
    }

  } catch (error) {
    console.error('❌ Error checking admin users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run the check
if (require.main === module) {
  checkAdmin();
}

module.exports = { checkAdmin };
