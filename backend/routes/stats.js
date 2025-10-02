const express = require('express');
const User = require('../models/User');
const Credit = require('../models/Credit');
const VipPurchase = require('../models/VipPurchase');
const Wallet = require('../models/Wallet');
const Coin = require('../models/Coin');
const AppInstall = require('../models/AppInstall');
const { MultiLevelReferral } = require('../models/MultiLevelReferral');
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
// @desc    Get user's comprehensive dashboard statistics
// @access  Private
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📊 Dashboard stats requested for user:', userId);
    
    const user = await User.findById(userId);

    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User found:', user.email, 'VIP Level:', user.vipLevel);

    // Get credit statistics
    console.log('💰 Fetching credit statistics...');
    const availableCredits = await Credit.getUserAvailableCredits(userId);
    const totalCredits = await Credit.getUserTotalCredits(userId);
    console.log('💰 Credits - Available:', availableCredits, 'Total:', totalCredits);
    
    // Get today's credits earned
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCredits = await Credit.aggregate([
      {
        $match: {
          userId: new require('mongoose').Types.ObjectId(userId),
          createdAt: { $gte: today, $lt: tomorrow },
          amount: { $gt: 0 }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const dailyCreditsEarned = todayCredits.length > 0 ? todayCredits[0].total : 0;

    // Get coin statistics
    const coinStats = await Coin.aggregate([
      { $match: { userId: new require('mongoose').Types.ObjectId(userId), status: 'completed' } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalCoinsEarned = coinStats
      .filter(stat => stat._id === 'earned')
      .reduce((sum, stat) => sum + stat.total, 0);

    // Get task completion statistics
    const completedTasks = await Credit.countDocuments({
      userId,
      type: { $in: ['task_completion', 'ad_watch', 'survey_completion'] },
      status: 'vested'
    });

    const totalTasks = await Credit.countDocuments({
      userId,
      type: { $in: ['task_completion', 'ad_watch', 'survey_completion'] }
    });

    // Get app install statistics
    const appInstallStats = await AppInstall.getInstallStats(userId);
    const completedAppInstalls = appInstallStats.summary.completedInstalls || 0;

    // Calculate streak (consecutive days with activity)
    let streak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) { // Check up to 365 days
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const hasActivity = await Credit.countDocuments({
        userId,
        createdAt: { $gte: dayStart, $lt: dayEnd },
        amount: { $gt: 0 }
      });

      if (hasActivity > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Get referral statistics
    const referralStats = await MultiLevelReferral.getReferralStats(userId);

    // Get recent activity
    const recentActivity = await Credit.find({
      userId,
      amount: { $gt: 0 }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('amount type source description createdAt');

    // Calculate daily progress
    const dailyCreditLimit = user.getDailyCreditLimit();
    const dailyProgress = Math.min((dailyCreditsEarned / dailyCreditLimit) * 100, 100);

    res.json({
      // Credit stats
      availableCredits: Math.round(availableCredits),
      totalCredits: Math.round(totalCredits),
      dailyCreditsEarned: Math.round(dailyCreditsEarned),
      dailyCreditLimit: Math.round(dailyCreditLimit),
      dailyProgress: Math.round(dailyProgress),

      // Coin stats
      coinBalance: user.coinBalance || 0,
      totalCoinsEarned: Math.round(totalCoinsEarned),

      // Task stats
      completedTasks: completedTasks + completedAppInstalls,
      totalTasks: totalTasks + appInstallStats.summary.totalInstalls,
      
      // App install stats
      appInstallStats: appInstallStats.summary,

      // User engagement
      streak,
      
      // Referral stats
      referralStats: {
        totalReferrals: referralStats.totalReferrals || 0,
        totalEarnings: Math.round(referralStats.totalCommissionsEarned || 0),
        activeReferrals: referralStats.activeReferrals || 0,
        level1Referrals: referralStats.level1Referrals || 0,
        level2Referrals: referralStats.level2Referrals || 0,
        level3Referrals: referralStats.level3Referrals || 0
      },

      // Recent activity
      recentActivity,

      // User info
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        vipLevel: user.vipLevel,
        isVipActive: user.isVipActive,
        vipExpiry: user.vipExpiry,
        referralCode: user.referralCode,
        totalCredits: user.totalCredits,
        availableCredits: user.availableCredits,
        coinBalance: user.coinBalance
      }
    });

  } catch (error) {
    console.error('❌ Get dashboard stats error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to get dashboard statistics',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

// @route   POST /api/stats/migrate-user-data
// @desc    Migrate existing Credit/Coin data to User model stats
// @access  Private
router.post('/migrate-user-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔄 Migrating user data for:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get existing credit data
    const availableCredits = await Credit.getUserAvailableCredits(userId);
    const totalCredits = await Credit.getUserTotalCredits(userId);
    
    // Get today's credits earned
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCredits = await Credit.aggregate([
      {
        $match: {
          userId: new require('mongoose').Types.ObjectId(userId),
          createdAt: { $gte: today, $lt: tomorrow },
          amount: { $gt: 0 }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const dailyCreditsEarned = todayCredits.length > 0 ? todayCredits[0].total : 0;

    // Get coin statistics
    const coinStats = await Coin.aggregate([
      { $match: { userId: new require('mongoose').Types.ObjectId(userId), status: 'completed' } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalCoinsEarned = coinStats
      .filter(stat => stat._id === 'earned')
      .reduce((sum, stat) => sum + stat.total, 0);

    // Get task completion statistics
    const completedTasks = await Credit.countDocuments({
      userId,
      type: { $in: ['task_completion', 'ad_watch', 'survey_completion'] },
      status: 'vested'
    });

    const totalTasks = await Credit.countDocuments({
      userId,
      type: { $in: ['task_completion', 'ad_watch', 'survey_completion'] }
    });

    // Calculate streak (consecutive days with activity)
    let streak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) { // Check up to 30 days
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const hasActivity = await Credit.countDocuments({
        userId,
        createdAt: { $gte: dayStart, $lt: dayEnd },
        amount: { $gt: 0 }
      });

      if (hasActivity > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate days active (total days with any activity)
    const daysActiveResult = await Credit.aggregate([
      {
        $match: {
          userId: new require('mongoose').Types.ObjectId(userId),
          amount: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          }
        }
      },
      { $count: 'totalDays' }
    ]);
    const daysActive = daysActiveResult.length > 0 ? daysActiveResult[0].totalDays : 0;

    // Update User model with migrated data
    user.creditsReady = availableCredits;
    user.totalEarned = totalCredits; // Total credits earned (available + withdrawn)
    user.totalWithdrawn = Math.max(0, totalCredits - availableCredits); // Estimate withdrawn
    user.coinBalance = user.coinBalance || 0; // Keep existing coin balance
    user.dailyCreditsEarned = dailyCreditsEarned;
    user.dailyProgress = Math.min((dailyCreditsEarned / user.getDailyCreditLimit()) * 100, 100);
    user.daysActive = daysActive;
    user.currentStreak = streak;
    user.totalTasksAssigned = totalTasks;
    user.totalTasksCompleted = completedTasks;
    
    // Initialize referral stats (will be populated when referrals are processed)
    user.totalDirectReferrals = user.totalDirectReferrals || 0;
    user.totalIndirectReferrals = user.totalIndirectReferrals || 0;
    user.totalDeepReferrals = user.totalDeepReferrals || 0;
    user.totalReferralEarnings = user.totalReferralEarnings || 0;

    await user.save();

    console.log('✅ User data migrated successfully:', {
      creditsReady: user.creditsReady,
      totalEarned: user.totalEarned,
      daysActive: user.daysActive,
      currentStreak: user.currentStreak
    });

    res.json({
      message: 'User data migrated successfully from existing records!',
      migratedData: {
        creditsReady: user.creditsReady,
        totalEarned: user.totalEarned,
        totalWithdrawn: user.totalWithdrawn,
        coinBalance: user.coinBalance,
        dailyCreditsEarned: user.dailyCreditsEarned,
        dailyProgress: user.dailyProgress,
        daysActive: user.daysActive,
        currentStreak: user.currentStreak,
        totalTasksAssigned: user.totalTasksAssigned,
        totalTasksCompleted: user.totalTasksCompleted
      },
      sourceData: {
        availableCredits,
        totalCredits,
        dailyCreditsEarned,
        totalCoinsEarned,
        completedTasks,
        totalTasks,
        streak,
        daysActive
      }
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ 
      message: 'Failed to migrate user data',
      error: error.message 
    });
  }
});

// @route   POST /api/stats/seed-test-data
// @desc    Add test data for user (development only)
// @access  Private
router.post('/seed-test-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🌱 Seeding test data for user:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add some test credits
    const testCredits = [
      {
        userId,
        amount: 100,
        type: 'task_completion',
        source: 'video_ad',
        description: 'Watched video ad',
        status: 'vested',
        isVested: true
      },
      {
        userId,
        amount: 50,
        type: 'ad_watch',
        source: 'propeller_ads',
        description: 'PropellerAds video reward',
        status: 'vested',
        isVested: true
      },
      {
        userId,
        amount: 25,
        type: 'daily_bonus',
        source: 'login_bonus',
        description: 'Daily login bonus',
        status: 'vested',
        isVested: true
      }
    ];

    for (const creditData of testCredits) {
      await Credit.create(creditData);
    }

    // Add some test coins
    const testCoins = [
      {
        userId,
        amount: 150,
        type: 'earned',
        source: 'app_install',
        description: 'Instagram app install reward',
        status: 'completed'
      },
      {
        userId,
        amount: 100,
        type: 'earned',
        source: 'video_ad',
        description: 'Video ad reward',
        status: 'completed'
      }
    ];

    for (const coinData of testCoins) {
      await Coin.create(coinData);
    }

    // Update user stats directly in User model (NEW APPROACH)
    user.creditsReady = (user.creditsReady || 0) + 175; // Add test credits
    user.totalEarned = user.creditsReady + user.totalWithdrawn; // Update total earned
    user.coinBalance = (user.coinBalance || 0) + 250; // Add test coins
    user.dailyCreditsEarned = 75; // Set some daily progress
    user.dailyProgress = 75; // Set daily progress percentage
    user.daysActive = (user.daysActive || 0) + 1; // Increment days active
    user.currentStreak = Math.max(user.currentStreak || 0, 1); // Set minimum streak
    user.totalTasksAssigned = (user.totalTasksAssigned || 0) + 5; // Add test tasks
    user.totalTasksCompleted = (user.totalTasksCompleted || 0) + 3; // Add completed tasks
    
    // Update activity tracking
    user.updateActivityStats();
    
    await user.save();

    res.json({
      message: 'Test data seeded successfully - User model updated!',
      data: {
        creditsAdded: testCredits.length,
        coinsAdded: testCoins.length,
        
        // New User model stats
        creditsReady: user.creditsReady,
        totalEarned: user.totalEarned,
        totalWithdrawn: user.totalWithdrawn,
        coinBalance: user.coinBalance,
        dailyCreditsEarned: user.dailyCreditsEarned,
        dailyProgress: user.dailyProgress,
        daysActive: user.daysActive,
        currentStreak: user.currentStreak,
        totalTasksAssigned: user.totalTasksAssigned,
        totalTasksCompleted: user.totalTasksCompleted
      }
    });

  } catch (error) {
    console.error('Seed test data error:', error);
    res.status(500).json({ 
      message: 'Failed to seed test data',
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
