const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Credit = require('../models/Credit');
const User = require('../models/User');
const { authenticateToken, requireKyc } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/credits/balance
// @desc    Get user's credit balance
// @access  Private
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Get available credits from database
    const availableCredits = await Credit.getUserAvailableCredits(userId);
    const totalCredits = await Credit.getUserTotalCredits(userId);

    // Get pending credits (not yet vested)
    const pendingCredits = await Credit.find({
      userId,
      status: 'pending',
      isVested: false
    });

    const totalPending = pendingCredits.reduce((sum, credit) => {
      return sum + (credit.amount - credit.totalVested);
    }, 0);

    res.json({
      availableCredits,
      totalCredits,
      pendingCredits: totalPending,
      user: {
        totalCredits: user.totalCredits,
        availableCredits: user.coinBalance,
        dailyCreditsEarned: user.dailyCreditsEarned,
        dailyCreditLimit: user.getDailyCreditLimit()
      }
    });

  } catch (error) {
    console.error('Get credit balance error:', error);
    res.status(500).json({ message: 'Failed to get credit balance' });
  }
});

// @route   GET /api/credits/history
// @desc    Get user's credit history
// @access  Private
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    const query = { userId };
    if (type) query.type = type;
    if (status) query.status = status;

    const credits = await Credit.find(query)
      .populate('relatedTask', 'title type')
      .populate('relatedReferral', 'referred')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Credit.countDocuments(query);

    res.json({
      credits: credits.map(credit => ({
        id: credit._id,
        amount: credit.amount,
        type: credit.type,
        source: credit.source,
        description: credit.description,
        status: credit.status,
        isVested: credit.isVested,
        totalVested: credit.totalVested,
        remainingVesting: credit.remainingVesting,
        availableAmount: credit.getAvailableAmount(),
        vestingSchedule: credit.vestingSchedule,
        vestingProgress: credit.vestingProgress,
        relatedTask: credit.relatedTask ? {
          id: credit.relatedTask._id,
          title: credit.relatedTask.title,
          type: credit.relatedTask.type
        } : null,
        relatedReferral: credit.relatedReferral ? {
          id: credit.relatedReferral._id,
          referred: credit.relatedReferral.referred
        } : null,
        createdAt: credit.createdAt,
        vestedAt: credit.vestedAt
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get credit history error:', error);
    res.status(500).json({ message: 'Failed to get credit history' });
  }
});

// @route   GET /api/credits/vesting
// @desc    Get user's vesting schedule
// @access  Private
router.get('/vesting', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all pending credits
    const pendingCredits = await Credit.find({
      userId,
      status: 'pending',
      isVested: false
    }).sort({ createdAt: -1 });

    // Process vesting for all pending credits
    const vestingUpdates = [];
    for (const credit of pendingCredits) {
      const vestedAmount = credit.processVesting();
      if (vestedAmount > 0) {
        vestingUpdates.push({
          creditId: credit._id,
          amount: vestedAmount,
          description: credit.description
        });
        await credit.save();
      }
    }

    // Update user's available credits if any vested
    if (vestingUpdates.length > 0) {
      const totalVested = vestingUpdates.reduce((sum, update) => sum + update.amount, 0);
      const user = await User.findById(userId);
      user.totalCredits += totalVested;
      user.coinBalance += totalVested;
      await user.save();
    }

    // Get updated vesting schedule
    const vestingSchedule = pendingCredits.map(credit => ({
      id: credit._id,
      description: credit.description,
      totalAmount: credit.amount,
      vestedAmount: credit.totalVested,
      remainingAmount: credit.remainingVesting,
      vestingSchedule: credit.vestingSchedule,
      vestingProgress: credit.vestingProgress,
      createdAt: credit.createdAt,
      estimatedVestingDate: new Date(credit.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)
    }));

    res.json({
      vestingUpdates,
      vestingSchedule,
      totalPending: pendingCredits.reduce((sum, credit) => sum + credit.remainingVesting, 0)
    });

  } catch (error) {
    console.error('Get vesting schedule error:', error);
    res.status(500).json({ message: 'Failed to get vesting schedule' });
  }
});

// @route   POST /api/credits/redeem
// @desc    Redeem credits for cash or services
// @access  Private
router.post('/redeem', authenticateToken, requireKyc, [
  body('amount').isNumeric().isFloat({ min: 100 }), // Minimum 100 credits
  body('redemptionType').isIn(['cash', 'voucher', 'gift_card']),
  body('redemptionDetails').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { amount, redemptionType, redemptionDetails } = req.body;
    const userId = req.user._id;

    // Check if user has enough withdrawable credits
    const user = await User.findById(userId);
    if (user.withdrawableCredits < amount) {
      return res.status(400).json({ 
        message: 'Insufficient withdrawable credits',
        available: user.withdrawableCredits,
        requested: amount
      });
    }

    // Check minimum redemption amount
    if (amount < 100) {
      return res.status(400).json({ 
        message: 'Minimum redemption amount is ₹100' 
      });
    }

    // Check KYC status for withdrawal
    if (user.kycStatus !== 'verified') {
      return res.status(400).json({ 
        message: 'KYC verification required for withdrawal',
        kycStatus: user.kycStatus
      });
    }

    // Calculate redemption value (1 credit = 1 INR)
    const redemptionValue = amount;
    const processingFee = Math.ceil(redemptionValue * 0.05); // 5% processing fee
    const netAmount = redemptionValue - processingFee;

    // Create redemption record
    const redemption = {
      userId,
      amount,
      redemptionType,
      redemptionValue,
      processingFee,
      netAmount,
      status: 'pending',
      redemptionDetails,
      requestedAt: new Date()
    };

    // TODO: Process redemption based on type
    // For now, mark as completed
    redemption.status = 'completed';
    redemption.processedAt = new Date();

    // Deduct credits from user
    user.coinBalance -= amount;
    user.totalCredits -= amount; // This might need adjustment based on business logic
    await user.save();

    // Create credit deduction entry
    const deduction = new Credit({
      userId,
      amount: -amount,
      type: 'redemption',
      source: 'redemption',
      description: `Credits redeemed for ${redemptionType}`,
      status: 'completed',
      vestingSchedule: {
        immediate: -amount
      },
      vestingProgress: {
        immediate: -amount
      },
      isVested: true,
      vestedAt: new Date()
    });

    await deduction.save();

    res.json({
      message: 'Credits redeemed successfully',
      redemption: {
        amount,
        redemptionType,
        redemptionValue,
        processingFee,
        netAmount,
        status: redemption.status
      },
      user: {
        totalCredits: user.totalCredits,
        availableCredits: user.coinBalance
      }
    });

  } catch (error) {
    console.error('Redeem credits error:', error);
    res.status(500).json({ message: 'Credits redemption failed' });
  }
});

// @route   GET /api/credits/redemption-options
// @desc    Get available redemption options
// @access  Private
router.get('/redemption-options', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const availableCredits = await Credit.getUserAvailableCredits(userId);

    const redemptionOptions = [
      {
        type: 'cash',
        name: 'Cash Transfer',
        description: 'Transfer to bank account',
        minAmount: 100,
        maxAmount: 10000,
        processingFee: 0.05, // 5%
        processingTime: '1-3 business days',
        requirements: ['kyc_verified', 'bank_account']
      },
      {
        type: 'voucher',
        name: 'Gift Vouchers',
        description: 'Amazon, Flipkart, and other gift vouchers',
        minAmount: 50,
        maxAmount: 5000,
        processingFee: 0.02, // 2%
        processingTime: 'Instant',
        requirements: ['kyc_verified']
      },
      {
        type: 'gift_card',
        name: 'Gift Cards',
        description: 'Mobile recharge, DTH, and other gift cards',
        minAmount: 25,
        maxAmount: 2000,
        processingFee: 0.01, // 1%
        processingTime: 'Instant',
        requirements: ['kyc_verified']
      }
    ];

    res.json({
      availableCredits,
      redemptionOptions
    });

  } catch (error) {
    console.error('Get redemption options error:', error);
    res.status(500).json({ message: 'Failed to get redemption options' });
  }
});

// @route   GET /api/credits/statistics
// @desc    Get credit statistics
// @access  Private
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get credit statistics
    const stats = await Credit.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Get daily earnings
    const dailyEarnings = await Credit.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: { $in: ['task_completion', 'referral_bonus', 'milestone_reward'] },
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
          totalEarnings: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      period: { start, end },
      stats,
      dailyEarnings
    });

  } catch (error) {
    console.error('Get credit statistics error:', error);
    res.status(500).json({ message: 'Failed to get credit statistics' });
  }
});

// @route   POST /api/credits/transfer
// @desc    Transfer credits to another user (if enabled)
// @access  Private
router.post('/transfer', authenticateToken, [
  body('recipientEmail').isEmail(),
  body('amount').isNumeric().isFloat({ min: 10 }),
  body('message').optional().trim().isLength({ max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { recipientEmail, amount, message } = req.body;
    const senderId = req.user._id;

    // Check if recipient exists
    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Check if trying to transfer to self
    if (recipient._id.toString() === senderId.toString()) {
      return res.status(400).json({ message: 'Cannot transfer to yourself' });
    }

    // Check if sender has enough credits
    const sender = await User.findById(senderId);
    if (sender.coinBalance < amount) {
      return res.status(400).json({
        message: 'Insufficient credits',
        available: sender.coinBalance,
        requested: amount
      });
    }

    // Check minimum transfer amount
    if (amount < 10) {
      return res.status(400).json({ 
        message: 'Minimum transfer amount is 10 credits' 
      });
    }

    // Calculate transfer fee (2%)
    const transferFee = Math.ceil(amount * 0.02);
    const netAmount = amount - transferFee;

    // Deduct credits from sender
    sender.coinBalance -= amount;
    sender.totalCredits -= amount;
    await sender.save();

    // Add credits to recipient
    const recipientUser = await User.findById(recipient._id);
    recipientUser.coinBalance += netAmount;
    recipientUser.totalCredits += netAmount;
    await recipientUser.save();

    // Create transfer records
    const senderCredit = new Credit({
      userId: senderId,
      amount: -amount,
      type: 'transfer_out',
      source: 'transfer',
      description: `Transfer to ${recipientEmail}${message ? `: ${message}` : ''}`,
      status: 'completed',
      vestingSchedule: { immediate: -amount },
      vestingProgress: { immediate: -amount },
      isVested: true,
      vestedAt: new Date()
    });

    const recipientCredit = new Credit({
      userId: recipient._id,
      amount: netAmount,
      type: 'transfer_in',
      source: 'transfer',
      description: `Transfer from ${sender.email}${message ? `: ${message}` : ''}`,
      status: 'vested',
      vestingSchedule: { immediate: netAmount },
      vestingProgress: { immediate: netAmount },
      isVested: true,
      vestedAt: new Date()
    });

    await senderCredit.save();
    await recipientCredit.save();

    res.json({
      message: 'Credits transferred successfully',
      transfer: {
        amount,
        transferFee,
        netAmount,
        recipient: recipientEmail,
        message
      },
      sender: {
        totalCredits: sender.totalCredits,
        availableCredits: sender.coinBalance
      }
    });

  } catch (error) {
    console.error('Transfer credits error:', error);
    res.status(500).json({ message: 'Credits transfer failed' });
  }
});

module.exports = router;
