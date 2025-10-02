#!/usr/bin/env node

/**
 * Database Cleanup Script
 * Removes old trial collections and switches to User model-based stats system
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupOldDatabase() {
  try {
    console.log('🗑️  Starting database cleanup...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://taskvipstore_db_user:5idopRl5sBax4Xx7@task-vip.tj4ybne.mongodb.net/taskvip');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // List of old collections to remove
    const collectionsToRemove = [
      'credits',           // Old credit transactions
      'coins',            // Old coin transactions  
      'offercompletions', // Old offer completions
      'offers',           // Old offers
      'withdrawals',      // Old withdrawal requests
      'appinstalls',      // Old app install records
      'appdatabases',     // Old app database
      'multilevelreferrals', // Old referral records
      'commissions',      // Old commission records
      'razorpaywithdrawals', // Old Razorpay withdrawals
      'adminlogs',        // Old admin logs (if exists)
      'emailverifications' // Keep this one - still needed
    ];

    // Get existing collections
    const collections = await db.listCollections().toArray();
    const existingCollectionNames = collections.map(col => col.name);

    console.log('📋 Existing collections:', existingCollectionNames);

    // Remove old collections
    for (const collectionName of collectionsToRemove) {
      if (existingCollectionNames.includes(collectionName)) {
        if (collectionName === 'emailverifications') {
          console.log('⚠️  Keeping emailverifications collection (still needed)');
          continue;
        }
        
        try {
          await db.collection(collectionName).drop();
          console.log(`✅ Dropped collection: ${collectionName}`);
        } catch (error) {
          if (error.message.includes('ns not found')) {
            console.log(`⚠️  Collection ${collectionName} not found (already removed)`);
          } else {
            console.error(`❌ Error dropping ${collectionName}:`, error.message);
          }
        }
      } else {
        console.log(`⚠️  Collection ${collectionName} not found`);
      }
    }

    // Verify remaining collections
    const remainingCollections = await db.listCollections().toArray();
    console.log('📋 Remaining collections:', remainingCollections.map(col => col.name));

    console.log('🎉 Database cleanup completed successfully!');
    console.log('💡 The system now uses User model-based stats exclusively');

  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanupOldDatabase();
}

module.exports = { cleanupOldDatabase };
