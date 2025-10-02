const mongoose = require('mongoose');

const razorpayWithdrawalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 10 // Minimum ₹10 withdrawal
  },
  coinAmount: {
    type: Number,
    required: true
  },
  conversionRate: {
    type: Number,
    default: 10, // 10 coins = ₹1
    required: true
  },
  processingFee: {
    type: Number,
    required: true,
    default: 0
  },
  netAmount: {
    type: Number,
    required: false, // Will be calculated in pre-save middleware
    default: 0
  },
  withdrawalMethod: {
    type: String,
    enum: ['bank_transfer', 'upi', 'wallet', 'card', 'imps'],
    required: true
  },
  payoutDetails: {
    // Bank Transfer
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String,
    
    // UPI
    upiId: String,
    upiName: String,
    
    // Wallet
    walletType: String, // paytm, phonepe, googlepay, etc.
    walletNumber: String,
    
    // Card
    cardNumber: String,
    cardHolderName: String,
    
    // IMPS
    mobileNumber: String,
    mmid: String
  },
  razorpayPayoutId: {
    type: String,
    default: null
  },
  razorpayContactId: {
    type: String,
    default: null
  },
  razorpayFundAccountId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'processed', 'failed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  razorpayStatus: {
    type: String,
    default: null
  },
  failureReason: {
    type: String,
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  razorpayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  adminNotes: {
    type: String,
    default: null
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationNotes: {
    type: String,
    default: null
  },
  requestIp: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
razorpayWithdrawalSchema.index({ userId: 1, createdAt: -1 });
razorpayWithdrawalSchema.index({ status: 1 });
razorpayWithdrawalSchema.index({ razorpayPayoutId: 1 });
razorpayWithdrawalSchema.index({ withdrawalMethod: 1 });
razorpayWithdrawalSchema.index({ verificationStatus: 1 });

// Pre-save middleware to calculate processing fee and net amount
razorpayWithdrawalSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('amount') || this.isModified('withdrawalMethod')) {
    // Calculate processing fee based on method
    const feePercentages = {
      bank_transfer: 2.5,
      upi: 2.0,
      wallet: 3.0,
      card: 3.5,
      imps: 2.5
    };
    
    const feePercentage = feePercentages[this.withdrawalMethod] || 2.5;
    this.processingFee = Math.round((this.amount * feePercentage) / 100);
    this.netAmount = this.amount - this.processingFee;
  }
  next();
});

// Method to validate payout details
razorpayWithdrawalSchema.methods.validatePayoutDetails = function() {
  const details = this.payoutDetails;
  
  switch (this.withdrawalMethod) {
    case 'bank_transfer':
      if (!details.accountNumber || !details.ifscCode || !details.bankName || !details.accountHolderName) {
        throw new Error('Bank transfer requires account number, IFSC code, bank name, and account holder name');
      }
      // Validate IFSC code format
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(details.ifscCode)) {
        throw new Error('Invalid IFSC code format');
      }
      break;
      
    case 'upi':
      if (!details.upiId) {
        throw new Error('UPI requires UPI ID');
      }
      // Validate UPI ID format
      if (!/^[\w.-]+@[\w.-]+$/.test(details.upiId)) {
        throw new Error('Invalid UPI ID format');
      }
      break;
      
    case 'wallet':
      if (!details.walletType || !details.walletNumber) {
        throw new Error('Wallet requires wallet type and number');
      }
      break;
      
    case 'card':
      if (!details.cardNumber || !details.cardHolderName) {
        throw new Error('Card requires card number and holder name');
      }
      break;
      
    case 'imps':
      if (!details.mobileNumber || !details.mmid) {
        throw new Error('IMPS requires mobile number and MMID');
      }
      break;
      
    default:
      throw new Error('Invalid withdrawal method');
  }
  
  return true;
};

// Method to create Razorpay contact
razorpayWithdrawalSchema.methods.createRazorpayContact = async function(razorpay, user) {
  try {
    const contact = await razorpay.contacts.create({
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      contact: this.payoutDetails.mobileNumber || '9999999999',
      type: 'customer',
      reference_id: user._id.toString()
    });
    
    this.razorpayContactId = contact.id;
    return contact;
  } catch (error) {
    throw new Error(`Failed to create Razorpay contact: ${error.message}`);
  }
};

// Method to create Razorpay fund account
razorpayWithdrawalSchema.methods.createRazorpayFundAccount = async function(razorpay) {
  try {
    let accountDetails = {};
    
    switch (this.withdrawalMethod) {
      case 'bank_transfer':
        accountDetails = {
          account_type: 'bank_account',
          bank_account: {
            name: this.payoutDetails.accountHolderName,
            ifsc: this.payoutDetails.ifscCode,
            account_number: this.payoutDetails.accountNumber
          }
        };
        break;
        
      case 'upi':
        accountDetails = {
          account_type: 'vpa',
          vpa: {
            address: this.payoutDetails.upiId
          }
        };
        break;
        
      case 'wallet':
        accountDetails = {
          account_type: 'wallet',
          wallet: {
            provider: this.payoutDetails.walletType,
            phone: this.payoutDetails.walletNumber
          }
        };
        break;
        
      default:
        throw new Error(`Unsupported withdrawal method: ${this.withdrawalMethod}`);
    }
    
    const fundAccount = await razorpay.fundAccount.create({
      contact_id: this.razorpayContactId,
      ...accountDetails
    });
    
    this.razorpayFundAccountId = fundAccount.id;
    return fundAccount;
  } catch (error) {
    throw new Error(`Failed to create Razorpay fund account: ${error.message}`);
  }
};

// Method to create Razorpay payout
razorpayWithdrawalSchema.methods.createRazorpayPayout = async function(razorpay) {
  try {
    const payout = await razorpay.payouts.create({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
      fund_account_id: this.razorpayFundAccountId,
      amount: this.netAmount * 100, // Amount in paise
      currency: 'INR',
      mode: this.withdrawalMethod === 'upi' ? 'UPI' : 'IMPS',
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: this._id.toString(),
      narration: `TaskVIP withdrawal - ${this._id}`
    });
    
    this.razorpayPayoutId = payout.id;
    this.razorpayStatus = payout.status;
    this.razorpayResponse = payout;
    this.status = 'processing';
    
    return payout;
  } catch (error) {
    this.status = 'failed';
    this.failureReason = error.message;
    throw new Error(`Failed to create Razorpay payout: ${error.message}`);
  }
};

// Static method to get withdrawal statistics
razorpayWithdrawalSchema.statics.getWithdrawalStats = async function(userId, startDate, endDate) {
  const matchQuery = { userId: new mongoose.Types.ObjectId(userId) };
  
  if (startDate && endDate) {
    matchQuery.createdAt = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalFees: { $sum: '$processingFee' },
        totalNetAmount: { $sum: '$netAmount' }
      }
    }
  ]);
  
  const summary = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalWithdrawals: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalFees: { $sum: '$processingFee' },
        totalNetAmount: { $sum: '$netAmount' },
        successfulWithdrawals: {
          $sum: { $cond: [{ $eq: ['$status', 'processed'] }, 1, 0] }
        },
        pendingWithdrawals: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return {
    byStatus: stats,
    summary: summary.length > 0 ? summary[0] : {
      totalWithdrawals: 0,
      totalAmount: 0,
      totalFees: 0,
      totalNetAmount: 0,
      successfulWithdrawals: 0,
      pendingWithdrawals: 0
    }
  };
};

// Static method to process pending withdrawals
razorpayWithdrawalSchema.statics.processPendingWithdrawals = async function(razorpay) {
  const pendingWithdrawals = await this.find({ 
    status: 'pending',
    verificationStatus: 'verified'
  }).populate('userId');
  
  const results = [];
  
  for (const withdrawal of pendingWithdrawals) {
    try {
      // Create contact if not exists
      if (!withdrawal.razorpayContactId) {
        await withdrawal.createRazorpayContact(razorpay, withdrawal.userId);
      }
      
      // Create fund account if not exists
      if (!withdrawal.razorpayFundAccountId) {
        await withdrawal.createRazorpayFundAccount(razorpay);
      }
      
      // Create payout
      const payout = await withdrawal.createRazorpayPayout(razorpay);
      
      await withdrawal.save();
      
      results.push({
        withdrawalId: withdrawal._id,
        status: 'success',
        payoutId: payout.id
      });
      
    } catch (error) {
      withdrawal.status = 'failed';
      withdrawal.failureReason = error.message;
      await withdrawal.save();
      
      results.push({
        withdrawalId: withdrawal._id,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  return results;
};

module.exports = mongoose.model('RazorpayWithdrawal', razorpayWithdrawalSchema);
