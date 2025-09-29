const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');
const emailService = require('../utils/emailService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/email-verification/send
// @desc    Send email verification link
// @access  Private
router.post('/send', authenticateToken, [
  body('type').isIn(['signup', 'withdrawal', 'referral']),
  body('email').optional().isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { type, email } = req.body;
    const userId = req.user._id;
    const userEmail = email || req.user.email;

    // Check if user already has a pending verification
    const existingVerification = await EmailVerification.getPendingVerifications(userId, type);
    if (existingVerification.length > 0) {
      return res.status(400).json({ 
        message: 'Verification email already sent. Please check your email.' 
      });
    }

    // Create verification record
    const verification = await EmailVerification.createVerification(
      userId,
      userEmail,
      type,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(
      userEmail,
      req.user.firstName,
      type
    );

    if (!emailResult.success) {
      await EmailVerification.findByIdAndDelete(verification._id);
      return res.status(500).json({ 
        message: 'Failed to send verification email',
        error: emailResult.error
      });
    }

    res.json({
      message: 'Verification email sent successfully',
      email: userEmail,
      expiresAt: verification.expiresAt
    });

  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(500).json({ message: 'Failed to send verification email' });
  }
});

// @route   POST /api/email-verification/verify
// @desc    Verify email with token
// @access  Public
router.post('/verify', [
  body('token').notEmpty(),
  body('type').isIn(['signup', 'withdrawal', 'referral'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token, type } = req.body;

    // Verify token
    const result = await EmailVerification.verifyToken(token, type);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: result.message 
      });
    }

    const verification = result.verification;
    const user = await User.findById(verification.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user based on verification type
    switch (type) {
      case 'signup':
        user.emailVerified = true;
        user.emailVerifiedAt = new Date();
        break;
      case 'withdrawal':
        user.kycStatus = 'verified';
        user.kycVerifiedAt = new Date();
        break;
      case 'referral':
        // Handle referral verification
        if (verification.metadata.referrerId) {
          // Award referral bonus
          const referrer = await User.findById(verification.metadata.referrerId);
          if (referrer) {
            // Award ₹10 signup bonus to referrer
            const Wallet = require('../models/Wallet');
            const referrerWallet = await Wallet.getOrCreateWallet(referrer._id);
            await referrerWallet.addFunds(10, 'referral_signup');
          }
        }
        break;
    }

    await user.save();

    res.json({
      message: 'Email verified successfully',
      type: verification.type,
      verifiedAt: verification.verifiedAt
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Email verification failed' });
  }
});

// @route   GET /api/email-verification/status
// @desc    Get user's email verification status
// @access  Private
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    const status = {
      emailVerified: user.emailVerified || false,
      kycVerified: user.kycStatus === 'verified',
      canWithdraw: user.kycStatus === 'verified' && user.withdrawableCredits >= 100,
      pendingVerifications: []
    };

    // Get pending verifications
    const pendingVerifications = await EmailVerification.find({
      userId,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).select('type expiresAt createdAt');

    status.pendingVerifications = pendingVerifications.map(v => ({
      type: v.type,
      expiresAt: v.expiresAt,
      createdAt: v.createdAt
    }));

    res.json(status);

  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ message: 'Failed to get verification status' });
  }
});

// @route   POST /api/email-verification/resend
// @desc    Resend verification email
// @access  Private
router.post('/resend', authenticateToken, [
  body('type').isIn(['signup', 'withdrawal', 'referral'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { type } = req.body;
    const userId = req.user._id;

    // Check if user already verified
    if (type === 'signup' && req.user.emailVerified) {
      return res.status(400).json({ 
        message: 'Email already verified' 
      });
    }

    if (type === 'withdrawal' && req.user.kycStatus === 'verified') {
      return res.status(400).json({ 
        message: 'KYC already verified' 
      });
    }

    // Expire existing verifications
    await EmailVerification.updateMany(
      { userId, type, status: 'pending' },
      { status: 'expired' }
    );

    // Create new verification
    const verification = await EmailVerification.createVerification(
      userId,
      req.user.email,
      type,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(
      req.user.email,
      req.user.firstName,
      type
    );

    if (!emailResult.success) {
      await EmailVerification.findByIdAndDelete(verification._id);
      return res.status(500).json({ 
        message: 'Failed to send verification email',
        error: emailResult.error
      });
    }

    res.json({
      message: 'Verification email sent successfully',
      expiresAt: verification.expiresAt
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Failed to resend verification email' });
  }
});

module.exports = router;

