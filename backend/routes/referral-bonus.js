const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Credit = require('../models/Credit');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/referral-bonus/award-signup
// @desc    Award ₹10 signup bonus when referral verifies email
// @access  Private
router.post('/award-signup', authenticateToken, [
  body('referredUserId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { referredUserId } = req.body;
    const referrerId = req.user._id;

    // Find referral relationship
    const referral = await Referral.findOne({
      referrer: referrerId,
      referred: referredUserId,
      status: 'active'
    });

    if (!referral) {
      return res.status(404).json({ message: 'Active referral not found' });
    }

    // Check if referred user has verified email
    const referredUser = await User.findById(referredUserId);
    if (!referredUser.emailVerified) {
      return res.status(400).json({ 
        message: 'Referred user must verify email first' 
      });
    }

    // Check if signup bonus already awarded
    if (referral.bonusCredits > 0) {
      return res.status(400).json({ message: 'Signup bonus already awarded' });
    }

    // Award ₹10 signup bonus
    const signupBonus = 10;
    await referral.awardBonus(signupBonus, 'signup');

    // Create credit entry for referrer
    const credit = new Credit({
      userId: referrerId,
      amount: signupBonus,
      type: 'referral_bonus',
      source: 'referral_signup',
      description: 'Referral signup bonus - email verified',
      status: 'vested',
      vestingSchedule: {
        immediate: signupBonus
      },
      vestingProgress: {
        immediate: signupBonus
      },
      isVested: true,
      vestedAt: new Date(),
      relatedReferral: referral._id
    });

    await credit.save();

    // Update referrer's wallet
    const Wallet = require('../models/Wallet');
    const referrerWallet = await Wallet.getOrCreateWallet(referrerId);
    await referrerWallet.addFunds(signupBonus, 'referral_signup');

    res.json({
      message: 'Signup bonus awarded successfully',
      bonus: {
        amount: signupBonus,
        type: 'signup',
        referralId: referral._id
      },
      referrer: {
        totalCredits: referrerWallet.totalEarned,
        availableCredits: referrerWallet.balance,
        withdrawableCredits: referrerWallet.withdrawableBalance
      }
    });

  } catch (error) {
    console.error('Award signup bonus error:', error);
    res.status(500).json({ message: 'Failed to award signup bonus' });
  }
});

// @route   POST /api/referral-bonus/award-daily
// @desc    Award 10% lifetime commission from referral's daily earnings
// @access  Private
router.post('/award-daily', authenticateToken, [
  body('referredUserId').isMongoId(),
  body('dailyEarnings').isNumeric().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { referredUserId, dailyEarnings } = req.body;
    const referrerId = req.user._id;

    // Find referral relationship
    const referral = await Referral.findOne({
      referrer: referrerId,
      referred: referredUserId,
      status: 'active'
    });

    if (!referral) {
      return res.status(404).json({ message: 'Active referral not found' });
    }

    // Calculate 10% commission
    const commission = Math.floor(dailyEarnings * 0.1);
    
    if (commission <= 0) {
      return res.status(400).json({ message: 'No commission to award' });
    }

    // Award commission
    await referral.awardBonus(commission, 'daily_commission');

    // Create credit entry for referrer
    const credit = new Credit({
      userId: referrerId,
      amount: commission,
      type: 'referral_bonus',
      source: 'referral_daily',
      description: `10% commission from referral's daily earnings`,
      status: 'vested',
      vestingSchedule: {
        immediate: commission
      },
      vestingProgress: {
        immediate: commission
      },
      isVested: true,
      vestedAt: new Date(),
      relatedReferral: referral._id
    });

    await credit.save();

    // Update referrer's credits
    const referrer = await User.findById(referrerId);
    referrer.totalCredits += commission;
    referrer.availableCredits += commission;
    
    // Update withdrawable credits if eligible
    if (referrer.totalCredits >= 100) {
      referrer.withdrawableCredits = referrer.availableCredits;
    }
    
    await referrer.save();

    res.json({
      message: 'Daily commission awarded successfully',
      commission: {
        amount: commission,
        percentage: 10,
        referralDailyEarnings: dailyEarnings,
        referralId: referral._id
      },
      referrer: {
        totalCredits: referrer.totalCredits,
        availableCredits: referrer.availableCredits,
        withdrawableCredits: referrer.withdrawableCredits
      }
    });

  } catch (error) {
    console.error('Award daily commission error:', error);
    res.status(500).json({ message: 'Failed to award daily commission' });
  }
});

// @route   GET /api/referral-bonus/commission-structure
// @desc    Get referral commission structure
// @access  Public
router.get('/commission-structure', async (req, res) => {
  try {
    const commissionStructure = {
      signupBonus: {
        amount: 10,
        currency: 'INR',
        description: 'One-time bonus when referral watches first ad',
        requirements: ['referral_watches_first_ad']
      },
      dailyCommission: {
        percentage: 10,
        description: 'Lifetime 10% commission from referral daily earnings',
        example: 'If referral earns ₹100/day, you earn ₹10/day',
        requirements: ['active_referral', 'referral_daily_earnings']
      },
      totalPotential: {
        description: 'Unlimited earning potential through referrals',
        example: '10 VIP referrals = ₹100/day passive income'
      }
    };

    res.json(commissionStructure);

  } catch (error) {
    console.error('Get commission structure error:', error);
    res.status(500).json({ message: 'Failed to get commission structure' });
  }
});

module.exports = router;
