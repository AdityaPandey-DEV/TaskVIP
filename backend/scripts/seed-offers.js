const mongoose = require('mongoose');
const Offer = require('../models/Offer');

// Sample offers for the hybrid reward system
const sampleOffers = [
  // AdMob Rewarded Videos
  {
    title: 'Watch Rewarded Video',
    description: 'Watch a short video ad and earn coins instantly!',
    network: 'admob',
    type: 'rewarded_video',
    coinReward: { min: 5, max: 5 },
    requirements: {
      minLevel: 0,
      countries: ['IN', 'US', 'GB', 'CA', 'AU'],
      devices: ['android', 'ios', 'web'],
      vipOnly: false
    },
    category: 'entertainment',
    difficulty: 'easy',
    estimatedTime: 1,
    conversionRate: 95,
    priority: 100,
    dailyLimit: 1000,
    userLimit: 50, // 50 videos per user per day
    imageUrl: 'https://via.placeholder.com/300x200?text=Video+Ad'
  },

  // CPALead Offers
  {
    title: 'Install Gaming App',
    description: 'Download and play this exciting mobile game for 5 minutes',
    network: 'cpalead',
    type: 'app_install',
    coinReward: { min: 150, max: 200 },
    requirements: {
      minLevel: 0,
      countries: ['IN', 'US'],
      devices: ['android', 'ios'],
      vipOnly: false
    },
    category: 'gaming',
    difficulty: 'medium',
    estimatedTime: 10,
    conversionRate: 75,
    priority: 80,
    dailyLimit: 500,
    userLimit: 1,
    imageUrl: 'https://via.placeholder.com/300x200?text=Gaming+App',
    metadata: {
      appPackage: 'com.example.game'
    }
  },

  {
    title: 'Complete Survey - Shopping Habits',
    description: 'Share your shopping preferences in this 5-minute survey',
    network: 'cpalead',
    type: 'survey',
    coinReward: { min: 80, max: 120 },
    requirements: {
      minLevel: 0,
      countries: ['IN', 'US', 'GB'],
      devices: ['android', 'ios', 'web'],
      vipOnly: false
    },
    category: 'lifestyle',
    difficulty: 'easy',
    estimatedTime: 5,
    conversionRate: 85,
    priority: 70,
    dailyLimit: 200,
    userLimit: 1,
    imageUrl: 'https://via.placeholder.com/300x200?text=Survey',
    metadata: {
      surveyLength: 5
    }
  },

  {
    title: 'Sign Up for Streaming Service',
    description: 'Create a free account on this popular streaming platform',
    network: 'cpalead',
    type: 'signup',
    coinReward: { min: 250, max: 300 },
    requirements: {
      minLevel: 1,
      countries: ['IN', 'US'],
      devices: ['android', 'ios', 'web'],
      vipOnly: false
    },
    category: 'entertainment',
    difficulty: 'medium',
    estimatedTime: 8,
    conversionRate: 60,
    priority: 90,
    dailyLimit: 100,
    userLimit: 1,
    imageUrl: 'https://via.placeholder.com/300x200?text=Streaming+Service'
  },

  // AdGate Offers
  {
    title: 'Try Finance App - Free Trial',
    description: 'Download and try this finance management app for 7 days',
    network: 'adgate',
    type: 'app_install',
    coinReward: { min: 400, max: 500 },
    requirements: {
      minLevel: 2,
      countries: ['IN', 'US'],
      devices: ['android', 'ios'],
      vipOnly: false
    },
    category: 'finance',
    difficulty: 'hard',
    estimatedTime: 15,
    conversionRate: 45,
    priority: 95,
    dailyLimit: 50,
    userLimit: 1,
    imageUrl: 'https://via.placeholder.com/300x200?text=Finance+App',
    metadata: {
      appPackage: 'com.example.finance'
    }
  },

  {
    title: 'Educational Quiz - General Knowledge',
    description: 'Test your knowledge with this fun 10-question quiz',
    network: 'adgate',
    type: 'quiz',
    coinReward: { min: 30, max: 50 },
    requirements: {
      minLevel: 0,
      countries: ['IN', 'US', 'GB', 'CA'],
      devices: ['android', 'ios', 'web'],
      vipOnly: false
    },
    category: 'education',
    difficulty: 'easy',
    estimatedTime: 3,
    conversionRate: 90,
    priority: 60,
    dailyLimit: 1000,
    userLimit: 3, // 3 quizzes per day
    imageUrl: 'https://via.placeholder.com/300x200?text=Quiz'
  },

  // High-value VIP offers
  {
    title: 'Premium Shopping App - VIP Only',
    description: 'Exclusive offer: Install premium shopping app and make first purchase',
    network: 'cpalead',
    type: 'purchase',
    coinReward: { min: 800, max: 1000 },
    requirements: {
      minLevel: 3,
      countries: ['IN', 'US'],
      devices: ['android', 'ios'],
      vipOnly: true
    },
    category: 'shopping',
    difficulty: 'hard',
    estimatedTime: 20,
    conversionRate: 30,
    priority: 100,
    dailyLimit: 20,
    userLimit: 1,
    imageUrl: 'https://via.placeholder.com/300x200?text=Premium+Shopping',
    metadata: {
      purchaseAmount: 500 // ₹500 minimum purchase
    }
  },

  {
    title: 'Social Media Follow',
    description: 'Follow our partner brand on Instagram and like 3 posts',
    network: 'adgate',
    type: 'social_follow',
    coinReward: { min: 20, max: 30 },
    requirements: {
      minLevel: 0,
      countries: ['IN', 'US', 'GB'],
      devices: ['android', 'ios', 'web'],
      vipOnly: false
    },
    category: 'lifestyle',
    difficulty: 'easy',
    estimatedTime: 2,
    conversionRate: 95,
    priority: 50,
    dailyLimit: 500,
    userLimit: 5, // 5 social follows per day
    imageUrl: 'https://via.placeholder.com/300x200?text=Social+Follow',
    metadata: {
      socialPlatform: 'instagram'
    }
  },

  {
    title: 'Reach Level 10 in Mobile Game',
    description: 'Download this RPG game and reach level 10 to earn big rewards',
    network: 'cpalead',
    type: 'game_level',
    coinReward: { min: 300, max: 400 },
    requirements: {
      minLevel: 1,
      countries: ['IN', 'US'],
      devices: ['android', 'ios'],
      vipOnly: false
    },
    category: 'gaming',
    difficulty: 'hard',
    estimatedTime: 30,
    conversionRate: 40,
    priority: 85,
    dailyLimit: 100,
    userLimit: 1,
    imageUrl: 'https://via.placeholder.com/300x200?text=RPG+Game',
    metadata: {
      gameLevel: 10,
      appPackage: 'com.example.rpg'
    }
  },

  {
    title: 'Newsletter Signup',
    description: 'Subscribe to our partner\'s weekly newsletter for exclusive deals',
    network: 'adgate',
    type: 'email_submit',
    coinReward: { min: 15, max: 25 },
    requirements: {
      minLevel: 0,
      countries: ['IN', 'US', 'GB', 'CA', 'AU'],
      devices: ['android', 'ios', 'web'],
      vipOnly: false
    },
    category: 'lifestyle',
    difficulty: 'easy',
    estimatedTime: 1,
    conversionRate: 98,
    priority: 40,
    dailyLimit: 1000,
    userLimit: 10, // 10 newsletter signups per day
    imageUrl: 'https://via.placeholder.com/300x200?text=Newsletter'
  }
];

async function seedOffers() {
  try {
    console.log('🌱 Seeding offers...');
    
    // Clear existing offers
    await Offer.deleteMany({});
    console.log('🗑️  Cleared existing offers');
    
    // Insert sample offers
    const offers = await Offer.insertMany(sampleOffers);
    console.log(`✅ Created ${offers.length} sample offers`);
    
    // Display summary
    const summary = await Offer.aggregate([
      {
        $group: {
          _id: '$network',
          count: { $sum: 1 },
          avgReward: { $avg: { $avg: ['$coinReward.min', '$coinReward.max'] } }
        }
      }
    ]);
    
    console.log('\n📊 Offers Summary:');
    summary.forEach(item => {
      console.log(`${item._id}: ${item.count} offers, avg reward: ${Math.round(item.avgReward)} coins`);
    });
    
    console.log('\n🎯 Hybrid Reward System Ready!');
    console.log('💰 AdMob videos: 5 coins each (stable income)');
    console.log('🎁 CPALead/AdGate offers: 15-1000 coins (cash payouts)');
    console.log('💎 VIP exclusive offers: 800-1000 coins');
    
  } catch (error) {
    console.error('❌ Error seeding offers:', error);
  }
}

// Run if called directly
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://taskvipstore_db_user:5idopRl5sBax4Xx7@task-vip.tj4ybne.mongodb.net/taskvip')
    .then(() => {
      console.log('📡 Connected to MongoDB');
      return seedOffers();
    })
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedOffers, sampleOffers };
