const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Credit = require('../models/Credit');
const Task = require('../models/Task');
const Referral = require('../models/Referral');
const VipPurchase = require('../models/VipPurchase');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskvip');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Credit.deleteMany({});
    await Task.deleteMany({});
    await Referral.deleteMany({});
    await VipPurchase.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      email: 'admin@taskvip.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+919876543210',
      vipLevel: 3,
      vipExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      totalCredits: 10000,
      availableCredits: 10000,
      kycStatus: 'verified',
      isActive: true
    });
    await adminUser.save();
    console.log('Created admin user');

    // Create sample users
    const users = [];
    for (let i = 1; i <= 10; i++) {
      const user = new User({
        email: `user${i}@example.com`,
        password: 'password123',
        firstName: `User${i}`,
        lastName: 'Test',
        phone: `+9198765432${i.toString().padStart(2, '0')}`,
        vipLevel: i <= 3 ? 1 : i <= 6 ? 2 : i <= 8 ? 3 : 0,
        vipExpiry: i <= 8 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
        totalCredits: Math.floor(Math.random() * 1000) + 100,
        availableCredits: Math.floor(Math.random() * 500) + 50,
        kycStatus: i <= 5 ? 'verified' : 'pending',
        isActive: true,
        streak: Math.floor(Math.random() * 30),
        badges: i <= 3 ? ['first_task', 'week_streak'] : ['first_task']
      });
      await user.save();
      users.push(user);
      console.log(`Created user ${i}`);
    }

    // Create sample credits
    for (const user of users) {
      const creditTypes = ['task_completion', 'referral_bonus', 'vip_purchase', 'milestone_reward'];
      const sources = ['ad_watch', 'offer_completion', 'survey_completion', 'app_install', 'referral_signup'];
      
      for (let i = 0; i < 5; i++) {
        const credit = new Credit({
          userId: user._id,
          amount: Math.floor(Math.random() * 100) + 10,
          type: creditTypes[Math.floor(Math.random() * creditTypes.length)],
          source: sources[Math.floor(Math.random() * sources.length)],
          description: `Sample credit ${i + 1}`,
          status: 'vested',
          vestingSchedule: {
            immediate: Math.floor(Math.random() * 50) + 10
          },
          vestingProgress: {
            immediate: Math.floor(Math.random() * 50) + 10
          },
          isVested: true,
          vestedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        });
        await credit.save();
      }
    }
    console.log('Created sample credits');

    // Create sample tasks
    for (const user of users) {
      const taskTypes = ['ad_watch', 'offer_completion', 'survey_completion', 'app_install', 'daily_checkin'];
      const adNetworks = ['propellerads', 'adsterra', 'adgate', 'adscend', 'internal'];
      const statuses = ['pending', 'completed', 'verified'];
      
      for (let i = 0; i < 3; i++) {
        const task = new Task({
          userId: user._id,
          type: taskTypes[Math.floor(Math.random() * taskTypes.length)],
          title: `Sample Task ${i + 1}`,
          description: `Complete this sample task to earn credits`,
          reward: Math.floor(Math.random() * 50) + 10,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          adNetwork: adNetworks[Math.floor(Math.random() * adNetworks.length)],
          isDailyTask: true,
          taskDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        });
        await task.save();
      }
    }
    console.log('Created sample tasks');

    // Create sample referrals
    for (let i = 1; i < users.length; i++) {
      const referral = new Referral({
        referrer: users[0]._id, // First user refers others
        referred: users[i]._id,
        referralCode: users[0].referralCode,
        status: Math.random() > 0.5 ? 'active' : 'completed',
        bonusCredits: Math.floor(Math.random() * 50) + 10,
        bonusType: 'signup',
        totalEarnings: Math.floor(Math.random() * 100) + 20,
        lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
      await referral.save();
    }
    console.log('Created sample referrals');

    // Create sample VIP purchases
    for (let i = 1; i <= 5; i++) {
      const vipPurchase = new VipPurchase({
        userId: users[i]._id,
        vipLevel: Math.floor(Math.random() * 3) + 1,
        amount: [1000, 3000, 5000][Math.floor(Math.random() * 3)],
        currency: 'INR',
        paymentMethod: 'razorpay',
        paymentId: `pay_${Date.now()}_${i}`,
        status: 'completed',
        transactionId: `VIP_${Date.now()}_${i}`,
        vipBenefits: {
          dailyLimit: [200, 500, 1000][Math.floor(Math.random() * 3)],
          referralBonus: [5, 7, 10][Math.floor(Math.random() * 3)],
          name: `VIP ${Math.floor(Math.random() * 3) + 1}`,
          duration: 30,
          price: [1000, 3000, 5000][Math.floor(Math.random() * 3)]
        },
        startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        isActive: true
      });
      await vipPurchase.save();
    }
    console.log('Created sample VIP purchases');

    console.log('Sample data seeded successfully!');
    console.log('\nSample users created:');
    console.log('Admin: admin@taskvip.com / admin123');
    for (let i = 1; i <= 10; i++) {
      console.log(`User ${i}: user${i}@example.com / password123`);
    }

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed function
seedData();
