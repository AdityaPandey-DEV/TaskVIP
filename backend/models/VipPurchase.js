const mongoose = require('mongoose');

const vipPurchaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vipLevel: {
    type: Number,
    enum: [1, 2, 3],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'paypal', 'stripe', 'bank_transfer'],
    required: true
  },
  paymentId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  paymentData: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    gatewayResponse: mongoose.Schema.Types.Mixed
  },
  vipBenefits: {
    dailyLimit: Number,
    referralBonus: Number,
    name: String,
    duration: Number, // in days
    price: Number
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  renewalDate: {
    type: Date
  },
  refundData: {
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String,
    refundId: String
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceInfo: mongoose.Schema.Types.Mixed,
    promoCode: String,
    discountAmount: Number
  }
}, {
  timestamps: true
});

// Indexes for better performance
vipPurchaseSchema.index({ userId: 1, createdAt: -1 });
vipPurchaseSchema.index({ status: 1 });
vipPurchaseSchema.index({ transactionId: 1 });
vipPurchaseSchema.index({ paymentId: 1 });
vipPurchaseSchema.index({ endDate: 1 });

// Virtual for days remaining
vipPurchaseSchema.virtual('daysRemaining').get(function() {
  if (!this.isActive || this.status !== 'completed') return 0;
  const now = new Date();
  const remaining = this.endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
});

// Virtual for is expired
vipPurchaseSchema.virtual('isExpired').get(function() {
  return this.endDate < new Date();
});

// Method to mark as completed
vipPurchaseSchema.methods.markCompleted = function(paymentData) {
  this.status = 'completed';
  this.paymentData = paymentData;
  this.isActive = true;
  return this.save();
};

// Method to mark as failed
vipPurchaseSchema.methods.markFailed = function(reason) {
  this.status = 'failed';
  this.isActive = false;
  this.metadata = {
    ...this.metadata,
    failureReason: reason
  };
  return this.save();
};

// Method to process refund
vipPurchaseSchema.methods.processRefund = function(refundData) {
  this.status = 'refunded';
  this.isActive = false;
  this.refundData = {
    ...refundData,
    refundedAt: new Date()
  };
  return this.save();
};

// Method to extend VIP
vipPurchaseSchema.methods.extendVip = function(additionalDays) {
  this.endDate = new Date(this.endDate.getTime() + (additionalDays * 24 * 60 * 60 * 1000));
  return this.save();
};

// Static method to get VIP benefits
vipPurchaseSchema.statics.getVipBenefits = function(level) {
  const benefits = {
    1: {
      dailyAdsLimit: 20,
      perAdReward: 1.5,
      maxDailyEarning: 30,
      referralBonus: 10,
      name: 'VIP 1',
      duration: 30,
      price: 300,
      monthlyEarning: 900
    },
    2: {
      dailyAdsLimit: 50,
      perAdReward: 2.0,
      maxDailyEarning: 100,
      referralBonus: 10,
      name: 'VIP 2',
      duration: 30,
      price: 600,
      monthlyEarning: 3000
    },
    3: {
      dailyAdsLimit: 100,
      perAdReward: 2.5,
      maxDailyEarning: 250,
      referralBonus: 10,
      name: 'VIP 3',
      duration: 30,
      price: 1000,
      monthlyEarning: 7500
    }
  };
  
  return benefits[level] || null;
};

// Static method to create VIP purchase
vipPurchaseSchema.statics.createVipPurchase = async function(userId, vipLevel, paymentMethod, paymentId) {
  const benefits = this.getVipBenefits(vipLevel);
  if (!benefits) {
    throw new Error('Invalid VIP level');
  }
  
  const transactionId = `VIP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + benefits.duration);
  
  const vipPurchase = new this({
    userId,
    vipLevel,
    amount: benefits.price,
    paymentMethod,
    paymentId,
    transactionId,
    vipBenefits: benefits,
    endDate
  });
  
  await vipPurchase.save();
  return vipPurchase;
};

// Static method to get user's active VIP
vipPurchaseSchema.statics.getActiveVip = async function(userId) {
  return await this.findOne({
    userId,
    status: 'completed',
    isActive: true,
    endDate: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Static method to get VIP statistics
vipPurchaseSchema.statics.getVipStats = async function(startDate, endDate) {
  const matchQuery = {};
  
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
        _id: '$vipLevel',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$amount' },
        activePurchases: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  return stats;
};

// Static method to get revenue statistics
vipPurchaseSchema.statics.getRevenueStats = async function(startDate, endDate) {
  const matchQuery = { status: 'completed' };
  
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
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalPurchases: { $sum: 1 },
        averagePurchaseValue: { $avg: '$amount' },
        vip1Revenue: {
          $sum: { $cond: [{ $eq: ['$vipLevel', 1] }, '$amount', 0] }
        },
        vip2Revenue: {
          $sum: { $cond: [{ $eq: ['$vipLevel', 2] }, '$amount', 0] }
        },
        vip3Revenue: {
          $sum: { $cond: [{ $eq: ['$vipLevel', 3] }, '$amount', 0] }
        }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : {
    totalRevenue: 0,
    totalPurchases: 0,
    averagePurchaseValue: 0,
    vip1Revenue: 0,
    vip2Revenue: 0,
    vip3Revenue: 0
  };
};

module.exports = mongoose.model('VipPurchase', vipPurchaseSchema);
