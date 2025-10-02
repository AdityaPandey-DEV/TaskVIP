const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 100 // Minimum ₹100 withdrawal
  },
  coinsDeducted: {
    type: Number,
    required: true,
    min: 1000 // Minimum 1000 coins (₹100)
  },
  conversionRate: {
    type: Number,
    default: 10, // 1000 coins = ₹100 (10 coins = ₹1)
    required: true
  },
  method: {
    type: String,
    enum: ['paytm', 'upi', 'paypal', 'bank_transfer', 'amazon_gift_card'],
    required: true
  },
  paymentDetails: {
    paytmNumber: String,
    upiId: String,
    paypalEmail: String,
    bankAccount: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      bankName: String
    },
    giftCardEmail: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  adminNotes: String,
  processingFee: {
    type: Number,
    default: 0
  },
  transactionId: String, // Payment gateway transaction ID
  failureReason: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin who processed
  },
  processedAt: Date,
  fraudCheck: {
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    flags: [String],
    ipAddress: String,
    deviceId: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes
withdrawalSchema.index({ userId: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });
withdrawalSchema.index({ method: 1 });
withdrawalSchema.index({ amount: 1 });

// Virtual for net amount after fees
withdrawalSchema.virtual('netAmount').get(function() {
  return this.amount - this.processingFee;
});

// Pre-save middleware to calculate processing fees
withdrawalSchema.pre('save', function(next) {
  if (this.isNew) {
    // Calculate processing fees based on method
    const feeRates = {
      'paytm': 0.02,        // 2% fee
      'upi': 0.01,          // 1% fee
      'paypal': 0.05,       // 5% fee (higher for international)
      'bank_transfer': 0.03, // 3% fee
      'amazon_gift_card': 0 // No fee for gift cards
    };
    
    this.processingFee = Math.round(this.amount * (feeRates[this.method] || 0.02));
  }
  next();
});

// Static method to check if user can withdraw
withdrawalSchema.statics.canUserWithdraw = async function(userId, amount) {
  const User = mongoose.model('User');
  const CoinTransaction = mongoose.model('CoinTransaction');
  
  const user = await User.findById(userId);
  if (!user) return { canWithdraw: false, reason: 'User not found' };
  
  // Check minimum amount
  if (amount < 100) {
    return { canWithdraw: false, reason: 'Minimum withdrawal amount is ₹100' };
  }
  
  // Check coin balance
  const requiredCoins = amount * 10; // 10 coins = ₹1
  const userBalance = await CoinTransaction.getUserBalance(userId);
  
  if (userBalance < requiredCoins) {
    return { 
      canWithdraw: false, 
      reason: `Insufficient coins. Required: ${requiredCoins}, Available: ${userBalance}` 
    };
  }
  
  // Check pending withdrawals
  const pendingWithdrawals = await this.countDocuments({
    userId,
    status: { $in: ['pending', 'processing'] }
  });
  
  if (pendingWithdrawals > 0) {
    return { canWithdraw: false, reason: 'You have pending withdrawal requests' };
  }
  
  // Check daily withdrawal limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayWithdrawals = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: today },
        status: { $in: ['completed', 'processing', 'pending'] }
      }
    },
    { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
  ]);
  
  const todayTotal = todayWithdrawals.length > 0 ? todayWithdrawals[0].totalAmount : 0;
  const dailyLimit = user.vipLevel > 0 ? 5000 : 1000; // VIP users get higher limits
  
  if (todayTotal + amount > dailyLimit) {
    return { 
      canWithdraw: false, 
      reason: `Daily withdrawal limit exceeded. Limit: ₹${dailyLimit}, Used: ₹${todayTotal}` 
    };
  }
  
  return { canWithdraw: true };
};

// Static method to create withdrawal request
withdrawalSchema.statics.createWithdrawal = async function(userId, amount, method, paymentDetails, metadata = {}) {
  const canWithdraw = await this.canUserWithdraw(userId, amount);
  if (!canWithdraw.canWithdraw) {
    throw new Error(canWithdraw.reason);
  }
  
  const coinsDeducted = amount * 10; // 10 coins = ₹1
  
  // Calculate fraud score
  const fraudScore = await this.calculateFraudScore(userId, amount, metadata);
  
  const withdrawal = new this({
    userId,
    amount,
    coinsDeducted,
    method,
    paymentDetails,
    fraudCheck: {
      score: fraudScore,
      flags: fraudScore > 50 ? ['high_fraud_score'] : [],
      ipAddress: metadata.ipAddress,
      deviceId: metadata.deviceId,
      userAgent: metadata.userAgent
    }
  });
  
  await withdrawal.save();
  
  // Deduct coins from user (hold them until withdrawal is processed)
  const CoinTransaction = mongoose.model('CoinTransaction');
  await CoinTransaction.createReward(
    userId,
    'spent_withdrawal',
    -coinsDeducted,
    `Withdrawal request: ₹${amount} via ${method}`,
    { withdrawalId: withdrawal._id, ...metadata }
  );
  
  return withdrawal;
};

// Static method to calculate fraud score for withdrawals
withdrawalSchema.statics.calculateFraudScore = async function(userId, amount, metadata = {}) {
  let score = 0;
  
  // Check user account age
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  const accountAge = (new Date() - user.createdAt) / (1000 * 60 * 60 * 24); // days
  
  if (accountAge < 7) score += 30; // New account
  if (accountAge < 1) score += 50; // Very new account
  
  // Check withdrawal frequency
  const recentWithdrawals = await this.countDocuments({
    userId,
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });
  
  if (recentWithdrawals > 3) score += 25; // Too many withdrawals
  
  // Check amount vs earning pattern
  const CoinTransaction = mongoose.model('CoinTransaction');
  const userStats = await CoinTransaction.getUserStats(userId, 30);
  const totalEarned = userStats.reduce((sum, stat) => sum + (stat.totalCoins > 0 ? stat.totalCoins : 0), 0);
  
  if (amount * 10 > totalEarned * 0.8) score += 20; // Withdrawing too much too fast
  
  return Math.min(score, 100);
};

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
