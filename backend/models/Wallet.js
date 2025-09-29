const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0
  },
  withdrawableBalance: {
    type: Number,
    default: 0
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  totalWithdrawn: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  metadata: {
    country: String,
    preferredPaymentMethod: String,
    kycVerified: {
      type: Boolean,
      default: false
    },
    kycVerifiedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
walletSchema.index({ userId: 1 });
walletSchema.index({ isActive: 1 });
walletSchema.index({ lastUpdated: -1 });

// Method to add funds
walletSchema.methods.addFunds = function(amount, source = 'earning') {
  this.balance += amount;
  this.totalEarned += amount;
  this.lastUpdated = new Date();
  
  // Update withdrawable balance if eligible
  if (this.balance >= 100) {
    this.withdrawableBalance = this.balance;
  }
  
  return this.save();
};

// Method to deduct funds
walletSchema.methods.deductFunds = function(amount, reason = 'withdrawal') {
  if (this.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  this.balance -= amount;
  this.withdrawableBalance -= amount;
  this.totalWithdrawn += amount;
  this.lastUpdated = new Date();
  
  return this.save();
};

// Method to check if withdrawal is possible
walletSchema.methods.canWithdraw = function(amount) {
  return this.balance >= amount && 
         this.withdrawableBalance >= amount && 
         this.metadata.kycVerified;
};

// Method to get available balance
walletSchema.methods.getAvailableBalance = function() {
  return {
    total: this.balance,
    withdrawable: this.withdrawableBalance,
    pending: this.balance - this.withdrawableBalance,
    currency: this.currency
  };
};

// Static method to get or create wallet
walletSchema.statics.getOrCreateWallet = async function(userId) {
  let wallet = await this.findOne({ userId });
  
  if (!wallet) {
    wallet = new this({ userId });
    await wallet.save();
  }
  
  return wallet;
};

// Static method to get wallet statistics
walletSchema.statics.getWalletStats = async function(startDate, endDate) {
  const matchQuery = {};
  
  if (startDate && endDate) {
    matchQuery.lastUpdated = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalWallets: { $sum: 1 },
        totalBalance: { $sum: '$balance' },
        totalWithdrawable: { $sum: '$withdrawableBalance' },
        totalEarned: { $sum: '$totalEarned' },
        totalWithdrawn: { $sum: '$totalWithdrawn' },
        averageBalance: { $avg: '$balance' }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : {
    totalWallets: 0,
    totalBalance: 0,
    totalWithdrawable: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    averageBalance: 0
  };
};

// Static method to get top earners
walletSchema.statics.getTopEarners = async function(limit = 10) {
  return await this.find({ isActive: true })
    .populate('userId', 'firstName lastName email userType vipLevel')
    .sort({ totalEarned: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Wallet', walletSchema);

