const mongoose = require('mongoose');
require('dotenv').config();

async function dropPhoneIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskvip');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // List all indexes
    console.log('📋 Current indexes on users collection:');
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      console.log(`   ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Try to drop the phone index
    try {
      await collection.dropIndex('phone_1');
      console.log('✅ Successfully dropped phone_1 index');
    } catch (dropError) {
      if (dropError.code === 27) {
        console.log('ℹ️  phone_1 index does not exist (already dropped)');
      } else {
        console.log('⚠️  Could not drop phone_1 index:', dropError.message);
      }
    }

    // List indexes again to confirm
    console.log('\n📋 Indexes after cleanup:');
    const indexesAfter = await collection.indexes();
    indexesAfter.forEach((index, i) => {
      console.log(`   ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });

  } catch (error) {
    console.error('❌ Error dropping phone index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run the cleanup
if (require.main === module) {
  dropPhoneIndex();
}

module.exports = { dropPhoneIndex };