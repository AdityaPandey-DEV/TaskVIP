const express = require('express');
const { body, validationResult } = require('express-validator');
const CoinTransaction = require('../models/Coin');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/coins/balance
// @desc    Get user's coin balance
// @access  Private
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const balance = await CoinTransaction.getUserBalance(req.user._id);
    const stats = await CoinTransaction.getUserStats(req.user._id, 30);
    
    res.json({
      balance,
      stats,
      conversionRate: {
        coinsPerRupee: 10,
        rupeesPerCoin: 0.1,
        minimumWithdrawal: 1000 // coins
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ message: 'Failed to get balance' });
  }
});

// @route   GET /api/coins/transactions
// @desc    Get user's coin transaction history
// @access  Private
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { userId: req.user._id };
    if (type) query.type = type;
    
    const transactions = await CoinTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-metadata.ipAddress -metadata.userAgent -metadata.deviceId');
    
    const total = await CoinTransaction.countDocuments(query);
    
    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to get transactions' });
  }
});

// @route   POST /api/coins/reward/admob
// @desc    Award coins for AdMob rewarded video
// @access  Private
router.post('/reward/admob', authenticateToken, [
  body('adUnitId').notEmpty().trim(),
  body('rewardAmount').isInt({ min: 1, max: 10 }).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { adUnitId, rewardAmount = 5 } = req.body;
    
    // Create reward transaction
    const transaction = await CoinTransaction.createReward(
      req.user._id,
      'earned_admob_video',
      rewardAmount,
      'Watched AdMob rewarded video',
      {
        adNetwork: 'admob',
        adUnitId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceId: req.headers['x-device-id'] || 'unknown'
      }
    );
    
    const newBalance = await CoinTransaction.getUserBalance(req.user._id);
    
    res.json({
      message: 'Reward earned successfully!',
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status
      },
      newBalance
    });
  } catch (error) {
    console.error('AdMob reward error:', error);
    res.status(500).json({ message: 'Failed to process reward' });
  }
});

// @route   POST /api/coins/reward/daily-bonus
// @desc    Award daily login bonus
// @access  Private
router.post('/reward/daily-bonus', authenticateToken, async (req, res) => {
  try {
    // Check if user already claimed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingBonus = await CoinTransaction.findOne({
      userId: req.user._id,
      type: 'earned_daily_bonus',
      createdAt: { $gte: today }
    });
    
    if (existingBonus) {
      return res.status(400).json({ message: 'Daily bonus already claimed today' });
    }
    
    // Calculate bonus based on streak
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    const bonusAmount = Math.min(10 + user.streak, 50); // 10 base + streak, max 50
    
    const transaction = await CoinTransaction.createReward(
      req.user._id,
      'earned_daily_bonus',
      bonusAmount,
      `Daily login bonus (${user.streak} day streak)`,
      {
        streak: user.streak,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceId: req.headers['x-device-id'] || 'unknown'
      }
    );
    
    const newBalance = await CoinTransaction.getUserBalance(req.user._id);
    
    res.json({
      message: 'Daily bonus claimed!',
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        streak: user.streak
      },
      newBalance
    });
  } catch (error) {
    console.error('Daily bonus error:', error);
    res.status(500).json({ message: 'Failed to claim daily bonus' });
  }
});

// @route   GET /api/coins/leaderboard
// @desc    Get top earners leaderboard
// @access  Private
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    const leaderboard = await CoinTransaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          amount: { $gt: 0 },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$userId',
          totalCoins: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalCoins: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            { $project: { firstName: 1, lastName: 1, vipLevel: 1 } }
          ]
        }
      },
      { $unwind: '$user' }
    ]);
    
    // Find current user's rank
    const userRank = leaderboard.findIndex(entry => entry._id.equals(req.user._id)) + 1;
    
    res.json({
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        name: `${entry.user.firstName} ${entry.user.lastName}`,
        totalCoins: entry.totalCoins,
        transactionCount: entry.transactionCount,
        vipLevel: entry.user.vipLevel,
        isCurrentUser: entry._id.equals(req.user._id)
      })),
      userRank: userRank || null,
      period
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Failed to get leaderboard' });
  }
});

module.exports = router;
