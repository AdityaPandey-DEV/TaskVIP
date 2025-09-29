const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get wallet information
    const wallet = await Wallet.getOrCreateWallet(user._id);

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        referralCode: user.referralCode,
        vipLevel: user.vipLevel,
        vipExpiry: user.vipExpiry,
        isVipActive: user.isVipActive,
        userType: user.userType,
        trialExpiry: user.trialExpiry,
        emailVerified: user.emailVerified,
        kycStatus: user.kycStatus,
        totalCredits: user.totalCredits,
        availableCredits: user.availableCredits,
        withdrawableCredits: user.withdrawableCredits,
        streak: user.streak,
        badges: user.badges,
        createdAt: user.createdAt
      },
      wallet: wallet.getAvailableBalance()
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 2 }),
  body('lastName').optional().trim().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone('en-IN')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, phone } = req.body;
    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        referralCode: user.referralCode,
        vipLevel: user.vipLevel,
        vipExpiry: user.vipExpiry,
        isVipActive: user.isVipActive,
        userType: user.userType,
        emailVerified: user.emailVerified,
        kycStatus: user.kycStatus,
        totalCredits: user.totalCredits,
        availableCredits: user.availableCredits,
        withdrawableCredits: user.withdrawableCredits,
        streak: user.streak,
        badges: user.badges,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get wallet stats
    const wallet = await Wallet.getOrCreateWallet(userId);

    // Get user benefits
    const benefits = user.getVipBenefits();
    const dailyAdsLimit = user.getDailyAdsLimit();
    const perAdReward = user.getPerAdReward();
    const maxDailyEarning = user.getMaxDailyEarning();

    res.json({
      user: {
        userType: user.userType,
        vipLevel: user.vipLevel,
        isVipActive: user.isVipActive,
        trialExpiry: user.trialExpiry,
        emailVerified: user.emailVerified,
        kycStatus: user.kycStatus
      },
      earnings: {
        totalCredits: user.totalCredits,
        availableCredits: user.availableCredits,
        withdrawableCredits: user.withdrawableCredits,
        dailyCreditsEarned: user.dailyCreditsEarned,
        dailyAdsWatched: user.dailyAdsWatched,
        streak: user.streak
      },
      limits: {
        dailyAdsLimit,
        perAdReward,
        maxDailyEarning,
        hasReachedDailyAdsLimit: user.hasReachedDailyAdsLimit(),
        hasReachedDailyEarningLimit: user.hasReachedDailyEarningLimit()
      },
      wallet: wallet.getAvailableBalance(),
      benefits
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Failed to get user stats' });
  }
});

// @route   POST /api/users/update-type
// @desc    Update user type (trial to free)
// @access  Private
router.post('/update-type', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user type based on current status
    await user.updateUserType();

    res.json({
      message: 'User type updated successfully',
      userType: user.userType,
      isTrialActive: user.isTrialActive(),
      isFreeUser: user.isFreeUser()
    });

  } catch (error) {
    console.error('Update user type error:', error);
    res.status(500).json({ message: 'Failed to update user type' });
  }
});

// @route   GET /api/users/referral-stats
// @desc    Get user referral statistics
// @access  Private
router.get('/referral-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get referral statistics
    const Referral = require('../models/Referral');
    const referrals = await Referral.find({ referrer: userId });
    
    const stats = {
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter(r => r.status === 'active').length,
      totalEarnings: referrals.reduce((sum, r) => sum + (r.bonusCredits || 0), 0),
      pendingEarnings: referrals.reduce((sum, r) => sum + (r.pendingCredits || 0), 0)
    };

    res.json(stats);

  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ message: 'Failed to get referral stats' });
  }
});

// @route   GET /api/users/activity
// @desc    Get user activity log
// @access  Private
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    // Get credit history as activity log
    const Credit = require('../models/Credit');
    const activities = await Credit.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('amount type source description status createdAt');

    const total = await Credit.countDocuments({ userId });

    res.json({
      activities: activities.map(activity => ({
        id: activity._id,
        amount: activity.amount,
        type: activity.type,
        source: activity.source,
        description: activity.description,
        status: activity.status,
        createdAt: activity.createdAt
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ message: 'Failed to get activity log' });
  }
});

module.exports = router;
