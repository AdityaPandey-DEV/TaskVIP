const express = require('express');
const User = require('../models/User');
const Credit = require('../models/Credit');
const VipPurchase = require('../models/VipPurchase');
const Wallet = require('../models/Wallet');

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

module.exports = router;
