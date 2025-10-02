const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Credit = require('../models/Credit');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/trial/status
// @desc    Get user's trial status
// @access  Private
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const trialStatus = {
      isTrialActive: user.isTrialActive(),
      trialExpiry: user.trialExpiry,
      trialRewardClaimed: user.trialRewardClaimed,
      userType: user.userType,
      daysRemaining: user.isTrialActive() ? 
        Math.ceil((user.trialExpiry - new Date()) / (1000 * 60 * 60 * 24)) : 0
    };

    res.json(trialStatus);

  } catch (error) {
    console.error('Get trial status error:', error);
    res.status(500).json({ message: 'Failed to get trial status' });
  }
});

// @route   POST /api/trial/claim-reward
// @desc    Claim trial reward (₹5 for first ad)
// @access  Private
router.post('/claim-reward', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Check if user is in trial period
    if (!user.isTrialActive()) {
      return res.status(400).json({ 
        message: 'Trial period has expired' 
      });
    }

    // Check if reward already claimed
    if (user.trialRewardClaimed) {
      return res.status(400).json({ 
        message: 'Trial reward already claimed' 
      });
    }

    // Award trial reward
    const trialReward = 5;
    
    // Create credit entry (credited but not withdrawable until ₹100)
    const credit = new Credit({
      userId: user._id,
      amount: trialReward,
      type: 'trial_reward',
      source: 'trial',
      description: 'Trial reward for first ad',
      status: 'vested',
      vestingSchedule: {
        immediate: trialReward
      },
      vestingProgress: {
        immediate: trialReward
      },
      isVested: true,
      vestedAt: new Date()
    });

    await credit.save();

    // Update user credits
    user.totalCredits += trialReward;
    user.coinBalance += trialReward;
    user.trialRewardClaimed = true;
    await user.save();

    res.json({
      message: 'Trial reward claimed successfully',
      reward: trialReward,
      user: {
        totalCredits: user.totalCredits,
        availableCredits: user.coinBalance,
        withdrawableCredits: user.withdrawableCredits
      }
    });

  } catch (error) {
    console.error('Claim trial reward error:', error);
    res.status(500).json({ message: 'Failed to claim trial reward' });
  }
});

// @route   POST /api/trial/upgrade-to-free
// @desc    Upgrade from trial to free user
// @access  Private
router.post('/upgrade-to-free', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Check if user is in trial period
    if (!user.isTrialActive()) {
      return res.status(400).json({ 
        message: 'Trial period has expired' 
      });
    }

    // Update user type to free
    user.userType = 'free';
    user.trialExpiry = null;
    await user.save();

    res.json({
      message: 'Upgraded to free user successfully',
      userType: user.userType,
      benefits: {
        dailyAdsLimit: 10,
        perAdReward: 1,
        maxDailyEarning: 10,
        referralBonus: 0
      }
    });

  } catch (error) {
    console.error('Upgrade to free error:', error);
    res.status(500).json({ message: 'Failed to upgrade to free user' });
  }
});

// @route   GET /api/trial/benefits
// @desc    Get trial benefits information
// @access  Public
router.get('/benefits', async (req, res) => {
  try {
    const trialBenefits = {
      duration: '1 day',
      reward: 5,
      currency: 'INR',
      description: 'Get ₹5 credit for watching your first ad',
      features: [
        '1 day trial period',
        '₹5 credit for first ad',
        'No withdrawal restrictions',
        'Experience the platform',
        'Upgrade to VIP for more earnings'
      ],
      terms: [
        'Trial valid for 24 hours from signup',
        'One-time reward only',
        'Must watch at least 1 ad to claim',
        'Upgrade to VIP for higher earnings'
      ]
    };

    res.json(trialBenefits);

  } catch (error) {
    console.error('Get trial benefits error:', error);
    res.status(500).json({ message: 'Failed to get trial benefits' });
  }
});

module.exports = router;

