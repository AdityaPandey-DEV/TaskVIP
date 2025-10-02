#!/usr/bin/env node

/**
 * Setup Admin Account Script
 * 
 * This script helps set up an admin account by:
 * 1. Creating the user account if it doesn't exist
 * 2. Providing instructions for setting ADMIN_EMAIL environment variable
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const ADMIN_EMAIL = 'adityapandey.dev.in@gmail.com';
const ADMIN_FIRST_NAME = 'Aditya';
const ADMIN_LAST_NAME = 'Pandey';
const ADMIN_PASSWORD = 'Admin@TaskVIP2024'; // Strong default password

async function setupAdmin() {
  try {
    console.log('🚀 Setting up admin account...\n');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskvip');
    console.log('✅ Connected to MongoDB\n');
    
    // Check if admin user already exists
    console.log(`🔍 Checking if admin user exists: ${ADMIN_EMAIL}`);
    let adminUser = await User.findOne({ email: ADMIN_EMAIL });
    
    if (adminUser) {
      console.log('✅ Admin user already exists!');
      console.log(`   User ID: ${adminUser._id}`);
      console.log(`   Name: ${adminUser.firstName} ${adminUser.lastName}`);
      console.log(`   VIP Level: ${adminUser.vipLevel}`);
      console.log(`   Created: ${adminUser.createdAt}\n`);
    } else {
      console.log('❌ Admin user does not exist. Creating...\n');
      
      // Create admin user
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
      
      adminUser = new User({
        email: ADMIN_EMAIL,
        password: hashedPassword,
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
        userType: 'vip',
        vipLevel: 3, // Max VIP level
        vipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        emailVerified: true,
        emailVerifiedAt: new Date(),
        kycStatus: 'verified',
        kycVerifiedAt: new Date(),
        coinBalance: 100000, // Give admin some coins for testing
        isActive: true
      });
      
      await adminUser.save();
      
      console.log('✅ Admin user created successfully!');
      console.log(`   User ID: ${adminUser._id}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      console.log(`   VIP Level: ${adminUser.vipLevel}`);
      console.log(`   Coin Balance: ${adminUser.coinBalance}\n`);
    }
    
    // Check current ADMIN_EMAIL environment variable
    console.log('🔧 Environment Variable Status:');
    console.log(`   Current ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'NOT SET'}`);
    console.log(`   Required ADMIN_EMAIL: ${ADMIN_EMAIL}\n`);
    
    if (process.env.ADMIN_EMAIL === ADMIN_EMAIL) {
      console.log('✅ ADMIN_EMAIL environment variable is correctly set!\n');
    } else {
      console.log('⚠️  ADMIN_EMAIL environment variable needs to be updated!\n');
      
      console.log('📋 INSTRUCTIONS FOR RENDER DEPLOYMENT:');
      console.log('1. Go to your Render dashboard: https://dashboard.render.com');
      console.log('2. Select your TaskVIP backend service');
      console.log('3. Go to "Environment" tab');
      console.log('4. Add or update the environment variable:');
      console.log(`   Key: ADMIN_EMAIL`);
      console.log(`   Value: ${ADMIN_EMAIL}`);
      console.log('5. Click "Save Changes"');
      console.log('6. Wait for automatic redeploy to complete\n');
      
      console.log('📋 FOR LOCAL DEVELOPMENT:');
      console.log('1. Update your .env file in the backend folder:');
      console.log(`   ADMIN_EMAIL=${ADMIN_EMAIL}`);
      console.log('2. Restart your backend server\n');
    }
    
    console.log('🎉 Admin setup completed!');
    console.log(`\n📝 Admin Login Credentials:`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`\n🔗 Admin Panel URL: https://task-vip.vercel.app/admin`);
    console.log(`\n⚠️  IMPORTANT: Change the admin password after first login!`);
    
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the setup
setupAdmin();
