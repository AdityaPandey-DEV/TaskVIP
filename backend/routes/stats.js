const express = require('express');
const User = require('../models/User');
// OLD MODELS REMOVED - Using User model stats only (NEW IMPLEMENTATION)
// const Credit = require('../models/Credit');
// const VipPurchase = require('../models/VipPurchase');
// const Wallet = require('../models/Wallet');
// const Coin = require('../models/Coin');
// const AppInstall = require('../models/AppInstall');
// const { MultiLevelReferral } = require('../models/MultiLevelReferral');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/stats
// @desc    Get public platform statistics
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments({ isActive: true });
    
    // Get total credits earned
    const totalCreditsResult = await Credit.aggregate([
      { $match: { amount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalCredits = totalCreditsResult.length > 0 ? totalCreditsResult[0].total : 0;
    
    // Get total tasks completed
    const completedTasks = await Credit.countDocuments({ 
      type: 'task_completion',
      status: 'vested'
    });
    
    // Get VIP users
    const vipUsers = await User.countDocuments({ 
      isVipActive: true,
      isActive: true
    });
    
    // Get total VIP revenue
    const vipRevenueResult = await VipPurchase.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalVipRevenue = vipRevenueResult.length > 0 ? vipRevenueResult[0].total : 0;
    
    // Get wallet statistics
    const walletStats = await Wallet.getWalletStats();
    
    res.json({
      totalUsers,
      totalCredits: Math.round(totalCredits),
      completedTasks,
      vipUsers,
      totalVipRevenue: Math.round(totalVipRevenue),
      totalWallets: walletStats.totalWallets,
      totalBalance: Math.round(walletStats.totalBalance),
      totalWithdrawn: Math.round(walletStats.totalWithdrawn)
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to get platform statistics' });
  }
});

// @route   GET /api/stats/leaderboard
// @desc    Get top earners leaderboard
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get top earners
    const topEarners = await Wallet.getTopEarners(parseInt(limit));
    
    const leaderboard = topEarners.map((wallet, index) => ({
      rank: index + 1,
      user: {
        firstName: wallet.userId.firstName,
        lastName: wallet.userId.lastName,
        userType: wallet.userId.userType,
        vipLevel: wallet.userId.vipLevel
      },
      totalEarned: wallet.totalEarned,
      totalWithdrawn: wallet.totalWithdrawn,
      currentBalance: wallet.balance
    }));
    
    res.json({ leaderboard });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Failed to get leaderboard' });
  }
});

// @route   GET /api/stats/recent-activity
// @desc    Get recent platform activity
// @access  Public
router.get('/recent-activity', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // Get recent credits earned
    const recentCredits = await Credit.find({ amount: { $gt: 0 } })
      .populate('userId', 'firstName lastName userType')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('amount type source description createdAt userId');
    
    // Get recent VIP purchases
    const recentVipPurchases = await VipPurchase.find()
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('level amount createdAt userId');
    
    const activity = [
      ...recentCredits.map(credit => ({
        type: 'credit_earned',
        user: {
          firstName: credit.userId.firstName,
          lastName: credit.userId.lastName,
          userType: credit.userId.userType
        },
        amount: credit.amount,
        description: credit.description,
        createdAt: credit.createdAt
      })),
      ...recentVipPurchases.map(purchase => ({
        type: 'vip_purchase',
        user: {
          firstName: purchase.userId.firstName,
          lastName: purchase.userId.lastName
        },
        level: purchase.level,
        amount: purchase.amount,
        description: `VIP ${purchase.level} purchased`,
        createdAt: purchase.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ activity: activity.slice(0, parseInt(limit)) });

  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ message: 'Failed to get recent activity' });
  }
});

// @route   GET /api/stats/dashboard
// @desc    Get user's dashboard statistics - SIMPLE AND DIRECT
// @access  Private
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Migrate old balance fields to coinBalance
    user.migrateToCoinBalance();
    
    // Check and reset daily stats if it's a new day
    const today = new Date();
    const lastReset = new Date(user.lastDailyReset);
    if (today.toDateString() !== lastReset.toDateString()) {
      user.dailyAdsWatched = 0;
      user.dailyCreditsEarned = 0;
      user.dailyProgress = 0;
      user.lastDailyReset = today;
    }
    
    // If new stats fields are empty, populate them from old fields
    if (!user.totalEarned && user.totalCredits) {
      user.totalEarned = user.totalCredits;
    }
    if (!user.daysActive) {
      user.daysActive = 1;
    }
    if (!user.currentStreak) {
      user.currentStreak = 1;
    }
    
    // Save if we updated anything
    if (user.isModified() || !user.totalEarned || !user.daysActive || !user.currentStreak) {
      await user.save();
    }

    // Return simple stats directly from user using coinBalance as primary field
    res.json({
      availableCredits: user.coinBalance || 0, // For backward compatibility
      totalCredits: user.totalEarned || 0,
      dailyCreditsEarned: user.dailyCreditsEarned || 0,
      dailyCreditLimit: user.getDailyCreditLimit(),
      dailyProgress: user.dailyProgress || 0,
      streak: user.currentStreak || 0,
      totalTasks: user.totalTasksAssigned || 0,
      completedTasks: user.totalTasksCompleted || 0,
      coinBalance: user.coinBalance || 0,
      balance: user.getBalanceInRupees(), // Real rupees value
      daysActive: user.daysActive || 0,
      
      referralStats: {
        totalReferrals: (user.totalDirectReferrals || 0) + (user.totalIndirectReferrals || 0) + (user.totalDeepReferrals || 0),
        totalEarnings: user.totalReferralEarnings || 0,
        activeReferrals: user.totalDirectReferrals || 0,
        level1Referrals: user.totalDirectReferrals || 0,
        level2Referrals: user.totalIndirectReferrals || 0,
        level3Referrals: user.totalDeepReferrals || 0
      },

      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        vipLevel: user.vipLevel,
        isVipActive: user.isVipActive,
        referralCode: user.referralCode,
        coinBalance: user.coinBalance || 0
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to get dashboard data' });
  }
});

// @route   GET /api/stats/dashboard-v2
// @desc    Get user's comprehensive dashboard statistics (from User model - FAST)
// @access  Private
router.get('/dashboard-v2', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📊 Dashboard V2 stats requested for user:', userId);
    
    const user = await User.findById(userId);

    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User found:', user.email, 'Stats from User model');

    // Get comprehensive stats directly from user model (FAST!)
    const stats = user.getDashboardStats();
    
    console.log('📊 User Model Stats:', {
      creditsReady: stats.creditsReady,
      totalEarned: stats.totalEarned,
      dailyProgress: stats.dailyProgress,
      currentStreak: stats.currentStreak
    });

    res.json({
      // Financial Stats (directly from User model)
      availableCredits: Math.round(stats.creditsReady),
      creditsReady: Math.round(stats.creditsReady),
      totalCredits: Math.round(stats.totalEarned), // Total earned
      totalEarned: Math.round(stats.totalEarned),
      totalWithdrawn: Math.round(stats.totalWithdrawn),
      coinBalance: Math.round(stats.coinBalance),

      // Daily Stats (directly from User model)
      dailyCreditsEarned: Math.round(stats.dailyCreditsEarned),
      dailyCreditLimit: Math.round(stats.dailyCreditLimit),
      dailyProgress: Math.round(stats.dailyProgress),

      // Activity Stats (directly from User model)
      streak: stats.currentStreak,
      currentStreak: stats.currentStreak,
      daysActive: stats.daysActive,

      // Task Stats (directly from User model)
      totalTasks: stats.totalTasksAssigned,
      completedTasks: stats.totalTasksCompleted,
      totalTasksAssigned: stats.totalTasksAssigned,
      totalTasksCompleted: stats.totalTasksCompleted,

      // Referral Stats (directly from User model)
      referralStats: {
        totalReferrals: stats.totalDirectReferrals + stats.totalIndirectReferrals + stats.totalDeepReferrals,
        totalEarnings: Math.round(stats.totalReferralEarnings),
        activeReferrals: stats.totalDirectReferrals,
        level1Referrals: stats.totalDirectReferrals,
        level2Referrals: stats.totalIndirectReferrals,
        level3Referrals: stats.totalDeepReferrals
      },

      // Referral Chain
      referralChain: {
        level1: stats.level1ReferralUserId,
        level2: stats.level2ReferralUserId,
        level3: stats.level3ReferralUserId
      },

      // User Info
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        vipLevel: user.vipLevel,
        isVipActive: user.isVipActive,
        vipExpiry: user.vipExpiry,
        referralCode: user.referralCode,
        
        // Direct access to User model stats
        creditsReady: user.creditsReady,
        totalEarned: user.totalEarned,
        totalWithdrawn: user.totalWithdrawn,
        coinBalance: user.coinBalance,
        daysActive: user.daysActive,
        currentStreak: user.currentStreak
      }
    });

  } catch (error) {
    console.error('❌ Get dashboard V2 stats error:', error);
    console.error('❌ V2 Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to get dashboard V2 statistics',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/stats/cleanup-database
// @desc    Clean up old database collections (admin only)
// @access  Private
router.post('/cleanup-database', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    // Only allow admin to run cleanup
    if (user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    console.log('🗑️  Database cleanup requested by admin:', user.email);

    const { cleanupOldDatabase } = require('../scripts/cleanup-old-database');
    await cleanupOldDatabase();

    res.json({
      message: 'Database cleanup completed successfully!',
      note: 'Old trial collections have been removed. System now uses User model exclusively.'
    });

  } catch (error) {
    console.error('❌ Database cleanup error:', error);
    res.status(500).json({ 
      message: 'Failed to cleanup database',
      error: error.message 
    });
  }
});

// @route   POST /api/stats/populate-from-old-fields
// @desc    Populate new User model stats from old fields if they exist
// @access  Private
router.post('/populate-from-old-fields', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔄 Populating new stats from old fields for user:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('📊 Before population:', {
      creditsReady: user.creditsReady,
      totalEarned: user.totalEarned,
      oldTotalCredits: user.totalCredits,
      oldAvailableCredits: user.availableCredits,
      coinBalance: user.coinBalance
    });

    // Populate new fields from old fields if they exist and new fields are empty
    if ((user.creditsReady === undefined || user.creditsReady === null || user.creditsReady === 0) && user.availableCredits) {
      user.creditsReady = user.availableCredits;
      console.log('✅ Set creditsReady from availableCredits:', user.creditsReady);
    }

    if ((user.totalEarned === undefined || user.totalEarned === null || user.totalEarned === 0) && user.totalCredits) {
      user.totalEarned = user.totalCredits;
      console.log('✅ Set totalEarned from totalCredits:', user.totalEarned);
    }

    // Set some basic activity stats if they're missing
    if (user.daysActive === undefined || user.daysActive === null) {
      user.daysActive = 1; // At least 1 day since they have an account
    }

    if (user.currentStreak === undefined || user.currentStreak === null) {
      user.currentStreak = 1; // At least 1 day streak
    }

    if (user.dailyProgress === undefined || user.dailyProgress === null) {
      user.dailyProgress = 0;
    }

    if (user.totalTasksAssigned === undefined || user.totalTasksAssigned === null) {
      user.totalTasksAssigned = 0;
    }

    if (user.totalTasksCompleted === undefined || user.totalTasksCompleted === null) {
      user.totalTasksCompleted = 0;
    }

    // Initialize referral stats
    if (user.totalDirectReferrals === undefined || user.totalDirectReferrals === null) {
      user.totalDirectReferrals = 0;
    }

    if (user.totalReferralEarnings === undefined || user.totalReferralEarnings === null) {
      user.totalReferralEarnings = 0;
    }

    await user.save();

    console.log('✅ After population:', {
      creditsReady: user.creditsReady,
      totalEarned: user.totalEarned,
      daysActive: user.daysActive,
      currentStreak: user.currentStreak,
      coinBalance: user.coinBalance
    });

    res.json({
      message: 'User stats populated from old fields successfully!',
      before: {
        creditsReady: req.body.before?.creditsReady || 'undefined',
        totalEarned: req.body.before?.totalEarned || 'undefined'
      },
      after: {
        creditsReady: user.creditsReady,
        totalEarned: user.totalEarned,
        totalWithdrawn: user.totalWithdrawn || 0,
        coinBalance: user.coinBalance,
        daysActive: user.daysActive,
        currentStreak: user.currentStreak,
        totalTasksAssigned: user.totalTasksAssigned,
        totalTasksCompleted: user.totalTasksCompleted,
        totalDirectReferrals: user.totalDirectReferrals,
        totalReferralEarnings: user.totalReferralEarnings
      }
    });

  } catch (error) {
    console.error('❌ Populate from old fields error:', error);
    res.status(500).json({ 
      message: 'Failed to populate from old fields',
      error: error.message 
    });
  }
});

// @route   POST /api/stats/seed-test-data
// @desc    Add test data directly to User model (NEW IMPLEMENTATION - no old database)
// @access  Private
router.post('/seed-test-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🌱 Seeding test data for user (NEW IMPLEMENTATION):', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user stats directly in User model (NO OLD DATABASE DEPENDENCIES)
    user.creditsReady = (user.creditsReady || 0) + 175; // Add test credits
    user.totalEarned = user.creditsReady + (user.totalWithdrawn || 0); // Update total earned
    user.coinBalance = (user.coinBalance || 0) + 250; // Add test coins
    user.dailyCreditsEarned = 75; // Set some daily progress
    user.dailyProgress = Math.min((75 / user.getDailyCreditLimit()) * 100, 100); // Calculate progress percentage
    user.daysActive = (user.daysActive || 0) + 1; // Increment days active
    user.currentStreak = Math.max(user.currentStreak || 0, 1); // Set minimum streak
    user.totalTasksAssigned = (user.totalTasksAssigned || 0) + 5; // Add test tasks
    user.totalTasksCompleted = (user.totalTasksCompleted || 0) + 3; // Add completed tasks
    
    // Add some referral stats for testing
    user.totalDirectReferrals = (user.totalDirectReferrals || 0) + 2;
    user.totalReferralEarnings = (user.totalReferralEarnings || 0) + 50;
    
    // Update activity tracking
    user.updateActivityStats();
    
    await user.save();

    console.log('✅ Test data seeded successfully (User model only):', {
      creditsReady: user.creditsReady,
      totalEarned: user.totalEarned,
      coinBalance: user.coinBalance,
      daysActive: user.daysActive,
      currentStreak: user.currentStreak
    });

    res.json({
      message: 'Test data seeded successfully - User model only (NEW IMPLEMENTATION)!',
      data: {
        // User model stats (no old database)
        creditsReady: user.creditsReady,
        totalEarned: user.totalEarned,
        totalWithdrawn: user.totalWithdrawn,
        coinBalance: user.coinBalance,
        dailyCreditsEarned: user.dailyCreditsEarned,
        dailyProgress: user.dailyProgress,
        daysActive: user.daysActive,
        currentStreak: user.currentStreak,
        totalTasksAssigned: user.totalTasksAssigned,
        totalTasksCompleted: user.totalTasksCompleted,
        totalDirectReferrals: user.totalDirectReferrals,
        totalReferralEarnings: user.totalReferralEarnings
      },
      note: 'All data stored directly in User model - no old database collections used!'
    });

  } catch (error) {
    console.error('❌ Seed test data error:', error);
    res.status(500).json({ 
      message: 'Failed to seed test data',
      error: error.message 
    });
  }
});

// @route   GET /api/stats/debug-current-user
// @desc    Debug current user data in detail
// @access  Private
router.get('/debug-current-user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 Debug current user requested for:', userId);
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the raw user data
    const rawUserData = user.toObject();
    
    // Get the dashboard stats
    const dashboardStats = user.getDashboardStats();

    console.log('📊 Raw User Data:', {
      creditsReady: rawUserData.creditsReady,
      totalEarned: rawUserData.totalEarned,
      coinBalance: rawUserData.coinBalance,
      dailyCreditsEarned: rawUserData.dailyCreditsEarned,
      daysActive: rawUserData.daysActive,
      currentStreak: rawUserData.currentStreak
    });

    res.json({
      message: 'Current user data debug',
      userId: userId,
      rawUserFields: {
        // Financial fields
        creditsReady: rawUserData.creditsReady,
        totalEarned: rawUserData.totalEarned,
        totalWithdrawn: rawUserData.totalWithdrawn,
        coinBalance: rawUserData.coinBalance,
        totalCredits: rawUserData.totalCredits, // Old field
        availableCredits: rawUserData.availableCredits, // Old field
        
        // Activity fields
        dailyCreditsEarned: rawUserData.dailyCreditsEarned,
        dailyProgress: rawUserData.dailyProgress,
        daysActive: rawUserData.daysActive,
        currentStreak: rawUserData.currentStreak,
        
        // Task fields
        totalTasksAssigned: rawUserData.totalTasksAssigned,
        totalTasksCompleted: rawUserData.totalTasksCompleted,
        
        // Referral fields
        totalDirectReferrals: rawUserData.totalDirectReferrals,
        totalIndirectReferrals: rawUserData.totalIndirectReferrals,
        totalDeepReferrals: rawUserData.totalDeepReferrals,
        totalReferralEarnings: rawUserData.totalReferralEarnings
      },
      dashboardStats: dashboardStats,
      fieldStatus: {
        hasCreditsReady: rawUserData.creditsReady !== undefined && rawUserData.creditsReady !== null,
        hasOldCredits: rawUserData.totalCredits !== undefined && rawUserData.totalCredits !== null,
        creditsReadyValue: rawUserData.creditsReady,
        oldCreditsValue: rawUserData.totalCredits,
        coinBalanceValue: rawUserData.coinBalance
      }
    });

  } catch (error) {
    console.error('❌ Debug current user error:', error);
    res.status(500).json({ 
      message: 'Debug failed',
      error: error.message 
    });
  }
});

// @route   GET /api/stats/user-check
// @desc    Check current user data and fields
// @access  Private
router.get('/user-check', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 User check requested for:', userId);
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check which fields exist
    const userFields = {
      // Basic fields
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      
      // VIP fields
      vipLevel: user.vipLevel,
      isVipActive: user.isVipActive,
      
      // Old fields
      totalCredits: user.totalCredits,
      availableCredits: user.availableCredits,
      coinBalance: user.coinBalance,
      dailyCreditsEarned: user.dailyCreditsEarned,
      
      // New User model fields (might be undefined)
      creditsReady: user.creditsReady,
      totalEarned: user.totalEarned,
      totalWithdrawn: user.totalWithdrawn,
      daysActive: user.daysActive,
      currentStreak: user.currentStreak,
      dailyProgress: user.dailyProgress,
      totalTasksAssigned: user.totalTasksAssigned,
      totalTasksCompleted: user.totalTasksCompleted,
      totalDirectReferrals: user.totalDirectReferrals,
      totalIndirectReferrals: user.totalIndirectReferrals,
      totalDeepReferrals: user.totalDeepReferrals,
      totalReferralEarnings: user.totalReferralEarnings,
      level1ReferralUserId: user.level1ReferralUserId,
      level2ReferralUserId: user.level2ReferralUserId,
      level3ReferralUserId: user.level3ReferralUserId
    };

    res.json({
      message: 'User data retrieved successfully',
      user: userFields,
      hasNewFields: {
        creditsReady: user.creditsReady !== undefined,
        totalEarned: user.totalEarned !== undefined,
        daysActive: user.daysActive !== undefined,
        currentStreak: user.currentStreak !== undefined
      }
    });

  } catch (error) {
    console.error('❌ User check error:', error);
    res.status(500).json({ 
      message: 'User check failed',
      error: error.message 
    });
  }
});

// @route   GET /api/stats/debug/:userId
// @desc    Debug user data for troubleshooting
// @access  Private
router.get('/debug/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('🔍 Debug request for user:', userId);

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get raw data counts
    const creditCount = await Credit.countDocuments({ userId });
    const coinCount = await Coin.countDocuments({ userId });
    const appInstallCount = await AppInstall.countDocuments({ userId });

    // Get sample credit records
    const sampleCredits = await Credit.find({ userId }).limit(5).sort({ createdAt: -1 });
    
    // Get sample coin records
    const sampleCoins = await Coin.find({ userId }).limit(5).sort({ createdAt: -1 });

    // Get user fields
    const userFields = {
      id: user._id,
      email: user.email,
      totalCredits: user.totalCredits,
      availableCredits: user.availableCredits,
      coinBalance: user.coinBalance,
      dailyCreditsEarned: user.dailyCreditsEarned,
      vipLevel: user.vipLevel,
      isVipActive: user.isVipActive
    };

    res.json({
      user: userFields,
      counts: {
        credits: creditCount,
        coins: coinCount,
        appInstalls: appInstallCount
      },
      samples: {
        credits: sampleCredits,
        coins: sampleCoins
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      message: 'Debug failed',
      error: error.message 
    });
  }
});

module.exports = router;
