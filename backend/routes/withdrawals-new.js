const express = require('express');
const { body, validationResult } = require('express-validator');
const Withdrawal = require('../models/Withdrawal');
const CoinTransaction = require('../models/Coin');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/withdrawals
// @desc    Get user's withdrawal history
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { userId: req.user._id };
    if (status) query.status = status;
    
    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-paymentDetails -fraudCheck');
    
    const total = await Withdrawal.countDocuments(query);
    
    res.json({
      withdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ message: 'Failed to get withdrawals' });
  }
});

// @route   GET /api/withdrawals/limits
// @desc    Get withdrawal limits and info for user
// @access  Private
router.get('/limits', authenticateToken, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    const balance = await CoinTransaction.getUserBalance(req.user._id);
    
    // Calculate daily withdrawal usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayWithdrawals = await Withdrawal.aggregate([
      {
        $match: {
          userId: req.user._id,
          createdAt: { $gte: today },
          status: { $in: ['completed', 'processing', 'pending'] }
        }
      },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);
    
    const todayUsed = todayWithdrawals.length > 0 ? todayWithdrawals[0].totalAmount : 0;
    const dailyLimit = user.vipLevel > 0 ? 5000 : 1000;
    
    res.json({
      balance: {
        coins: balance,
        rupees: Math.floor(balance / 10)
      },
      limits: {
        minimum: {
          coins: 1000,
          rupees: 100
        },
        daily: {
          limit: dailyLimit,
          used: todayUsed,
          remaining: dailyLimit - todayUsed
        }
      },
      conversionRate: {
        coinsPerRupee: 10,
        rupeesPerCoin: 0.1
      },
      methods: [
        {
          id: 'paytm',
          name: 'Paytm',
          fee: '2%',
          processingTime: '24-48 hours',
          minAmount: 100
        },
        {
          id: 'upi',
          name: 'UPI',
          fee: '1%',
          processingTime: '24-48 hours',
          minAmount: 100
        },
        {
          id: 'paypal',
          name: 'PayPal',
          fee: '5%',
          processingTime: '3-5 days',
          minAmount: 500
        },
        {
          id: 'bank_transfer',
          name: 'Bank Transfer',
          fee: '3%',
          processingTime: '3-7 days',
          minAmount: 500
        },
        {
          id: 'amazon_gift_card',
          name: 'Amazon Gift Card',
          fee: '0%',
          processingTime: '24-48 hours',
          minAmount: 100
        }
      ]
    });
  } catch (error) {
    console.error('Get limits error:', error);
    res.status(500).json({ message: 'Failed to get limits' });
  }
});

// @route   POST /api/withdrawals/request
// @desc    Request a withdrawal
// @access  Private
router.post('/request', authenticateToken, [
  body('amount').isInt({ min: 100, max: 10000 }),
  body('method').isIn(['paytm', 'upi', 'paypal', 'bank_transfer', 'amazon_gift_card']),
  body('paymentDetails').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { amount, method, paymentDetails } = req.body;
    
    // Validate payment details based on method
    const validationErrors = validatePaymentDetails(method, paymentDetails);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Invalid payment details',
        errors: validationErrors
      });
    }
    
    const withdrawal = await Withdrawal.createWithdrawal(
      req.user._id,
      amount,
      method,
      paymentDetails,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceId: req.headers['x-device-id'] || 'unknown'
      }
    );
    
    res.json({
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        method: withdrawal.method,
        status: withdrawal.status,
        processingFee: withdrawal.processingFee,
        netAmount: withdrawal.netAmount,
        coinsDeducted: withdrawal.coinsDeducted,
        createdAt: withdrawal.createdAt
      }
    });
  } catch (error) {
    console.error('Request withdrawal error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/withdrawals/:withdrawalId/cancel
// @desc    Cancel a pending withdrawal
// @access  Private
router.post('/:withdrawalId/cancel', authenticateToken, async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    
    const withdrawal = await Withdrawal.findOne({
      _id: withdrawalId,
      userId: req.user._id,
      status: 'pending'
    });
    
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found or cannot be cancelled' });
    }
    
    withdrawal.status = 'cancelled';
    await withdrawal.save();
    
    // Refund coins to user
    await CoinTransaction.createReward(
      req.user._id,
      'refund',
      withdrawal.coinsDeducted,
      `Refund for cancelled withdrawal: ₹${withdrawal.amount}`,
      { withdrawalId: withdrawal._id }
    );
    
    res.json({
      message: 'Withdrawal cancelled successfully',
      refundedCoins: withdrawal.coinsDeducted
    });
  } catch (error) {
    console.error('Cancel withdrawal error:', error);
    res.status(500).json({ message: 'Failed to cancel withdrawal' });
  }
});

// @route   GET /api/withdrawals/stats
// @desc    Get withdrawal statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Withdrawal.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    const totalStats = await Withdrawal.aggregate([
      { $match: { userId: req.user._id, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalWithdrawn: { $sum: '$amount' },
          totalRequests: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          totalAmount: stat.totalAmount
        };
        return acc;
      }, {}),
      overall: totalStats.length > 0 ? {
        totalWithdrawn: totalStats[0].totalWithdrawn,
        totalRequests: totalStats[0].totalRequests
      } : {
        totalWithdrawn: 0,
        totalRequests: 0
      }
    });
  } catch (error) {
    console.error('Get withdrawal stats error:', error);
    res.status(500).json({ message: 'Failed to get stats' });
  }
});

// Helper function to validate payment details
function validatePaymentDetails(method, details) {
  const errors = [];
  
  switch (method) {
    case 'paytm':
      if (!details.paytmNumber || !/^[6-9]\d{9}$/.test(details.paytmNumber)) {
        errors.push('Valid Paytm number is required');
      }
      break;
      
    case 'upi':
      if (!details.upiId || !/^[\w.-]+@[\w.-]+$/.test(details.upiId)) {
        errors.push('Valid UPI ID is required');
      }
      break;
      
    case 'paypal':
      if (!details.paypalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.paypalEmail)) {
        errors.push('Valid PayPal email is required');
      }
      break;
      
    case 'bank_transfer':
      if (!details.bankAccount) {
        errors.push('Bank account details are required');
      } else {
        const { accountNumber, ifscCode, accountHolderName, bankName } = details.bankAccount;
        if (!accountNumber || accountNumber.length < 9) {
          errors.push('Valid account number is required');
        }
        if (!ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
          errors.push('Valid IFSC code is required');
        }
        if (!accountHolderName || accountHolderName.length < 2) {
          errors.push('Account holder name is required');
        }
        if (!bankName || bankName.length < 2) {
          errors.push('Bank name is required');
        }
      }
      break;
      
    case 'amazon_gift_card':
      if (!details.giftCardEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.giftCardEmail)) {
        errors.push('Valid email for gift card is required');
      }
      break;
      
    default:
      errors.push('Invalid withdrawal method');
  }
  
  return errors;
}

module.exports = router;
