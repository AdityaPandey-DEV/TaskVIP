const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const VipPurchase = require('../models/VipPurchase');
const Credit = require('../models/Credit');
const { MultiLevelReferral } = require('../models/MultiLevelReferral');
const { authenticateToken, requireVip } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/vip/plans
// @desc    Get VIP plans
// @access  Public
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        level: 1,
        name: 'VIP 1',
        price: 300,
        currency: 'INR',
        duration: 30,
        benefits: {
          dailyAdsLimit: 20,
          perAdReward: 1.5,
          maxDailyEarning: 30,
          referralBonus: 10,
          monthlyEarning: 900,
          features: [
            '20 ads per day',
            '₹1.5 per ad reward',
            '₹30 daily earning cap',
            '₹10 referral bonus',
            'Priority support',
            'Exclusive tasks'
          ]
        }
      },
      {
        level: 2,
        name: 'VIP 2',
        price: 600,
        currency: 'INR',
        duration: 30,
        benefits: {
          dailyAdsLimit: 50,
          perAdReward: 2.0,
          maxDailyEarning: 100,
          referralBonus: 10,
          monthlyEarning: 3000,
          features: [
            '50 ads per day',
            '₹2.0 per ad reward',
            '₹100 daily earning cap',
            '₹10 referral bonus',
            'Priority support',
            'Exclusive tasks',
            'Higher reward rates'
          ]
        }
      },
      {
        level: 3,
        name: 'VIP 3',
        price: 1000,
        currency: 'INR',
        duration: 30,
        benefits: {
          dailyAdsLimit: 100,
          perAdReward: 2.5,
          maxDailyEarning: 250,
          referralBonus: 10,
          monthlyEarning: 7500,
          features: [
            '100 ads per day',
            '₹2.5 per ad reward',
            '₹250 daily earning cap',
            '₹10 referral bonus',
            'Priority support',
            'Exclusive tasks',
            'Highest reward rates',
            'Milestone bonuses',
            'VIP-only offers'
          ]
        }
      }
    ];

    res.json({ plans });

  } catch (error) {
    console.error('Get VIP plans error:', error);
    res.status(500).json({ message: 'Failed to get VIP plans' });
  }
});

// @route   POST /api/vip/purchase
// @desc    Purchase VIP membership
// @access  Private
router.post('/purchase', authenticateToken, [
  body('vipLevel').isInt({ min: 1, max: 3 }),
  body('paymentMethod').isIn(['razorpay', 'paypal', 'stripe']),
  body('paymentId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { vipLevel, paymentMethod, paymentId } = req.body;
    const userId = req.user._id;

    // Check if user already has active VIP
    const activeVip = await VipPurchase.getActiveVip(userId);
    if (activeVip) {
      return res.status(400).json({ 
        message: 'You already have an active VIP membership',
        currentVip: {
          level: activeVip.vipLevel,
          expiry: activeVip.endDate
        }
      });
    }

    // Create VIP purchase
    const vipPurchase = await VipPurchase.createVipPurchase(
      userId,
      vipLevel,
      paymentMethod,
      paymentId
    );

    // TODO: Integrate with payment gateway for verification
    // For now, mark as completed
    await vipPurchase.markCompleted({
      razorpayOrderId: paymentId,
      razorpayPaymentId: paymentId,
      razorpaySignature: 'mock_signature'
    });

    // Update user VIP level
    const user = await User.findById(userId);
    user.vipLevel = vipLevel;
    user.vipExpiry = vipPurchase.endDate;
    await user.save();

    // Award VIP purchase bonus credits
    const bonusCredits = vipLevel * 50; // 50, 100, 150 credits for VIP 1, 2, 3
    const credit = new Credit({
      userId,
      amount: bonusCredits,
      type: 'vip_purchase',
      source: 'vip_upgrade',
      description: `VIP ${vipLevel} purchase bonus`,
      status: 'vested',
      vestingSchedule: {
        immediate: bonusCredits
      },
      vestingProgress: {
        immediate: bonusCredits
      },
      isVested: true,
      vestedAt: new Date()
    });

    await credit.save();

    // Update user credits
    user.totalCredits += bonusCredits;
    user.availableCredits += bonusCredits;
    await user.save();

    // Process multi-level referral commissions
    try {
      const vipPlans = [
        { level: 1, price: 300 },
        { level: 2, price: 600 },
        { level: 3, price: 1000 }
      ];
      
      const plan = vipPlans.find(p => p.level === vipLevel);
      if (plan) {
        await MultiLevelReferral.processCommissions(
          userId,
          plan.price,
          'vip_purchase',
          vipPurchase._id.toString(),
          {
            vipLevel,
            planPrice: plan.price,
            paymentMethod
          }
        );
      }
    } catch (commissionError) {
      console.error('Error processing referral commissions:', commissionError);
      // Don't fail the VIP purchase if commission processing fails
    }

    res.json({
      message: 'VIP membership purchased successfully',
      vipPurchase: {
        id: vipPurchase._id,
        level: vipPurchase.vipLevel,
        amount: vipPurchase.amount,
        startDate: vipPurchase.startDate,
        endDate: vipPurchase.endDate,
        daysRemaining: vipPurchase.daysRemaining
      },
      bonusCredits,
      user: {
        vipLevel: user.vipLevel,
        vipExpiry: user.vipExpiry,
        totalCredits: user.totalCredits,
        availableCredits: user.availableCredits
      }
    });

  } catch (error) {
    console.error('VIP purchase error:', error);
    res.status(500).json({ message: 'VIP purchase failed' });
  }
});

// @route   GET /api/vip/status
// @desc    Get user's VIP status
// @access  Private
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const activeVip = await VipPurchase.getActiveVip(req.user._id);
    
    const vipBenefits = user.getVipBenefits();
    const isVipActive = user.isVipActive();
    
    res.json({
      vipLevel: user.vipLevel,
      vipExpiry: user.vipExpiry,
      isVipActive,
      daysRemaining: activeVip ? activeVip.daysRemaining : 0,
      benefits: vipBenefits,
      dailyLimit: user.getDailyCreditLimit(),
      dailyCreditsEarned: user.dailyCreditsEarned,
      hasReachedDailyLimit: user.hasReachedDailyLimit()
    });

  } catch (error) {
    console.error('Get VIP status error:', error);
    res.status(500).json({ message: 'Failed to get VIP status' });
  }
});

// @route   GET /api/vip/history
// @desc    Get user's VIP purchase history
// @access  Private
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const vipPurchases = await VipPurchase.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await VipPurchase.countDocuments({ userId: req.user._id });

    res.json({
      vipPurchases,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get VIP history error:', error);
    res.status(500).json({ message: 'Failed to get VIP history' });
  }
});

// @route   POST /api/vip/extend
// @desc    Extend VIP membership
// @access  Private
router.post('/extend', authenticateToken, [
  body('vipLevel').isInt({ min: 1, max: 3 }),
  body('paymentMethod').isIn(['razorpay', 'paypal', 'stripe']),
  body('paymentId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { vipLevel, paymentMethod, paymentId } = req.body;
    const userId = req.user._id;

    // Check if user has active VIP
    const activeVip = await VipPurchase.getActiveVip(userId);
    if (!activeVip) {
      return res.status(400).json({ 
        message: 'No active VIP membership found' 
      });
    }

    // Create new VIP purchase
    const vipPurchase = await VipPurchase.createVipPurchase(
      userId,
      vipLevel,
      paymentMethod,
      paymentId
    );

    // Mark as completed
    await vipPurchase.markCompleted({
      razorpayOrderId: paymentId,
      razorpayPaymentId: paymentId,
      razorpaySignature: 'mock_signature'
    });

    // Extend existing VIP
    await activeVip.extendVip(30); // Extend by 30 days

    // Update user VIP level if upgrading
    if (vipLevel > activeVip.vipLevel) {
      const user = await User.findById(userId);
      user.vipLevel = vipLevel;
      user.vipExpiry = vipPurchase.endDate;
      await user.save();
    }

    res.json({
      message: 'VIP membership extended successfully',
      vipPurchase: {
        id: vipPurchase._id,
        level: vipPurchase.vipLevel,
        amount: vipPurchase.amount,
        startDate: vipPurchase.startDate,
        endDate: vipPurchase.endDate,
        daysRemaining: vipPurchase.daysRemaining
      }
    });

  } catch (error) {
    console.error('VIP extend error:', error);
    res.status(500).json({ message: 'VIP extension failed' });
  }
});

// @route   GET /api/vip/benefits
// @desc    Get VIP benefits for current user
// @access  Private
router.get('/benefits', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const vipBenefits = user.getVipBenefits();
    const isVipActive = user.isVipActive();
    
    // Get referral statistics
    const Referral = require('../models/Referral');
    const referralStats = await Referral.getReferrerEarnings(req.user._id);
    
    res.json({
      currentLevel: user.vipLevel,
      isActive: isVipActive,
      benefits: vipBenefits,
      dailyLimit: user.getDailyCreditLimit(),
      dailyCreditsEarned: user.dailyCreditsEarned,
      hasReachedDailyLimit: user.hasReachedDailyLimit(),
      referralStats: {
        totalReferrals: referralStats.totalReferrals,
        totalEarnings: referralStats.totalEarnings,
        activeReferrals: referralStats.activeReferrals
      }
    });

  } catch (error) {
    console.error('Get VIP benefits error:', error);
    res.status(500).json({ message: 'Failed to get VIP benefits' });
  }
});

// @route   POST /api/vip/cancel
// @desc    Cancel VIP auto-renewal
// @access  Private
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const activeVip = await VipPurchase.getActiveVip(req.user._id);
    if (!activeVip) {
      return res.status(400).json({ 
        message: 'No active VIP membership found' 
      });
    }

    activeVip.autoRenew = false;
    await activeVip.save();

    res.json({ message: 'VIP auto-renewal cancelled successfully' });

  } catch (error) {
    console.error('Cancel VIP error:', error);
    res.status(500).json({ message: 'Failed to cancel VIP' });
  }
});

module.exports = router;
