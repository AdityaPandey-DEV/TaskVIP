const express = require('express');
const User = require('../models/User');
const Credit = require('../models/Credit');
const VipPurchase = require('../models/VipPurchase');
const Task = require('../models/Task');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/profit-monitoring/dashboard
// @desc    Get profit monitoring dashboard
// @access  Admin
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get revenue from VIP purchases
    const vipRevenue = await VipPurchase.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          vip1Revenue: {
            $sum: { $cond: [{ $eq: ['$vipLevel', 1] }, '$amount', 0] }
          },
          vip2Revenue: {
            $sum: { $cond: [{ $eq: ['$vipLevel', 2] }, '$amount', 0] }
          },
          vip3Revenue: {
            $sum: { $cond: [{ $eq: ['$vipLevel', 3] }, '$amount', 0] }
          },
          totalPurchases: { $sum: 1 }
        }
      }
    ]);

    // Get total payouts to users
    const totalPayouts = await Credit.aggregate([
      {
        $match: {
          type: { $in: ['task_completion', 'referral_bonus', 'trial_reward'] },
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalPayouts: { $sum: '$amount' },
          taskPayouts: {
            $sum: { $cond: [{ $eq: ['$type', 'task_completion'] }, '$amount', 0] }
          },
          referralPayouts: {
            $sum: { $cond: [{ $eq: ['$type', 'referral_bonus'] }, '$amount', 0] }
          },
          trialPayouts: {
            $sum: { $cond: [{ $eq: ['$type', 'trial_reward'] }, '$amount', 0] }
          }
        }
      }
    ]);

    // Get user statistics by type
    const userStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 },
          totalCredits: { $sum: '$totalCredits' },
          averageCredits: { $avg: '$totalCredits' }
        }
      }
    ]);

    // Get daily earnings breakdown
    const dailyEarnings = await Credit.aggregate([
      {
        $match: {
          type: 'task_completion',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalEarnings: { $sum: '$amount' },
          adCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Calculate profit margins
    const revenue = vipRevenue[0]?.totalRevenue || 0;
    const payouts = totalPayouts[0]?.totalPayouts || 0;
    const netProfit = revenue - payouts;
    const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : 0;

    // Get ad revenue estimation (assuming ₹3 per ad view)
    const totalAdsWatched = await Task.aggregate([
      {
        $match: {
          status: 'verified',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalAds: { $sum: 1 }
        }
      }
    ]);

    const estimatedAdRevenue = (totalAdsWatched[0]?.totalAds || 0) * 3; // ₹3 per ad
    const totalRevenue = revenue + estimatedAdRevenue;
    const adjustedProfit = totalRevenue - payouts;
    const adjustedProfitMargin = totalRevenue > 0 ? ((adjustedProfit / totalRevenue) * 100).toFixed(2) : 0;

    res.json({
      period: { start, end },
      revenue: {
        vipRevenue: revenue,
        estimatedAdRevenue: estimatedAdRevenue,
        totalRevenue: totalRevenue,
        vipBreakdown: {
          vip1: vipRevenue[0]?.vip1Revenue || 0,
          vip2: vipRevenue[0]?.vip2Revenue || 0,
          vip3: vipRevenue[0]?.vip3Revenue || 0
        }
      },
      payouts: {
        total: payouts,
        breakdown: {
          tasks: totalPayouts[0]?.taskPayouts || 0,
          referrals: totalPayouts[0]?.referralPayouts || 0,
          trials: totalPayouts[0]?.trialPayouts || 0
        }
      },
      profit: {
        netProfit: netProfit,
        adjustedProfit: adjustedProfit,
        profitMargin: profitMargin,
        adjustedProfitMargin: adjustedProfitMargin
      },
      users: {
        byType: userStats,
        totalUsers: userStats.reduce((sum, stat) => sum + stat.count, 0)
      },
      ads: {
        totalWatched: totalAdsWatched[0]?.totalAds || 0,
        estimatedRevenue: estimatedAdRevenue
      },
      dailyEarnings
    });

  } catch (error) {
    console.error('Get profit monitoring error:', error);
    res.status(500).json({ message: 'Failed to get profit monitoring data' });
  }
});

// @route   GET /api/profit-monitoring/user-analysis
// @desc    Get user earning analysis
// @access  Admin
router.get('/user-analysis', authenticateAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get top earners
    const topEarners = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $lookup: {
          from: 'credits',
          localField: '_id',
          foreignField: 'userId',
          as: 'credits'
        }
      },
      {
        $addFields: {
          totalEarned: {
            $sum: {
              $map: {
                input: '$credits',
                as: 'credit',
                in: { $cond: [{ $gt: ['$$credit.amount', 0] }, '$$credit.amount', 0] }
              }
            }
          }
        }
      },
      { $sort: { totalEarned: -1 } },
      { $limit: 10 },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          userType: 1,
          vipLevel: 1,
          totalCredits: 1,
          totalEarned: 1,
          createdAt: 1
        }
      }
    ]);

    // Get user type profitability
    const userTypeProfitability = await User.aggregate([
      {
        $lookup: {
          from: 'credits',
          localField: '_id',
          foreignField: 'userId',
          as: 'credits'
        }
      },
      {
        $addFields: {
          totalEarned: {
            $sum: {
              $map: {
                input: '$credits',
                as: 'credit',
                in: { $cond: [{ $gt: ['$$credit.amount', 0] }, '$$credit.amount', 0] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 },
          totalEarned: { $sum: '$totalEarned' },
          averageEarned: { $avg: '$totalEarned' },
          maxEarned: { $max: '$totalEarned' }
        }
      }
    ]);

    res.json({
      period: { start, end },
      topEarners,
      userTypeProfitability
    });

  } catch (error) {
    console.error('Get user analysis error:', error);
    res.status(500).json({ message: 'Failed to get user analysis' });
  }
});

// @route   GET /api/profit-monitoring/fraud-alerts
// @desc    Get fraud detection alerts
// @access  Admin
router.get('/fraud-alerts', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // Detect potential fraud patterns
    const fraudAlerts = [];

    // 1. Multiple accounts from same IP
    const sameIpUsers = await User.aggregate([
      {
        $group: {
          _id: '$deviceInfo.ip',
          count: { $sum: 1 },
          users: { $push: { id: '$_id', email: '$email', createdAt: '$createdAt' } }
        }
      },
      { $match: { count: { $gt: 3 } } },
      { $limit: parseInt(limit) }
    ]);

    sameIpUsers.forEach(ip => {
      fraudAlerts.push({
        type: 'multiple_accounts_same_ip',
        severity: 'high',
        description: `${ip.count} accounts from same IP`,
        ip: ip._id,
        users: ip.users
      });
    });

    // 2. Unusual earning patterns
    const unusualEarners = await User.aggregate([
      {
        $lookup: {
          from: 'credits',
          localField: '_id',
          foreignField: 'userId',
          as: 'credits'
        }
      },
      {
        $addFields: {
          totalEarned: {
            $sum: {
              $map: {
                input: '$credits',
                as: 'credit',
                in: { $cond: [{ $gt: ['$$credit.amount', 0] }, '$$credit.amount', 0] }
              }
            }
          },
          accountAge: {
            $divide: [
              { $subtract: [new Date(), '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $addFields: {
          dailyAverage: {
            $cond: [
              { $gt: ['$accountAge', 0] },
              { $divide: ['$totalEarned', '$accountAge'] },
              0
            ]
          }
        }
      },
      {
        $match: {
          dailyAverage: { $gt: 50 }, // More than ₹50/day average
          userType: { $ne: 'vip' }
        }
      },
      { $limit: parseInt(limit) }
    ]);

    unusualEarners.forEach(user => {
      fraudAlerts.push({
        type: 'unusual_earning_pattern',
        severity: 'medium',
        description: `User earning ₹${user.dailyAverage.toFixed(2)}/day as ${user.userType}`,
        userId: user._id,
        email: user.email,
        totalEarned: user.totalEarned,
        dailyAverage: user.dailyAverage
      });
    });

    res.json({
      fraudAlerts,
      totalAlerts: fraudAlerts.length,
      highSeverity: fraudAlerts.filter(alert => alert.severity === 'high').length,
      mediumSeverity: fraudAlerts.filter(alert => alert.severity === 'medium').length
    });

  } catch (error) {
    console.error('Get fraud alerts error:', error);
    res.status(500).json({ message: 'Failed to get fraud alerts' });
  }
});

module.exports = router;

