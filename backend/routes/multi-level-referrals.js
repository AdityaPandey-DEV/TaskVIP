const express = require('express');
const mongoose = require('mongoose');
const { MultiLevelReferral, Commission } = require('../models/MultiLevelReferral');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get user's referral statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await MultiLevelReferral.getReferralStats(userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get referral statistics',
      error: error.message
    });
  }
});

// Get user's referral tree
router.get('/tree', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get Level 1 referrals
    const level1Referrals = await MultiLevelReferral.find({ level1Referrer: userId })
      .populate('userId', 'firstName lastName email createdAt coinBalance')
      .sort({ createdAt: -1 });
    
    // Get Level 2 referrals
    const level2Referrals = await MultiLevelReferral.find({ level2Referrer: userId })
      .populate('userId', 'firstName lastName email createdAt coinBalance')
      .sort({ createdAt: -1 });
    
    // Get Level 3 referrals
    const level3Referrals = await MultiLevelReferral.find({ level3Referrer: userId })
      .populate('userId', 'firstName lastName email createdAt coinBalance')
      .sort({ createdAt: -1 });
    
    const tree = {
      level1: level1Referrals.map(ref => ({
        id: ref.userId._id,
        name: `${ref.userId.firstName} ${ref.userId.lastName}`,
        email: ref.userId.email,
        joinedAt: ref.createdAt,
        coinBalance: ref.userId.coinBalance,
        status: ref.status
      })),
      level2: level2Referrals.map(ref => ({
        id: ref.userId._id,
        name: `${ref.userId.firstName} ${ref.userId.lastName}`,
        email: ref.userId.email,
        joinedAt: ref.createdAt,
        coinBalance: ref.userId.coinBalance,
        status: ref.status
      })),
      level3: level3Referrals.map(ref => ({
        id: ref.userId._id,
        name: `${ref.userId.firstName} ${ref.userId.lastName}`,
        email: ref.userId.email,
        joinedAt: ref.createdAt,
        coinBalance: ref.userId.coinBalance,
        status: ref.status
      }))
    };
    
    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('Get referral tree error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get referral tree',
      error: error.message
    });
  }
});

// Get commission history
router.get('/commissions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status = 'all' } = req.query;
    
    const skip = (page - 1) * limit;
    const matchQuery = { toUserId: userId };
    
    if (status !== 'all') {
      matchQuery.status = status;
    }
    
    const commissions = await Commission.find(matchQuery)
      .populate('fromUserId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Commission.countDocuments(matchQuery);
    
    const formattedCommissions = commissions.map(comm => ({
      id: comm._id,
      from: {
        name: `${comm.fromUserId.firstName} ${comm.fromUserId.lastName}`,
        email: comm.fromUserId.email
      },
      level: comm.level,
      percentage: comm.percentage,
      originalAmount: comm.originalAmount,
      commissionAmount: comm.commissionAmount,
      transactionType: comm.transactionType,
      status: comm.status,
      createdAt: comm.createdAt,
      paidAt: comm.paidAt,
      metadata: comm.metadata
    }));
    
    res.json({
      success: true,
      data: {
        commissions: formattedCommissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission history',
      error: error.message
    });
  }
});

// Get referral earnings summary
router.get('/earnings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }
    
    // Get commission earnings by level
    const earningsByLevel = await Commission.aggregate([
      {
        $match: {
          toUserId: new mongoose.Types.ObjectId(userId),
          status: 'paid',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$level',
          totalEarnings: { $sum: '$commissionAmount' },
          transactionCount: { $sum: 1 },
          avgCommission: { $avg: '$commissionAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get earnings by transaction type
    const earningsByType = await Commission.aggregate([
      {
        $match: {
          toUserId: new mongoose.Types.ObjectId(userId),
          status: 'paid',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$transactionType',
          totalEarnings: { $sum: '$commissionAmount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);
    
    // Get total earnings
    const totalEarnings = await Commission.aggregate([
      {
        $match: {
          toUserId: new mongoose.Types.ObjectId(userId),
          status: 'paid',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$commissionAmount' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        earningsByLevel,
        earningsByType,
        totalEarnings: totalEarnings.length > 0 ? totalEarnings[0] : { totalAmount: 0, totalTransactions: 0 }
      }
    });
  } catch (error) {
    console.error('Get referral earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get referral earnings',
      error: error.message
    });
  }
});

// Create referral relationship (used during registration)
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;
    
    if (!referralCode || !newUserId) {
      return res.status(400).json({
        success: false,
        message: 'Referral code and new user ID are required'
      });
    }
    
    const multiLevelReferral = await MultiLevelReferral.buildReferralChain(referralCode, newUserId);
    
    res.json({
      success: true,
      message: 'Multi-level referral created successfully',
      data: multiLevelReferral
    });
  } catch (error) {
    console.error('Create referral error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Process commission payment (internal use)
router.post('/process-commission', authenticateToken, async (req, res) => {
  try {
    const { userId, amount, transactionType, transactionId, metadata } = req.body;
    
    if (!userId || !amount || !transactionType || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }
    
    const result = await MultiLevelReferral.processCommissions(
      userId,
      amount,
      transactionType,
      transactionId,
      metadata
    );
    
    res.json({
      success: true,
      message: result.message,
      data: result.commissions
    });
  } catch (error) {
    console.error('Process commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process commissions',
      error: error.message
    });
  }
});

// Get VIP commission rates
router.get('/vip-rates', authenticateToken, async (req, res) => {
  try {
    const vipRates = {
      level1: {
        nonVip: MultiLevelReferral.getVipCommissionRate(0, 1),
        vip1: MultiLevelReferral.getVipCommissionRate(1, 1),
        vip2: MultiLevelReferral.getVipCommissionRate(2, 1),
        vip3: MultiLevelReferral.getVipCommissionRate(3, 1)
      },
      level2: {
        all: MultiLevelReferral.getVipCommissionRate(1, 2) // Same for all VIP levels
      },
      level3: {
        all: MultiLevelReferral.getVipCommissionRate(1, 3) // Same for all VIP levels
      }
    };
    
    res.json({
      success: true,
      data: vipRates,
      message: 'VIP commission rates retrieved successfully'
    });
  } catch (error) {
    console.error('Get VIP rates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get VIP commission rates',
      error: error.message
    });
  }
});

// Get leaderboard
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, period = 'all' } = req.query;
    
    let dateFilter = {};
    if (period !== 'all') {
      const now = new Date();
      switch (period) {
        case 'week':
          dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
          break;
        case 'month':
          dateFilter.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
          break;
        case 'year':
          dateFilter.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
          break;
      }
    }
    
    const leaderboard = await Commission.aggregate([
      {
        $match: {
          status: 'paid',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$toUserId',
          totalEarnings: { $sum: '$commissionAmount' },
          totalTransactions: { $sum: 1 },
          level1Earnings: {
            $sum: { $cond: [{ $eq: ['$level', 1] }, '$commissionAmount', 0] }
          },
          level2Earnings: {
            $sum: { $cond: [{ $eq: ['$level', 2] }, '$commissionAmount', 0] }
          },
          level3Earnings: {
            $sum: { $cond: [{ $eq: ['$level', 3] }, '$commissionAmount', 0] }
          }
        }
      },
      { $sort: { totalEarnings: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $project: {
          userId: '$_id',
          name: { $concat: [{ $arrayElemAt: ['$user.firstName', 0] }, ' ', { $arrayElemAt: ['$user.lastName', 0] }] },
          email: { $arrayElemAt: ['$user.email', 0] },
          totalEarnings: 1,
          totalTransactions: 1,
          level1Earnings: 1,
          level2Earnings: 1,
          level3Earnings: 1
        }
      }
    ]);
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error: error.message
    });
  }
});

module.exports = router;
