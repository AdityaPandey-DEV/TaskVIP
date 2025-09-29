const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Credit = require('../models/Credit');
const EmailVerification = require('../models/EmailVerification');
const paymentService = require('../utils/paymentService');
const emailService = require('../utils/emailService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/withdrawals/request
// @desc    Request withdrawal
// @access  Private
router.post('/request', authenticateToken, [
  body('amount').isNumeric().isFloat({ min: 100 }),
  body('paymentMethod').isIn(['razorpay', 'paypal', 'stripe']),
  body('accountDetails').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { amount, paymentMethod, accountDetails } = req.body;
    const userId = req.user._id;

    // Check if user has verified email
    if (!req.user.emailVerified) {
      return res.status(400).json({ 
        message: 'Email verification required for withdrawal',
        requiresEmailVerification: true
      });
    }

    // Check if user has verified KYC
    if (req.user.kycStatus !== 'verified') {
      return res.status(400).json({ 
        message: 'KYC verification required for withdrawal',
        requiresKycVerification: true
      });
    }

    // Get or create wallet
    const wallet = await Wallet.getOrCreateWallet(userId);
    
    // Check if user can withdraw
    if (!wallet.canWithdraw(amount)) {
      return res.status(400).json({ 
        message: 'Insufficient balance or KYC not verified',
        availableBalance: wallet.getAvailableBalance(),
        kycVerified: req.user.kycStatus === 'verified'
      });
    }

    // Validate account details
    const validation = paymentService.validateAccountDetails(paymentMethod, accountDetails);
    if (!validation.valid) {
      return res.status(400).json({ 
        message: 'Invalid account details',
        missing: validation.missing || validation.error
      });
    }

    // Process payment
    const paymentResult = await paymentService.processWithdrawal(
      userId,
      amount,
      paymentMethod,
      accountDetails
    );

    if (!paymentResult.success) {
      return res.status(400).json({ 
        message: 'Payment processing failed',
        error: paymentResult.error
      });
    }

    // Deduct from wallet
    await wallet.deductFunds(amount, 'withdrawal');

    // Create credit entry for withdrawal
    const credit = new Credit({
      userId,
      amount: -amount,
      type: 'withdrawal',
      source: 'withdrawal',
      description: `Withdrawal via ${paymentMethod}`,
      status: 'completed',
      vestingSchedule: { immediate: -amount },
      vestingProgress: { immediate: -amount },
      isVested: true,
      vestedAt: new Date(),
      metadata: {
        paymentMethod,
        payoutId: paymentResult.payoutId,
        transactionId: paymentResult.referenceId || paymentResult.payoutId
      }
    });

    await credit.save();

    // Send payment notification email
    await emailService.sendPaymentNotification(
      req.user.email,
      req.user.firstName,
      amount,
      paymentResult.payoutId
    );

    res.json({
      message: 'Withdrawal processed successfully',
      withdrawal: {
        amount,
        paymentMethod,
        payoutId: paymentResult.payoutId,
        status: paymentResult.status,
        processedAt: new Date()
      },
      wallet: wallet.getAvailableBalance()
    });

  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ message: 'Withdrawal request failed' });
  }
});

// @route   GET /api/withdrawals/methods
// @desc    Get available payment methods
// @access  Private
router.get('/methods', authenticateToken, async (req, res) => {
  try {
    const countryCode = req.user.country || 'IN';
    const methods = paymentService.getPaymentMethods(countryCode);

    res.json({
      methods,
      userCountry: countryCode,
      minWithdrawal: 100,
      currency: 'INR'
    });

  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ message: 'Failed to get payment methods' });
  }
});

// @route   GET /api/withdrawals/history
// @desc    Get withdrawal history
// @access  Private
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    const withdrawals = await Credit.find({
      userId,
      type: 'withdrawal'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Credit.countDocuments({
      userId,
      type: 'withdrawal'
    });

    res.json({
      withdrawals: withdrawals.map(withdrawal => ({
        id: withdrawal._id,
        amount: Math.abs(withdrawal.amount),
        paymentMethod: withdrawal.metadata?.paymentMethod,
        payoutId: withdrawal.metadata?.payoutId,
        status: withdrawal.status,
        processedAt: withdrawal.vestedAt,
        createdAt: withdrawal.createdAt
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get withdrawal history error:', error);
    res.status(500).json({ message: 'Failed to get withdrawal history' });
  }
});

// @route   GET /api/withdrawals/status
// @desc    Get withdrawal status and requirements
// @access  Private
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const wallet = await Wallet.getOrCreateWallet(userId);
    
    const status = {
      canWithdraw: wallet.canWithdraw(100),
      requirements: {
        emailVerified: req.user.emailVerified || false,
        kycVerified: req.user.kycStatus === 'verified',
        minBalance: wallet.balance >= 100
      },
      wallet: wallet.getAvailableBalance(),
      user: {
        emailVerified: req.user.emailVerified,
        kycStatus: req.user.kycStatus,
        userType: req.user.userType
      }
    };

    res.json(status);

  } catch (error) {
    console.error('Get withdrawal status error:', error);
    res.status(500).json({ message: 'Failed to get withdrawal status' });
  }
});

// @route   POST /api/withdrawals/verify-kyc
// @desc    Send KYC verification email
// @access  Private
router.post('/verify-kyc', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if already verified
    if (req.user.kycStatus === 'verified') {
      return res.status(400).json({ 
        message: 'KYC already verified' 
      });
    }

    // Check if user has pending verification
    const existingVerification = await EmailVerification.getPendingVerifications(userId, 'withdrawal');
    if (existingVerification.length > 0) {
      return res.status(400).json({ 
        message: 'KYC verification email already sent. Please check your email.' 
      });
    }

    // Create verification
    const verification = await EmailVerification.createVerification(
      userId,
      req.user.email,
      'withdrawal',
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(
      req.user.email,
      req.user.firstName,
      'withdrawal'
    );

    if (!emailResult.success) {
      await EmailVerification.findByIdAndDelete(verification._id);
      return res.status(500).json({ 
        message: 'Failed to send KYC verification email',
        error: emailResult.error
      });
    }

    res.json({
      message: 'KYC verification email sent successfully',
      expiresAt: verification.expiresAt
    });

  } catch (error) {
    console.error('KYC verification error:', error);
    res.status(500).json({ message: 'KYC verification failed' });
  }
});

module.exports = router;
