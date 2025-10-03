#!/usr/bin/env node

/**
 * Initialize VIP Pricing Script
 * 
 * This script initializes the default VIP pricing in the database
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const VipPricing = require('../models/VipPricing');
const User = require('../models/User');

async function initializeVipPricing() {
  try {
    console.log('🚀 Initializing VIP pricing...\n');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskvip');
    console.log('✅ Connected to MongoDB\n');
    
    // Get admin user for createdBy field
    const adminUser = await User.findOne({ email: 'adityapandey.dev.in@gmail.com' });
    if (!adminUser) {
      console.log('❌ Admin user not found. Please run setup-admin.js first.');
      process.exit(1);
    }
    
    console.log(`👤 Using admin user: ${adminUser.email}\n`);
    
    // Check if pricing already exists
    const existingPricing = await VipPricing.find();
    if (existingPricing.length > 0) {
      console.log('✅ VIP pricing already exists!');
      console.log(`   Found ${existingPricing.length} pricing plans\n`);
      
      existingPricing.forEach(plan => {
        console.log(`   Level ${plan.level}: ${plan.name} - ₹${plan.price}`);
      });
      
      console.log('\n🎉 VIP pricing is ready!');
      return;
    }
    
    // Initialize default pricing
    console.log('📝 Creating default VIP pricing plans...');
    const pricing = await VipPricing.initializeDefaultPricing(adminUser._id);
    
    console.log('✅ Default VIP pricing created successfully!\n');
    
    pricing.forEach(plan => {
      console.log(`   Level ${plan.level}: ${plan.name} - ₹${plan.price}`);
    });
    
    console.log('\n🎉 VIP pricing initialization completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Admin can now manage VIP pricing from the admin panel');
    console.log('2. Frontend will fetch dynamic pricing from the API');
    console.log('3. Users will see "Acquired" for the Free plan');
    
  } catch (error) {
    console.error('❌ Error initializing VIP pricing:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the initialization
initializeVipPricing();
