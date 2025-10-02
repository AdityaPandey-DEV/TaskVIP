const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://taskvipstore_db_user:5idopRl5sBax4Xx7@task-vip.tj4ybne.mongodb.net/taskvip';

async function checkDefaultUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const User = require('../models/User');
    
    // Check if default user exists
    const defaultUser = await User.findOne({ referralCode: '0000' });
    
    if (defaultUser) {
      console.log('✅ Default user with referral code 0000 EXISTS:');
      console.log(`   Name: ${defaultUser.firstName} ${defaultUser.lastName}`);
      console.log(`   Email: ${defaultUser.email}`);
      console.log(`   Referral Code: ${defaultUser.referralCode}`);
      console.log(`   VIP Level: ${defaultUser.vipLevel}`);
    } else {
      console.log('❌ Default user with referral code 0000 does NOT exist');
      console.log('Creating default user...');
      
      await User.ensureDefaultReferralUser();
      
      // Check again
      const newDefaultUser = await User.findOne({ referralCode: '0000' });
      if (newDefaultUser) {
        console.log('✅ Default user created successfully:');
        console.log(`   Name: ${newDefaultUser.firstName} ${newDefaultUser.lastName}`);
        console.log(`   Email: ${newDefaultUser.email}`);
        console.log(`   Referral Code: ${newDefaultUser.referralCode}`);
      } else {
        console.log('❌ Failed to create default user');
      }
    }

    // List all users with their referral codes
    const allUsers = await User.find({}, 'firstName lastName email referralCode').limit(10);
    console.log('\n📋 All users in database:');
    allUsers.forEach(user => {
      console.log(`   ${user.firstName} ${user.lastName} (${user.email}) - Code: ${user.referralCode}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkDefaultUser();
