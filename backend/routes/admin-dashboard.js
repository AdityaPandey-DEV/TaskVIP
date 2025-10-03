const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RazorpayWithdrawal = require('../models/RazorpayWithdrawal');
const VipPricing = require('../models/VipPricing');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');

// Get comprehensive admin dashboard stats
router.get('/dashboard', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    // Get basic user stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
    });
    const vipUsers = await User.countDocuments({ isVipActive: true });

    // Get revenue stats
    const vipPricing = await VipPricing.find({ isActive: true });
    const totalRevenue = vipPricing.reduce((sum, plan) => {
      return sum + (plan.price * (plan.purchases || 0));
    }, 0);

    const monthlyRevenue = vipPricing.reduce((sum, plan) => {
      const monthlyPurchases = (plan.purchases || 0) / 12; // Assuming annual plans
      return sum + (plan.price * monthlyPurchases);
    }, 0);

    // Get withdrawal stats
    const totalWithdrawals = await RazorpayWithdrawal.countDocuments();
    const pendingWithdrawals = await RazorpayWithdrawal.countDocuments({ status: 'pending' });

    // Get user growth data (last 30 days)
    const userGrowth = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const usersOnDay = await User.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      userGrowth.push({
        date: startOfDay.toISOString().split('T')[0],
        users: usersOnDay
      });
    }

    // Get revenue data (last 30 days)
    const revenueData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const revenueOnDay = vipPricing.reduce((sum, plan) => {
        // This is a simplified calculation - in reality you'd track daily purchases
        return sum + (plan.price * 0.1); // Placeholder calculation
      }, 0);
      
      revenueData.push({
        date: startOfDay.toISOString().split('T')[0],
        revenue: revenueOnDay
      });
    }

    // Get VIP distribution
    const vipDistribution = [];
    for (let level = 0; level <= 3; level++) {
      const count = await User.countDocuments({ vipLevel: level });
      const plan = vipPricing.find(p => p.level === level);
      vipDistribution.push({
        level,
        count,
        name: plan ? plan.name : `Level ${level}`
      });
    }

    // Get recent activity
    const recentActivity = await User.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('firstName lastName email vipLevel isVipActive updatedAt')
      .lean();

    const formattedActivity = recentActivity.map(user => ({
      id: user._id.toString(),
      type: 'user_activity',
      user: `${user.firstName} ${user.lastName}`,
      amount: user.vipLevel > 0 ? vipPricing.find(p => p.level === user.vipLevel)?.price || 0 : 0,
      timestamp: user.updatedAt.toISOString()
    }));

    res.json({
      totalUsers,
      activeUsers,
      totalRevenue,
      monthlyRevenue,
      vipUsers,
      totalWithdrawals,
      pendingWithdrawals,
      userGrowth,
      revenueData,
      vipDistribution,
      recentActivity: formattedActivity
    });

  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get referral tree data
router.get('/referral-tree', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.query;
    
    // If no userId provided, get the root user (first user or admin)
    let rootUserId = userId;
    if (!rootUserId) {
      const adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (adminUser) {
        rootUserId = adminUser._id;
      } else {
        const firstUser = await User.findOne().sort({ createdAt: 1 });
        rootUserId = firstUser?._id;
      }
    }

    if (!rootUserId) {
      return res.json({ tree: null });
    }

    // Build referral tree recursively
    const buildTree = async (userId, level = 0, maxLevel = 3) => {
      if (level > maxLevel) return null;

      const user = await User.findById(userId)
        .select('firstName lastName email vipLevel isVipActive totalReferralEarnings totalDirectReferrals createdAt')
        .lean();

      if (!user) return null;

      // Get VIP plan info
      const vipPlan = await VipPricing.findOne({ level: user.vipLevel, isActive: true });
      
      // Get direct referrals
      const directReferrals = await User.find({ referredBy: userId })
        .select('_id')
        .lean();

      // Build children recursively
      const children = [];
      for (const referral of directReferrals) {
        const child = await buildTree(referral._id, level + 1, maxLevel);
        if (child) {
          children.push(child);
        }
      }

      return {
        id: user._id.toString(),
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        vipLevel: user.vipLevel || 0,
        vipName: vipPlan ? vipPlan.name : 'Free',
        totalEarnings: user.totalReferralEarnings || 0,
        totalReferrals: user.totalDirectReferrals || 0,
        joinDate: user.createdAt.toISOString(),
        isActive: user.isVipActive || false,
        children,
        level
      };
    };

    const tree = await buildTree(rootUserId);
    res.json({ tree });

  } catch (error) {
    console.error('Error fetching referral tree:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user management data
router.get('/users', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', vipLevel = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // VIP level filter
    if (vipLevel !== '') {
      query.vipLevel = parseInt(vipLevel);
    }

    const users = await User.find(query)
      .select('firstName lastName email vipLevel isVipActive coinBalance totalReferralEarnings createdAt lastActive')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const totalUsers = await User.countDocuments(query);

    // Get VIP plan names
    const vipPricing = await VipPricing.find({ isActive: true });
    const usersWithVipNames = users.map(user => {
      const vipPlan = vipPricing.find(p => p.level === user.vipLevel);
      return {
        ...user,
        vipName: vipPlan ? vipPlan.name : 'Free',
        _id: user._id.toString()
      };
    });

    res.json({
      users: usersWithVipNames,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNextPage: page * limit < totalUsers,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get transaction data
router.get('/transactions', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, type = '', status = '' } = req.query;
    
    const query = {};
    
    // Type filter (withdrawal, vip_purchase, etc.)
    if (type) {
      query.type = type;
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }

    // Get withdrawals
    const withdrawals = await RazorpayWithdrawal.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const totalTransactions = await RazorpayWithdrawal.countDocuments(query);

    res.json({
      transactions: withdrawals,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTransactions / limit),
        totalTransactions,
        hasNextPage: page * limit < totalTransactions,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
