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
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get credit statistics
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
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      message: 'Failed to get dashboard statistics',
      error: error.message 
    });
  }
});

module.exports = router;
