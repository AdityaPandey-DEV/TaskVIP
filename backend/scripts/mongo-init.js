// MongoDB initialization script for Docker
db = db.getSiblingDB('taskvip');

// Create collections with proper indexes
db.createCollection('users');
db.createCollection('credits');
db.createCollection('tasks');
db.createCollection('referrals');
db.createCollection('vippurchases');
db.createCollection('adminlogs');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ referralCode: 1 }, { unique: true });
db.users.createIndex({ phone: 1 }, { unique: true });
db.users.createIndex({ vipLevel: 1 });
db.users.createIndex({ createdAt: -1 });

db.credits.createIndex({ userId: 1, createdAt: -1 });
db.credits.createIndex({ type: 1, status: 1 });
db.credits.createIndex({ isVested: 1, vestedAt: 1 });

db.tasks.createIndex({ userId: 1, taskDate: -1 });
db.tasks.createIndex({ type: 1, status: 1 });
db.tasks.createIndex({ adNetwork: 1 });
db.tasks.createIndex({ expiresAt: 1 });

db.referrals.createIndex({ referrer: 1, createdAt: -1 });
db.referrals.createIndex({ referred: 1 });
db.referrals.createIndex({ referralCode: 1 });
db.referrals.createIndex({ status: 1 });

db.vippurchases.createIndex({ userId: 1, createdAt: -1 });
db.vippurchases.createIndex({ status: 1 });
db.vippurchases.createIndex({ transactionId: 1 }, { unique: true });
db.vippurchases.createIndex({ endDate: 1 });

db.adminlogs.createIndex({ adminId: 1, createdAt: -1 });
db.adminlogs.createIndex({ action: 1, createdAt: -1 });
db.adminlogs.createIndex({ targetUserId: 1, createdAt: -1 });
db.adminlogs.createIndex({ category: 1, severity: 1 });

print('MongoDB initialization completed successfully!');
