const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function fixAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskvip');
    console.log('Connected to MongoDB');

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.log('❌ ADMIN_EMAIL not set in environment variables');
      return;
    }

    console.log(`🔍 Looking for admin user with email: ${adminEmail}`);

    // Find admin user
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (!adminUser) {
      console.log('❌ Admin user not found. Creating new admin user...');
      
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
      
      adminUser = new User({
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
        kycStatus: 'verified',
        // Initialize all the new stats fields
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

      await adminUser.save();
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user found:', adminUser.email);
      
      // Check if admin user has all required fields
      let needsUpdate = false;
      
      // Ensure admin fields are set
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        needsUpdate = true;
      }
      
      if (!adminUser.isAdmin) {
        adminUser.isAdmin = true;
        needsUpdate = true;
      }
      
      if (!adminUser.isActive) {
        adminUser.isActive = true;
        needsUpdate = true;
      }
      
      // Initialize new stats fields if missing
      if (adminUser.creditsReady === undefined || adminUser.creditsReady === null) {
        adminUser.creditsReady = adminUser.coinBalance || 1000;
        needsUpdate = true;
      }
      
      if (adminUser.totalEarned === undefined || adminUser.totalEarned === null) {
        adminUser.totalEarned = adminUser.totalCredits || 1000;
        needsUpdate = true;
      }
      
      if (adminUser.daysActive === undefined || adminUser.daysActive === null) {
        adminUser.daysActive = 1;
        needsUpdate = true;
      }
      
      if (adminUser.currentStreak === undefined || adminUser.currentStreak === null) {
        adminUser.currentStreak = 1;
        needsUpdate = true;
      }
      
      if (adminUser.dailyProgress === undefined || adminUser.dailyProgress === null) {
        adminUser.dailyProgress = 0;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await adminUser.save();
        console.log('✅ Admin user updated with missing fields');
      } else {
        console.log('✅ Admin user is already properly configured');
      }
    }

    // Test admin authentication
    console.log('\n🔐 Testing admin authentication...');
    console.log('Admin user details:');
    console.log('- Email:', adminUser.email);
    console.log('- Role:', adminUser.role);
    console.log('- isAdmin:', adminUser.isAdmin);
    console.log('- isActive:', adminUser.isActive);
    console.log('- isAdminUser():', adminUser.isAdminUser());
    
    if (adminUser.isAdminUser()) {
      console.log('✅ Admin authentication should work');
    } else {
      console.log('❌ Admin authentication will fail');
    }

  } catch (error) {
    console.error('❌ Error fixing admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run the fix
if (require.main === module) {
  fixAdminUser();
}

module.exports = { fixAdminUser };
