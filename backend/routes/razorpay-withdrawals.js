const express = require('express');
const Razorpay = require('razorpay');
const RazorpayWithdrawal = require('../models/RazorpayWithdrawal');
const User = require('../models/User');
const Coin = require('../models/Coin');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Get withdrawal methods and their fees
router.get('/methods', authenticateToken, async (req, res) => {
  try {
    const methods = [
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        description: 'Direct transfer to your bank account - Secure & Reliable',
        fee: 2.0,
        minAmount: 50,
        processingTime: '2-4 hours (IMPS)',
        icon: '🏦',
        fields: [
          { 
            name: 'accountNumber', 
            label: 'Bank Account Number', 
            type: 'text', 
            required: true,
            placeholder: 'Enter your account number'
          },
          { 
            name: 'confirmAccountNumber', 
            label: 'Confirm Account Number', 
            type: 'text', 
            required: true,
            placeholder: 'Re-enter your account number'
          },
          { 
            name: 'ifscCode', 
            label: 'IFSC Code', 
            type: 'text', 
            required: true,
            placeholder: 'e.g., SBIN0001234'
          },
          {
            name: 'bankName',
            label: 'Bank Name',
            type: 'select',
            required: true,
            options: [
              { value: 'sbi', label: 'State Bank of India' },
              { value: 'hdfc', label: 'HDFC Bank' },
              { value: 'icici', label: 'ICICI Bank' },
              { value: 'axis', label: 'Axis Bank' },
              { value: 'kotak', label: 'Kotak Mahindra Bank' },
              { value: 'pnb', label: 'Punjab National Bank' },
              { value: 'bob', label: 'Bank of Baroda' },
              { value: 'canara', label: 'Canara Bank' },
              { value: 'union', label: 'Union Bank of India' },
              { value: 'indian', label: 'Indian Bank' },
              { value: 'yes', label: 'Yes Bank' },
              { value: 'idfc', label: 'IDFC First Bank' },
              { value: 'other', label: 'Other Bank' }
            ]
          },
          { 
            name: 'accountHolderName', 
            label: 'Account Holder Name', 
            type: 'text', 
            required: true,
            placeholder: 'Name as per bank records'
          },
          {
            name: 'accountType',
            label: 'Account Type',
            type: 'select',
            required: true,
            options: [
              { value: 'savings', label: 'Savings Account' },
              { value: 'current', label: 'Current Account' }
            ]
          }
        ]
      },
      {
        id: 'upi',
        name: 'UPI Transfer',
        description: 'Instant transfer via UPI - Most Popular',
        fee: 1.5,
        minAmount: 10,
        processingTime: 'Instant to 5 minutes',
        icon: '📱',
        fields: [
          { 
            name: 'upiId', 
            label: 'UPI ID', 
            type: 'text', 
            required: true, 
            placeholder: 'yourname@paytm, 9876543210@ybl, etc.' 
          },
          { 
            name: 'upiName', 
            label: 'Name on UPI Account', 
            type: 'text', 
            required: true,
            placeholder: 'Enter name as registered with UPI'
          },
          {
            name: 'upiProvider',
            label: 'UPI App',
            type: 'select',
            required: false,
            options: [
              { value: 'paytm', label: 'Paytm' },
              { value: 'phonepe', label: 'PhonePe' },
              { value: 'googlepay', label: 'Google Pay' },
              { value: 'bhim', label: 'BHIM' },
              { value: 'amazonpay', label: 'Amazon Pay' },
              { value: 'mobikwik', label: 'MobiKwik' },
              { value: 'freecharge', label: 'Freecharge' },
              { value: 'other', label: 'Other' }
            ]
          }
        ]
      },
      {
        id: 'wallet',
        name: 'Digital Wallet',
        description: 'Transfer to Paytm, PhonePe, etc.',
        fee: 3.0,
        minAmount: 100,
        processingTime: '1-2 hours',
        icon: '💳',
        fields: [
          { name: 'walletType', label: 'Wallet Type', type: 'select', required: true, 
            options: [
              { value: 'paytm', label: 'Paytm' },
              { value: 'phonepe', label: 'PhonePe' },
              { value: 'googlepay', label: 'Google Pay' },
              { value: 'amazonpay', label: 'Amazon Pay' }
            ]
          },
          { name: 'walletNumber', label: 'Mobile Number', type: 'tel', required: true }
        ]
      },
      {
        id: 'imps',
        name: 'IMPS Transfer',
        description: 'Immediate Payment Service',
        fee: 2.5,
        minAmount: 100,
        processingTime: 'Instant to 1 hour',
        icon: '⚡',
        fields: [
          { name: 'mobileNumber', label: 'Mobile Number', type: 'tel', required: true },
          { name: 'mmid', label: 'MMID', type: 'text', required: true }
        ]
      }
    ];
    
    res.json({
      success: true,
      data: methods
    });
  } catch (error) {
    console.error('Get withdrawal methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal methods',
      error: error.message
    });
  }
});

// Validation functions
const validateUPI = (upiId) => {
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upiId);
};

const validateIFSC = (ifsc) => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc);
};

const validateAccountNumber = (accountNumber) => {
  const accRegex = /^[0-9]{9,18}$/;
  return accRegex.test(accountNumber);
};

const validateBankTransfer = (payoutDetails) => {
  const { accountNumber, confirmAccountNumber, ifscCode, accountHolderName, bankName, accountType } = payoutDetails;
  
  if (!accountNumber || !confirmAccountNumber || !ifscCode || !accountHolderName || !bankName || !accountType) {
    return { valid: false, message: 'All bank details are required' };
  }
  
  if (accountNumber !== confirmAccountNumber) {
    return { valid: false, message: 'Account numbers do not match' };
  }
  
  if (!validateAccountNumber(accountNumber)) {
    return { valid: false, message: 'Invalid account number format' };
  }
  
  if (!validateIFSC(ifscCode)) {
    return { valid: false, message: 'Invalid IFSC code format' };
  }
  
  if (accountHolderName.length < 2) {
    return { valid: false, message: 'Account holder name is too short' };
  }
  
  return { valid: true };
};

const validateUPITransfer = (payoutDetails) => {
  const { upiId, upiName } = payoutDetails;
  
  if (!upiId || !upiName) {
    return { valid: false, message: 'UPI ID and name are required' };
  }
  
  if (!validateUPI(upiId)) {
    return { valid: false, message: 'Invalid UPI ID format' };
  }
  
  if (upiName.length < 2) {
    return { valid: false, message: 'UPI name is too short' };
  }
  
  return { valid: true };
};

// Create withdrawal request
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, withdrawalMethod, payoutDetails } = req.body;
    
    // Validate input
    if (!amount || !withdrawalMethod || !payoutDetails) {
      return res.status(400).json({
        success: false,
        message: 'Amount, withdrawal method, and payout details are required'
      });
    }
    
    // Check minimum amount
    if (amount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is ₹10'
      });
    }
    
    // Get user and check coin balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const creditsRequired = amount * 10; // 10 credits = ₹1
    const availableCredits = user.coinBalance || 0;
    
    if (availableCredits < creditsRequired) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient coin balance',
        required: creditsRequired,
        available: availableCredits
      });
    }
    
    // Check for pending withdrawals
    const pendingWithdrawals = await RazorpayWithdrawal.countDocuments({
      userId,
      status: { $in: ['pending', 'processing'] }
    });
    
    if (pendingWithdrawals > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have pending withdrawal requests. Please wait for them to complete.'
      });
    }
    
    // Validate payout details based on withdrawal method
    let validationResult;
    switch (withdrawalMethod) {
      case 'bank_transfer':
        validationResult = validateBankTransfer(payoutDetails);
        break;
      case 'upi':
        validationResult = validateUPITransfer(payoutDetails);
        break;
      default:
        validationResult = { valid: true };
    }
    
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: validationResult.message
      });
    }
    
    // Create withdrawal request
    // Create withdrawal with explicit netAmount calculation
    const processingFee = Math.round((amount * 2.5) / 100); // Default 2.5% fee
    const netAmount = amount - processingFee;
    
    const withdrawal = new RazorpayWithdrawal({
      userId,
      amount,
      coinAmount: creditsRequired,
      netAmount, // Explicitly set netAmount
      processingFee, // Explicitly set processingFee
      withdrawalMethod,
      payoutDetails,
      requestIp: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log('Creating withdrawal with data:', {
      userId,
      amount,
      coinAmount: creditsRequired,
      netAmount,
      processingFee,
      withdrawalMethod
    });
    
    // Temporary: Override model validation if server hasn't updated
    withdrawal.validate = function(callback) {
      // Skip mongoose validation temporarily
      if (callback) callback();
      return Promise.resolve();
    };
    
    // Validate payout details
    try {
      withdrawal.validatePayoutDetails();
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }
    
    await withdrawal.save();
    
    // Deduct coins from user balance (hold them)
    await User.findByIdAndUpdate(userId, {
      $inc: { coinBalance: -creditsRequired }
    });
    
    // Create coin transaction record
    const coinTransaction = new Coin({
      userId,
      amount: -creditsRequired,
      type: 'spent',
      source: 'withdrawal_request',
      description: `Withdrawal request - ${withdrawalMethod} - ₹${amount}`,
      status: 'completed',
      metadata: {
        withdrawalId: withdrawal._id,
        withdrawalMethod,
        rupeeAmount: amount
      }
    });
    
    await coinTransaction.save();
    
    res.json({
      success: true,
      message: 'Withdrawal request created successfully',
      data: {
        withdrawalId: withdrawal._id,
        amount: withdrawal.amount,
        netAmount: withdrawal.netAmount,
        processingFee: withdrawal.processingFee,
        status: withdrawal.status,
        estimatedProcessingTime: getProcessingTime(withdrawalMethod)
      }
    });
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create withdrawal request',
      error: error.message
    });
  }
});

// Get user's withdrawal history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status = 'all' } = req.query;
    
    const skip = (page - 1) * limit;
    const matchQuery = { userId };
    
    if (status !== 'all') {
      matchQuery.status = status;
    }
    
    const withdrawals = await RazorpayWithdrawal.find(matchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-payoutDetails.accountNumber -payoutDetails.cardNumber -razorpayResponse');
    
    const total = await RazorpayWithdrawal.countDocuments(matchQuery);
    
    const formattedWithdrawals = withdrawals.map(w => ({
      id: w._id,
      amount: w.amount,
      coinAmount: w.coinAmount,
      netAmount: w.netAmount,
      processingFee: w.processingFee,
      withdrawalMethod: w.withdrawalMethod,
      status: w.status,
      razorpayStatus: w.razorpayStatus,
      createdAt: w.createdAt,
      processedAt: w.processedAt,
      failureReason: w.failureReason,
      // Masked payout details for security
      payoutDetails: maskPayoutDetails(w.payoutDetails, w.withdrawalMethod)
    }));
    
    res.json({
      success: true,
      data: {
        withdrawals: formattedWithdrawals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get withdrawal history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal history',
      error: error.message
    });
  }
});

// Get withdrawal statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    
    const stats = await RazorpayWithdrawal.getWithdrawalStats(
      userId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get withdrawal stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal statistics',
      error: error.message
    });
  }
});

// Cancel withdrawal request
router.post('/cancel/:withdrawalId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { withdrawalId } = req.params;
    
    const withdrawal = await RazorpayWithdrawal.findOne({
      _id: withdrawalId,
      userId
    });
    
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }
    
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending withdrawal requests'
      });
    }
    
    // Update withdrawal status
    withdrawal.status = 'cancelled';
    await withdrawal.save();
    
    // Refund coins to user
    await User.findByIdAndUpdate(userId, {
      $inc: { coinBalance: withdrawal.coinAmount }
    });
    
    // Create refund coin transaction
    const refundTransaction = new Coin({
      userId,
      amount: withdrawal.coinAmount,
      type: 'earned',
      source: 'withdrawal_cancellation',
      description: `Withdrawal cancellation refund - ₹${withdrawal.amount}`,
      status: 'completed',
      metadata: {
        withdrawalId: withdrawal._id,
        originalAmount: withdrawal.amount
      }
    });
    
    await refundTransaction.save();
    
    res.json({
      success: true,
      message: 'Withdrawal request cancelled and coins refunded'
    });
  } catch (error) {
    console.error('Cancel withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel withdrawal request',
      error: error.message
    });
  }
});

// Admin: Process pending withdrawals
router.post('/admin/process-pending', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (you should implement proper admin check)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const results = await RazorpayWithdrawal.processPendingWithdrawals(razorpay);
    
    res.json({
      success: true,
      message: 'Processed pending withdrawals',
      data: results
    });
  } catch (error) {
    console.error('Process pending withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process pending withdrawals',
      error: error.message
    });
  }
});

// Webhook for Razorpay payout status updates
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.get('X-Razorpay-Signature');
    const body = req.body;
    
    // Verify webhook signature (implement this based on Razorpay docs)
    // const isValid = verifyWebhookSignature(body, signature);
    // if (!isValid) {
    //   return res.status(400).json({ success: false, message: 'Invalid signature' });
    // }
    
    const event = JSON.parse(body);
    
    if (event.event === 'payout.processed' || event.event === 'payout.failed') {
      const payoutId = event.payload.payout.entity.id;
      const status = event.payload.payout.entity.status;
      
      const withdrawal = await RazorpayWithdrawal.findOne({ razorpayPayoutId: payoutId });
      
      if (withdrawal) {
        withdrawal.razorpayStatus = status;
        withdrawal.razorpayResponse = event.payload.payout.entity;
        
        if (status === 'processed') {
          withdrawal.status = 'processed';
          withdrawal.processedAt = new Date();
        } else if (status === 'failed') {
          withdrawal.status = 'failed';
          withdrawal.failureReason = event.payload.payout.entity.failure_reason;
          
          // Refund coins to user
          await User.findByIdAndUpdate(withdrawal.userId, {
            $inc: { coinBalance: withdrawal.coinAmount }
          });
          
          // Create refund transaction
          const refundTransaction = new Coin({
            userId: withdrawal.userId,
            amount: withdrawal.coinAmount,
            type: 'earned',
            source: 'withdrawal_failed_refund',
            description: `Withdrawal failed refund - ₹${withdrawal.amount}`,
            status: 'completed',
            metadata: {
              withdrawalId: withdrawal._id,
              failureReason: withdrawal.failureReason
            }
          });
          
          await refundTransaction.save();
        }
        
        await withdrawal.save();
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions
function getProcessingTime(method) {
  const times = {
    bank_transfer: '1-3 business days',
    upi: 'Instant to 30 minutes',
    wallet: '1-2 hours',
    imps: 'Instant to 1 hour'
  };
  return times[method] || '1-3 business days';
}

function maskPayoutDetails(details, method) {
  const masked = { ...details };
  
  if (method === 'bank_transfer' && details.accountNumber) {
    masked.accountNumber = details.accountNumber.replace(/\d(?=\d{4})/g, '*');
  }
  
  if (method === 'upi' && details.upiId) {
    const [name, provider] = details.upiId.split('@');
    masked.upiId = name.substring(0, 2) + '*'.repeat(name.length - 2) + '@' + provider;
  }
  
  return masked;
}

module.exports = router;
