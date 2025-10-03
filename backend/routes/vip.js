const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const VipPurchase = require('../models/VipPurchase');
const VipPricing = require('../models/VipPricing');
const Credit = require('../models/Credit');
const { MultiLevelReferral } = require('../models/MultiLevelReferral');
const { authenticateToken, requireVip } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @route   GET /api/vip/plans
// @desc    Get VIP plans
// @access  Public
router.get('/plans', async (req, res) => {
  try {
    const pricing = await VipPricing.getActivePricing();
    
    const plans = pricing.map(plan => ({
      level: plan.level,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      duration: plan.duration,
      dailyCreditLimitMultiplier: plan.dailyCreditLimitMultiplier,
      referralBonusMultiplier: plan.referralBonusMultiplier,
      exclusiveOffers: plan.exclusiveOffers,
      description: plan.description,
      features: plan.features,
      isActive: plan.isActive
    }));

    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Get VIP plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get VIP plans'
    });
  }
});

// @route   GET /api/vip/levels
// @desc    Get VIP levels for frontend
// @access  Public
router.get('/levels', async (req, res) => {
  try {
    const pricing = await VipPricing.getActivePricing();
    
    const levels = pricing.map(plan => ({
      level: plan.level,
      name: plan.name,
      price: plan.price,
      dailyCreditLimitMultiplier: plan.dailyCreditLimitMultiplier,
      referralBonusMultiplier: plan.referralBonusMultiplier,
      exclusiveOffers: plan.exclusiveOffers,
      description: plan.description,
      features: plan.features
    }));

    res.json({
      success: true,
      levels
    });
  } catch (error) {
    console.error('Get VIP levels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get VIP levels'
    });
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
    user.coinBalance += bonusCredits;
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
        availableCredits: user.coinBalance
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

// @route   POST /api/vip/create-order
// @desc    Create Razorpay order for VIP subscription
// @access  Private
router.post('/create-order', authenticateToken, [
  body('vipLevel').isInt({ min: 1, max: 3 }).withMessage('Invalid VIP level'),
  body('amount').isInt({ min: 1 }).withMessage('Invalid amount')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { vipLevel, amount } = req.body;
    const userId = req.user.id;

    // Get VIP level details from database
    const selectedVip = await VipPricing.getPricingByLevel(vipLevel);
    if (!selectedVip) {
      return res.status(400).json({
        success: false,
        message: 'Invalid VIP level'
      });
    }

    // Verify amount matches VIP level price
    if (amount !== selectedVip.price * 100) { // amount in paise
      return res.status(400).json({
        success: false,
        message: 'Amount mismatch'
      });
    }

    // Create Razorpay order
    const orderOptions = {
      amount: amount, // amount in paise
      currency: 'INR',
      receipt: `vip_${vipLevel}_${userId}_${Date.now()}`,
      notes: {
        userId: userId,
        vipLevel: vipLevel,
        vipName: selectedVip.name
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    res.json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// @route   POST /api/vip/verify-payment
// @desc    Verify Razorpay payment and upgrade VIP
// @access  Private
router.post('/verify-payment', authenticateToken, [
  body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
  body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Signature is required'),
  body('vipLevel').isInt({ min: 1, max: 3 }).withMessage('Invalid VIP level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      vipLevel 
    } = req.body;
    const userId = req.user.id;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    if (payment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: 'Payment not captured'
      });
    }

    // Update user VIP status
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate VIP expiry (30 days from now)
    const vipExpiry = new Date();
    vipExpiry.setDate(vipExpiry.getDate() + 30);

    // Update user
    user.vipLevel = vipLevel;
    user.isVipActive = true;
    user.vipExpiry = vipExpiry;
    user.vipPurchaseDate = new Date();
    await user.save();

    // Create VIP purchase record
    const vipPurchase = new VipPurchase({
      userId: userId,
      vipLevel: vipLevel,
      amount: payment.amount / 100, // Convert from paise to rupees
      currency: payment.currency,
      paymentMethod: 'razorpay',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: 'completed',
      purchaseDate: new Date(),
      expiryDate: vipExpiry,
      metadata: {
        razorpay_signature,
        payment_details: payment
      }
    });
    await vipPurchase.save();

    // Process referral commissions for VIP purchase
    try {
      await MultiLevelReferral.processCommissions(
        userId,
        payment.amount / 100, // Convert to rupees
        'vip_purchase',
        vipPurchase._id.toString(),
        {
          vipLevel: vipLevel,
          paymentId: razorpay_payment_id
        }
      );
    } catch (commissionError) {
      console.error('Error processing VIP purchase commissions:', commissionError);
    }

    res.json({
      success: true,
      message: `Successfully upgraded to VIP Level ${vipLevel}!`,
      user: {
        id: user._id,
        vipLevel: user.vipLevel,
        isVipActive: user.isVipActive,
        vipExpiry: user.vipExpiry
      }
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

module.exports = router;
