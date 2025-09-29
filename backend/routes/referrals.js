const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Credit = require('../models/Credit');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/referrals/info
// @desc    Get user's referral information
// @access  Private
router.get('/info', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Get referral statistics
    const referralStats = await Referral.getReferrerEarnings(userId);
    
    // Get recent referrals
    const recentReferrals = await Referral.find({ referrer: userId })
      .populate('referred', 'firstName lastName email createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get VIP benefits for referral bonus calculation
    const vipBenefits = user.getVipBenefits();

    res.json({
      referralCode: user.referralCode,
      referralLink: `${process.env.FRONTEND_URL}/register?ref=${user.referralCode}`,
      stats: referralStats,
      vipLevel: user.vipLevel,
      referralBonus: vipBenefits.referralBonus,
      recentReferrals: recentReferrals.map(ref => ({
        id: ref._id,
        referred: {
          id: ref.referred._id,
          name: `${ref.referred.firstName} ${ref.referred.lastName}`,
          email: ref.referred.email,
          joinedAt: ref.referred.createdAt
        },
        status: ref.status,
        totalEarnings: ref.totalEarnings,
        createdAt: ref.createdAt
      }))
    });

  } catch (error) {
    console.error('Get referral info error:', error);
    res.status(500).json({ message: 'Failed to get referral information' });
  }
});

// @route   GET /api/referrals/stats
// @desc    Get detailed referral statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get referral statistics
    const stats = await Referral.getReferrerEarnings(userId);
    const periodStats = await Referral.getReferralStats(userId, start, end);

    // Get milestone achievements
    const milestones = await Referral.find({
      referrer: userId,
      'milestones.type': { $exists: true }
    }).select('milestones createdAt');

    res.json({
      period: { start, end },
      overall: stats,
      periodStats,
      milestones: milestones.flatMap(ref => 
        ref.milestones.map(milestone => ({
          type: milestone.type,
          achievedAt: milestone.achievedAt,
          bonusCredits: milestone.bonusCredits
        }))
      )
    });

  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ message: 'Failed to get referral statistics' });
  }
});

// @route   GET /api/referrals/list
// @desc    Get list of referrals
// @access  Private
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    const query = { referrer: userId };
    if (status) query.status = status;

    const referrals = await Referral.find(query)
      .populate('referred', 'firstName lastName email phone vipLevel createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Referral.countDocuments(query);

    res.json({
      referrals: referrals.map(ref => ({
        id: ref._id,
        referred: {
          id: ref.referred._id,
          name: `${ref.referred.firstName} ${ref.referred.lastName}`,
          email: ref.referred.email,
          phone: ref.referred.phone,
          vipLevel: ref.referred.vipLevel,
          joinedAt: ref.referred.createdAt
        },
        status: ref.status,
        bonusCredits: ref.bonusCredits,
        totalEarnings: ref.totalEarnings,
        milestones: ref.milestones,
        lastActivity: ref.lastActivity,
        createdAt: ref.createdAt
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get referrals list error:', error);
    res.status(500).json({ message: 'Failed to get referrals list' });
  }
});

// @route   GET /api/referrals/my-referrals
// @desc    Get user's referral list (alias for /list)
// @access  Private
router.get('/my-referrals', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    const referrals = await Referral.find({ referrer: userId })
      .populate('referred', 'firstName lastName email userType vipLevel createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Referral.countDocuments({ referrer: userId });

    res.json({
      referrals: referrals.map(referral => ({
        id: referral._id,
        referredUser: {
          firstName: referral.referred.firstName,
          lastName: referral.referred.lastName,
          email: referral.referred.email,
          userType: referral.referred.userType,
          vipLevel: referral.referred.vipLevel,
          createdAt: referral.referred.createdAt
        },
        status: referral.status,
        bonusCredits: referral.bonusCredits,
        pendingCredits: referral.pendingCredits,
        totalEarnings: referral.totalEarnings,
        createdAt: referral.createdAt
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get my referrals error:', error);
    res.status(500).json({ message: 'Failed to get referrals' });
  }
});

// @route   POST /api/referrals/validate
// @desc    Validate a referral code
// @access  Public
router.post('/validate', [
  body('referralCode').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { referralCode } = req.body;

    // Find user with referral code
    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }

    res.json({
      valid: true,
      referrer: {
        name: `${referrer.firstName} ${referrer.lastName}`,
        vipLevel: referrer.vipLevel
      }
    });

  } catch (error) {
    console.error('Validate referral code error:', error);
    res.status(500).json({ message: 'Failed to validate referral code' });
  }
});

// @route   POST /api/referrals/award-bonus
// @desc    Award referral bonus (internal use)
// @access  Private
router.post('/award-bonus', authenticateToken, [
  body('referredUserId').isMongoId(),
  body('bonusType').isIn(['signup', 'vip_purchase', 'task_completion', 'milestone']),
  body('amount').isNumeric().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { referredUserId, bonusType, amount } = req.body;
    const referrerId = req.user._id;

    // Find referral relationship
    const referral = await Referral.findOne({
      referrer: referrerId,
      referred: referredUserId
    });

    if (!referral) {
      return res.status(404).json({ message: 'Referral relationship not found' });
    }

    // Award bonus
    await referral.awardBonus(amount, bonusType);

    // Create credit entry for referrer
    const credit = new Credit({
      userId: referrerId,
      amount,
      type: 'referral_bonus',
      source: 'referral_task',
      description: `Referral bonus: ${bonusType}`,
      status: 'vested',
      vestingSchedule: {
        immediate: amount
      },
      vestingProgress: {
        immediate: amount
      },
      isVested: true,
      vestedAt: new Date(),
      relatedReferral: referral._id
    });

    await credit.save();

    // Update referrer's credits
    const referrer = await User.findById(referrerId);
    referrer.totalCredits += amount;
    referrer.availableCredits += amount;
    await referrer.save();

    res.json({
      message: 'Referral bonus awarded successfully',
      bonus: {
        amount,
        type: bonusType,
        referralId: referral._id
      },
      referrer: {
        totalCredits: referrer.totalCredits,
        availableCredits: referrer.availableCredits
      }
    });

  } catch (error) {
    console.error('Award referral bonus error:', error);
    res.status(500).json({ message: 'Failed to award referral bonus' });
  }
});

// @route   GET /api/referrals/leaderboard
// @desc    Get referral leaderboard
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const topReferrers = await Referral.getTopReferrers(
      parseInt(limit),
      start,
      end
    );

    res.json({
      period: { start, end },
      leaderboard: topReferrers
    });

  } catch (error) {
    console.error('Get referral leaderboard error:', error);
    res.status(500).json({ message: 'Failed to get referral leaderboard' });
  }
});

// @route   GET /api/referrals/milestones
// @desc    Get referral milestones
// @access  Private
router.get('/milestones', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const referralStats = await Referral.getReferrerEarnings(userId);

    const milestones = [
      {
        id: 'first_referral',
        title: 'First Referral',
        description: 'Get your first referral',
        requirement: 1,
        current: referralStats.totalReferrals,
        achieved: referralStats.totalReferrals >= 1,
        reward: 50,
        icon: 'user-plus'
      },
      {
        id: 'five_referrals',
        title: 'Referral Master',
        description: 'Get 5 referrals',
        requirement: 5,
        current: referralStats.totalReferrals,
        achieved: referralStats.totalReferrals >= 5,
        reward: 200,
        icon: 'users'
      },
      {
        id: 'ten_referrals',
        title: 'Referral Expert',
        description: 'Get 10 referrals',
        requirement: 10,
        current: referralStats.totalReferrals,
        achieved: referralStats.totalReferrals >= 10,
        reward: 500,
        icon: 'crown'
      },
      {
        id: 'vip_referral',
        title: 'VIP Recruiter',
        description: 'Refer someone who purchases VIP',
        requirement: 1,
        current: 0, // This would need to be calculated
        achieved: false,
        reward: 100,
        icon: 'star'
      }
    ];

    res.json({
      milestones,
      stats: referralStats
    });

  } catch (error) {
    console.error('Get referral milestones error:', error);
    res.status(500).json({ message: 'Failed to get referral milestones' });
  }
});

// @route   POST /api/referrals/claim-milestone
// @desc    Claim milestone reward
// @access  Private
router.post('/claim-milestone', authenticateToken, [
  body('milestoneId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { milestoneId } = req.body;
    const userId = req.user._id;

    // Check if milestone is already claimed
    const existingMilestone = await Referral.findOne({
      referrer: userId,
      'milestones.type': milestoneId
    });

    if (existingMilestone) {
      return res.status(400).json({ message: 'Milestone already claimed' });
    }

    // Get milestone details
    const milestoneRewards = {
      first_referral: 50,
      five_referrals: 200,
      ten_referrals: 500,
      vip_referral: 100
    };

    const reward = milestoneRewards[milestoneId];
    if (!reward) {
      return res.status(400).json({ message: 'Invalid milestone' });
    }

    // Award milestone reward
    const credit = new Credit({
      userId,
      amount: reward,
      type: 'milestone_reward',
      source: 'milestone',
      description: `Milestone reward: ${milestoneId}`,
      status: 'vested',
      vestingSchedule: {
        immediate: reward
      },
      vestingProgress: {
        immediate: reward
      },
      isVested: true,
      vestedAt: new Date()
    });

    await credit.save();

    // Update user credits
    const user = await User.findById(userId);
    user.totalCredits += reward;
    user.availableCredits += reward;
    await user.save();

    res.json({
      message: 'Milestone reward claimed successfully',
      reward,
      user: {
        totalCredits: user.totalCredits,
        availableCredits: user.availableCredits
      }
    });

  } catch (error) {
    console.error('Claim milestone error:', error);
    res.status(500).json({ message: 'Failed to claim milestone reward' });
  }
});

module.exports = router;
