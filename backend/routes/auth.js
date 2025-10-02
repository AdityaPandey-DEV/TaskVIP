const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Referral = require('../models/Referral');
const { authenticateToken, rateLimitSensitive } = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('referralCode').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, referralCode } = req.body;

    // Use default referral code "0000" if none provided
    const finalReferralCode = referralCode || '0000';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email' 
      });
    }

    // Validate referral code (now always present)
    const isValidReferral = await Referral.isValidReferral(finalReferralCode, null);
    if (!isValidReferral) {
      return res.status(400).json({ 
        message: 'Invalid referral code' 
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      deviceInfo: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        deviceId: req.headers['x-device-id'] || 'unknown'
      }
    });

    await user.save();

    // Create referral (always present now with default "0000")
    try {
      await Referral.createReferral(finalReferralCode, user._id);
    } catch (error) {
      console.error('Error creating referral:', error);
      // Don't fail registration if referral creation fails
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        referralCode: user.referralCode,
        vipLevel: user.vipLevel,
        totalCredits: user.totalCredits,
        availableCredits: user.availableCredits
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(401).json({ 
        message: 'Account locked due to multiple failed login attempts. Please try again later.' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        referralCode: user.referralCode,
        vipLevel: user.vipLevel,
        totalCredits: user.totalCredits,
        availableCredits: user.availableCredits,
        isVipActive: user.isVipActive(),
        vipExpiry: user.vipExpiry,
        kycStatus: user.kycStatus
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    // Get referral statistics
    const referralStats = await Referral.getReferrerEarnings(req.user._id);
    
    // Get VIP benefits
    const vipBenefits = user.getVipBenefits();
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        referralCode: user.referralCode,
        vipLevel: user.vipLevel,
        vipExpiry: user.vipExpiry,
        isVipActive: user.isVipActive(),
        vipBenefits,
        totalCredits: user.totalCredits,
        availableCredits: user.availableCredits,
        dailyCreditsEarned: user.dailyCreditsEarned,
        dailyCreditLimit: user.getDailyCreditLimit(),
        hasReachedDailyLimit: user.hasReachedDailyLimit(),
        kycStatus: user.kycStatus,
        streak: user.streak,
        badges: user.badges,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      referralStats
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user data' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 2 }),
  body('lastName').optional().trim().isLength({ min: 2 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName } = req.body;
    const user = await User.findById(req.user._id);

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        referralCode: user.referralCode
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Profile update failed' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, rateLimitSensitive(), [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Password change failed' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', rateLimitSensitive(), [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // TODO: Send email with reset link
    // For now, just return success
    res.json({ 
      message: 'If the email exists, a reset link has been sent',
      resetToken // Remove this in production
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Password reset failed' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', rateLimitSensitive(), [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Password reset failed' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

// @route   POST /api/auth/google
// @desc    Google OAuth authentication
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    // Check if Google Client ID is configured
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('GOOGLE_CLIENT_ID environment variable is not set');
      return res.status(500).json({ 
        message: 'Google authentication is not configured on the server' 
      });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({ message: 'Google email not verified' });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // User exists, log them in
      const token = generateToken(user._id);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          referralCode: user.referralCode,
          vipLevel: user.vipLevel,
          vipExpiry: user.vipExpiry,
          isVipActive: user.isVipActive(),
          totalCredits: user.totalCredits,
          availableCredits: user.availableCredits,
          kycStatus: user.kycStatus,
          streak: user.streak,
          badges: user.badges,
          createdAt: user.createdAt
        }
      });
    } else {
      // For new Google users, we need to collect referral code
      // Return a special response indicating referral code collection is needed
      res.json({
        needsReferralCode: true,
        googleUserData: {
          email: email.toLowerCase(),
          firstName: given_name || 'User',
          lastName: family_name || '',
          picture,
          email_verified
        },
        message: 'Please provide a referral code to complete registration'
      });
    }

  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
});

// @route   POST /api/auth/google/complete
// @desc    Complete Google OAuth registration with referral code
// @access  Public
router.post('/google/complete', [
  body('googleUserData').isObject(),
  body('referralCode').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { googleUserData, referralCode } = req.body;
    const { email, firstName, lastName, picture } = googleUserData;

    // Use default referral code "0000" if none provided
    const finalReferralCode = referralCode || '0000';

    console.log(`Google OAuth: Validating referral code: ${finalReferralCode}`);

    // Ensure default user exists before validation
    if (finalReferralCode === '0000') {
      const User = require('../models/User');
      await User.ensureDefaultReferralUser();
      console.log('Default referral user ensured for Google OAuth');
    }

    // Validate referral code (pass null for referredUserId since user doesn't exist yet)
    const isValidReferral = await Referral.isValidReferral(finalReferralCode, null);
    console.log(`Referral code ${finalReferralCode} validation result: ${isValidReferral}`);
    
    if (!isValidReferral) {
      console.error(`Invalid referral code: ${finalReferralCode}`);
      return res.status(400).json({ 
        message: `Invalid referral code: ${finalReferralCode}. Please check the code and try again.` 
      });
    }

    // Check if user already exists (double-check)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email' 
      });
    }

    // Create new user with Google data
    const newUser = new User({
      email: email.toLowerCase(),
      firstName,
      lastName,
      password: 'google-oauth', // Placeholder password for Google users
      isEmailVerified: true, // Google emails are pre-verified
      profilePicture: picture,
      deviceInfo: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        deviceId: req.headers['x-device-id'] || 'google-oauth'
      }
    });

    await newUser.save();

    // Create referral
    try {
      await Referral.createReferral(finalReferralCode, newUser._id);
    } catch (error) {
      console.error('Error creating referral for Google user:', error);
      // Don't fail registration if referral creation fails
    }

    // Generate token
    const token = generateToken(newUser._id);

    res.json({
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        referralCode: newUser.referralCode,
        vipLevel: newUser.vipLevel,
        vipExpiry: newUser.vipExpiry,
        isVipActive: newUser.isVipActive(),
        totalCredits: newUser.totalCredits,
        availableCredits: newUser.availableCredits,
        kycStatus: newUser.kycStatus,
        streak: newUser.streak,
        badges: newUser.badges,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error('Google complete registration error:', error);
    res.status(500).json({ message: 'Failed to complete Google registration' });
  }
});

module.exports = router;
