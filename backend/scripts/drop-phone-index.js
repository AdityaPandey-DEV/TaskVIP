const mongoose = require('mongoose');
require('dotenv').config();

async function dropPhoneIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://taskvipstore_db_user:5idopRl5sBax4Xx7@task-vip.tj4ybne.mongodb.net/taskvip');
    console.log('Connected to MongoDB');

    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // List all indexes to see what exists
    console.log('Current indexes on users collection:');
    const indexes = await usersCollection.indexes();
    indexes.forEach(index => {
      console.log('Index:', JSON.stringify(index.key), 'Name:', index.name);
    });

    // Drop the phone index if it exists
    try {
      await usersCollection.dropIndex('phone_1');
      console.log('✅ Successfully dropped phone_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  phone_1 index does not exist (already dropped)');
      } else {
        console.error('❌ Error dropping phone_1 index:', error.message);
      }
    }

    // Also try dropping any other phone-related indexes
    try {
      await usersCollection.dropIndex({ phone: 1 });
      console.log('✅ Successfully dropped phone index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  phone index does not exist');
      } else {
        console.error('❌ Error dropping phone index:', error.message);
      }
    }

    // List indexes after cleanup
    console.log('\nIndexes after cleanup:');
    const newIndexes = await usersCollection.indexes();
    newIndexes.forEach(index => {
      console.log('Index:', JSON.stringify(index.key), 'Name:', index.name);
    });

    console.log('\n✅ Phone index cleanup completed');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
dropPhoneIndex();
