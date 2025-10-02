const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Credit = require('../models/Credit');
const Task = require('../models/Task');
const Referral = require('../models/Referral');
const VipPurchase = require('../models/VipPurchase');
const AdminLog = require('../models/AdminLog');
const { authenticateAdmin, logAdminAction } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/stats
// @desc    Get admin statistics
// @access  Admin
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get user statistics
    const totalUsers = await User.countDocuments({ isActive: true });
    const activeUsers = await User.countDocuments({ 
      isActive: true,
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    const vipUsers = await User.countDocuments({ 
      isActive: true,
      isVipActive: true
    });

    // Get revenue statistics
    const vipRevenue = await VipPurchase.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get payout statistics
    const totalPayouts = await Credit.aggregate([
      { $match: { type: 'withdrawal', status: 'vested', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
    ]);

    // Get today's statistics
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const todayEarnings = await VipPurchase.aggregate([
      { $match: { createdAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const todayPayouts = await Credit.aggregate([
      { $match: { type: 'withdrawal', status: 'vested', createdAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
    ]);

    res.json({
      totalUsers,
      activeUsers,
      vipUsers,
      totalRevenue: vipRevenue.length > 0 ? vipRevenue[0].total : 0,
      totalPayouts: totalPayouts.length > 0 ? totalPayouts[0].total : 0,
      netProfit: (vipRevenue.length > 0 ? vipRevenue[0].total : 0) - (totalPayouts.length > 0 ? totalPayouts[0].total : 0),
      todayEarnings: todayEarnings.length > 0 ? todayEarnings[0].total : 0,
      todayPayouts: todayPayouts.length > 0 ? todayPayouts[0].total : 0
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Failed to get admin statistics' });
  }
});

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          vipUsers: {
            $sum: { $cond: [{ $gt: ['$vipLevel', 0] }, 1, 0] }
          },
          kycVerified: {
            $sum: { $cond: [{ $eq: ['$kycStatus', 'verified'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get VIP statistics
    const vipStats = await VipPurchase.getVipStats(start, end);

    // Get revenue statistics
    const revenueStats = await VipPurchase.getRevenueStats(start, end);

    // Get task statistics
    const taskStats = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          verifiedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          },
          totalRewards: { $sum: '$reward' }
        }
      }
    ]);

    // Get credit statistics
    const creditStats = await Credit.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalCredits: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$amount' }
        }
      }
    ]);

    // Get referral statistics
    const referralStats = await Referral.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalReferrals: { $sum: 1 },
          activeReferrals: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          totalEarnings: { $sum: '$totalEarnings' }
        }
      }
    ]);

    res.json({
      period: { start, end },
      users: userStats[0] || {
        totalUsers: 0,
        vipUsers: 0,
        kycVerified: 0
      },
      vip: vipStats,
      revenue: revenueStats[0] || {
        totalRevenue: 0,
        totalPurchases: 0,
        averagePurchaseValue: 0
      },
      tasks: taskStats[0] || {
        totalTasks: 0,
        completedTasks: 0,
        verifiedTasks: 0,
        totalRewards: 0
      },
      credits: creditStats[0] || {
        totalCredits: 0,
        totalTransactions: 0,
        averageTransaction: 0
      },
      referrals: referralStats[0] || {
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarnings: 0
      }
    });

  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ message: 'Failed to get admin dashboard' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Admin
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      vipLevel, 
      kycStatus, 
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;
    const query = {};

    // Build query filters
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }
    if (vipLevel !== undefined) query.vipLevel = parseInt(vipLevel);
    if (kycStatus) query.kycStatus = kycStatus;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users: users.map(user => ({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        vipLevel: user.vipLevel,
        vipExpiry: user.vipExpiry,
        isVipActive: user.isVipActive(),
        totalCredits: user.totalCredits,
        availableCredits: user.coinBalance,
        kycStatus: user.kycStatus,
        isActive: user.isActive,
        streak: user.streak,
        badges: user.badges,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

// @route   GET /api/admin/users/:userId
// @desc    Get specific user details
// @access  Admin
router.get('/users/:userId', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's credit history
    const creditHistory = await Credit.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get user's task history
    const taskHistory = await Task.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get user's referral statistics
    const referralStats = await Referral.getReferrerEarnings(userId);

    // Get user's VIP history
    const vipHistory = await VipPurchase.find({ userId })
      .sort({ createdAt: -1 });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        referralCode: user.referralCode,
        vipLevel: user.vipLevel,
        vipExpiry: user.vipExpiry,
        isVipActive: user.isVipActive(),
        totalCredits: user.totalCredits,
        availableCredits: user.coinBalance,
        kycStatus: user.kycStatus,
        isActive: user.isActive,
        streak: user.streak,
        badges: user.badges,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        deviceInfo: user.deviceInfo
      },
      creditHistory,
      taskHistory,
      referralStats,
      vipHistory
    });

  } catch (error) {
    console.error('Get admin user error:', error);
    res.status(500).json({ message: 'Failed to get user details' });
  }
});

// @route   PUT /api/admin/users/:userId
// @desc    Update user details
// @access  Admin
router.put('/users/:userId', authenticateAdmin, logAdminAction('user_updated', 'user_management'), [
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('email').optional().isEmail(),
  body('vipLevel').optional().isInt({ min: 0, max: 3 }),
  body('kycStatus').optional().isIn(['pending', 'verified', 'rejected']),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const updates = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Store old values for logging
    const oldValues = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      vipLevel: user.vipLevel,
      kycStatus: user.kycStatus,
      isActive: user.isActive
    };

    // Update user
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        user[key] = updates[key];
      }
    });

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        vipLevel: user.vipLevel,
        kycStatus: user.kycStatus,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Update admin user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// @route   POST /api/admin/users/:userId/credits
// @desc    Adjust user credits
// @access  Admin
router.post('/users/:userId/credits', authenticateAdmin, logAdminAction('credit_adjusted', 'credit_management', 'high'), [
  body('amount').isNumeric(),
  body('type').isIn(['adjustment', 'bonus', 'penalty']),
  body('description').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { amount, type, description } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create credit entry
    const credit = new Credit({
      userId,
      amount,
      type: 'admin_adjustment',
      source: 'admin',
      description: `Admin ${type}: ${description}`,
      status: 'vested',
      vestingSchedule: { immediate: amount },
      vestingProgress: { immediate: amount },
      isVested: true,
      vestedAt: new Date()
    });

    await credit.save();

    // Update user credits
    user.totalCredits += amount;
    user.coinBalance += amount;
    await user.save();

    res.json({
      message: 'Credits adjusted successfully',
      credit: {
        id: credit._id,
        amount,
        type,
        description
      },
      user: {
        totalCredits: user.totalCredits,
        availableCredits: user.coinBalance
      }
    });

  } catch (error) {
    console.error('Adjust user credits error:', error);
    res.status(500).json({ message: 'Failed to adjust credits' });
  }
});

// @route   GET /api/admin/transactions
// @desc    Get all transactions
// @access  Admin
router.get('/transactions', authenticateAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      userId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;
    const query = {};

    if (type) query.type = type;
    if (userId) query.userId = userId;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transactions = await Credit.find(query)
      .populate('userId', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Credit.countDocuments(query);

    res.json({
      transactions: transactions.map(transaction => ({
        id: transaction._id,
        user: {
          id: transaction.userId._id,
          name: `${transaction.userId.firstName} ${transaction.userId.lastName}`,
          email: transaction.userId.email
        },
        amount: transaction.amount,
        type: transaction.type,
        source: transaction.source,
        description: transaction.description,
        status: transaction.status,
        createdAt: transaction.createdAt
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get admin transactions error:', error);
    res.status(500).json({ message: 'Failed to get transactions' });
  }
});

// @route   GET /api/admin/logs
// @desc    Get admin activity logs
// @access  Admin
router.get('/logs', authenticateAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      adminId,
      action,
      category,
      severity,
      startDate,
      endDate
    } = req.query;
    
    const skip = (page - 1) * limit;
    const query = {};

    if (adminId) query.adminId = adminId;
    if (action) query.action = action;
    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const logs = await AdminLog.find(query)
      .populate('adminId', 'firstName lastName email')
      .populate('targetUserId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdminLog.countDocuments(query);

    res.json({
      logs: logs.map(log => ({
        id: log._id,
        admin: {
          id: log.adminId._id,
          name: `${log.adminId.firstName} ${log.adminId.lastName}`,
          email: log.adminId.email
        },
        targetUser: log.targetUserId ? {
          id: log.targetUserId._id,
          name: `${log.targetUserId.firstName} ${log.targetUserId.lastName}`,
          email: log.targetUserId.email
        } : null,
        action: log.action,
        description: log.description,
        category: log.category,
        severity: log.severity,
        isReversed: log.isReversed,
        createdAt: log.createdAt
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get admin logs error:', error);
    res.status(500).json({ message: 'Failed to get admin logs' });
  }
});

// @route   GET /api/admin/fraud-detection
// @desc    Get fraud detection alerts
// @access  Admin
router.get('/fraud-detection', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const fraudLogs = await AdminLog.getFraudLogs(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      new Date(),
      parseInt(limit)
    );

    res.json({
      fraudLogs: fraudLogs.map(log => ({
        id: log._id,
        admin: {
          name: `${log.adminId.firstName} ${log.adminId.lastName}`,
          email: log.adminId.email
        },
        targetUser: log.targetUserId ? {
          name: `${log.targetUserId.firstName} ${log.targetUserId.lastName}`,
          email: log.targetUserId.email
        } : null,
        action: log.action,
        description: log.description,
        severity: log.severity,
        details: log.details,
        createdAt: log.createdAt
      }))
    });

  } catch (error) {
    console.error('Get fraud detection error:', error);
    res.status(500).json({ message: 'Failed to get fraud detection alerts' });
  }
});

module.exports = router;
