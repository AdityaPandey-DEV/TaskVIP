const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function fixAdminDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskvip');
    console.log('Connected to MongoDB');

    // Check if there are any users
    const userCount = await User.countDocuments();
    console.log(`📊 Total users in database: ${userCount}`);

    // Try to find any existing admin users
    const existingAdmins = await User.find({ 
      $or: [
        { role: 'admin' },
        { isAdmin: true }
      ]
    });

    console.log(`🔍 Found ${existingAdmins.length} existing admin users`);

    if (existingAdmins.length > 0) {
      console.log('\n✅ Existing admin users:');
      existingAdmins.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.role}, isAdmin: ${user.isAdmin})`);
      });
      return;
    }

    // Create admin user with proper error handling
    console.log('\n🔧 Creating new admin user...');
    
    try {
      const adminUser = new User({
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

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log('   Email: admin@taskvip.com');
      console.log('   Password: admin123456');
      
    } catch (createError) {
      console.error('❌ Error creating admin user:', createError.message);
      
      if (createError.code === 11000) {
        console.log('\n🔧 Trying to fix duplicate key error...');
        
        // Try to find and update existing user
        const existingUser = await User.findOne({ email: 'admin@taskvip.com' });
        if (existingUser) {
          console.log('📝 Found existing user, updating to admin...');
          existingUser.role = 'admin';
          existingUser.isAdmin = true;
          existingUser.isActive = true;
          await existingUser.save();
          console.log('✅ Existing user updated to admin');
        }
      }
    }

    // Final check
    const finalAdmins = await User.find({ 
      $or: [
        { role: 'admin' },
        { isAdmin: true }
      ]
    });

    console.log(`\n🎉 Final admin count: ${finalAdmins.length}`);
    if (finalAdmins.length > 0) {
      console.log('✅ Admin users available for login:');
      finalAdmins.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.role}, isAdmin: ${user.isAdmin})`);
      });
    }

  } catch (error) {
    console.error('❌ Error fixing admin database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run the fix
if (require.main === module) {
  fixAdminDatabase();
}

module.exports = { fixAdminDatabase };
