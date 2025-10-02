const mongoose = require('mongoose');

const multiLevelReferralSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  level1Referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  level2Referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  level3Referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referralCode: {
    type: String,
    required: true
  },
  referralChain: [{
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 3
    },
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    percentage: {
      type: Number,
      required: true
    }
  }],
  totalCommissionsEarned: {
    type: Number,
    default: 0
  },
  totalCommissionsPaid: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for better performance
multiLevelReferralSchema.index({ userId: 1 });
multiLevelReferralSchema.index({ level1Referrer: 1 });
multiLevelReferralSchema.index({ level2Referrer: 1 });
multiLevelReferralSchema.index({ level3Referrer: 1 });
multiLevelReferralSchema.index({ referralCode: 1 });

// Commission tracking schema
const commissionSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  percentage: {
    type: Number,
    required: true
  },
  originalAmount: {
    type: Number,
    required: true
  },
  commissionAmount: {
    type: Number,
    required: true
  },
  transactionType: {
    type: String,
    enum: ['vip_purchase', 'coin_purchase', 'withdrawal_fee'],
    required: true
  },
  transactionId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'cancelled'],
    default: 'pending'
  },
  paidAt: {
    type: Date,
    default: null
  },
  metadata: {
    vipLevel: Number,
    coinAmount: Number,
    withdrawalAmount: Number,
    paymentMethod: String
  }
}, {
  timestamps: true
});

// Indexes for commission tracking
commissionSchema.index({ fromUserId: 1, createdAt: -1 });
commissionSchema.index({ toUserId: 1, createdAt: -1 });
commissionSchema.index({ level: 1 });
commissionSchema.index({ status: 1 });
commissionSchema.index({ transactionId: 1 });

// Static method to build referral chain
multiLevelReferralSchema.statics.buildReferralChain = async function(referralCode, newUserId) {
  const User = mongoose.model('User');
  
  // Find the direct referrer (Level 1)
  const level1Referrer = await User.findOne({ referralCode });
  if (!level1Referrer) {
    throw new Error('Invalid referral code');
  }
  
  // Check if user is trying to refer themselves
  if (level1Referrer._id.toString() === newUserId.toString()) {
    throw new Error('Cannot refer yourself');
  }
  
  // Check if user already has a referral record
  const existingRecord = await this.findOne({ userId: newUserId });
  if (existingRecord) {
    throw new Error('User already has referral record');
  }
  
  // Find Level 2 and Level 3 referrers
  const level1Record = await this.findOne({ userId: level1Referrer._id });
  const level2Referrer = level1Record ? level1Record.level1Referrer : null;
  
  let level3Referrer = null;
  if (level2Referrer) {
    const level2Record = await this.findOne({ userId: level2Referrer });
    level3Referrer = level2Record ? level2Record.level1Referrer : null;
  }
  
  // Build referral chain with base percentages (will be adjusted by VIP level during commission processing)
  const referralChain = [];
  
  // Level 1: Base 50% (will be adjusted to 20-50% based on VIP level)
  referralChain.push({
    level: 1,
    referrerId: level1Referrer._id,
    percentage: 50 // Base percentage, actual will be calculated by VIP level
  });
  
  // Level 2: Fixed 10% (not affected by VIP level)
  if (level2Referrer) {
    referralChain.push({
      level: 2,
      referrerId: level2Referrer,
      percentage: 10
    });
  }
  
  // Level 3: Fixed 5% (not affected by VIP level)
  if (level3Referrer) {
    referralChain.push({
      level: 3,
      referrerId: level3Referrer,
      percentage: 5
    });
  }
  
  // Create multi-level referral record
  const multiLevelReferral = new this({
    userId: newUserId,
    level1Referrer: level1Referrer._id,
    level2Referrer: level2Referrer,
    level3Referrer: level3Referrer,
    referralCode,
    referralChain
  });
  
  await multiLevelReferral.save();
  return multiLevelReferral;
};

// Static method to get VIP-based commission percentage for level 1
multiLevelReferralSchema.statics.getVipCommissionRate = function(vipLevel, referralLevel) {
  // Level 1 (Direct referrals) - VIP-based rates
  if (referralLevel === 1) {
    switch (vipLevel) {
      case 1: return 30; // VIP 1: 30%
      case 2: return 40; // VIP 2: 40%  
      case 3: return 50; // VIP 3: 50%
      default: return 20; // Non-VIP: 20%
    }
  }
  
  // Level 2 (Indirect referrals) - Fixed rates
  if (referralLevel === 2) {
    return 10; // All VIP levels get 10%
  }
  
  // Level 3 (Deep referrals) - Fixed rates
  if (referralLevel === 3) {
    return 5; // All VIP levels get 5%
  }
  
  return 0;
};

// Static method to process commission payment with VIP rates
multiLevelReferralSchema.statics.processCommissions = async function(userId, amount, transactionType, transactionId, metadata = {}) {
  const Commission = mongoose.model('Commission');
  const User = mongoose.model('User');
  
  // Find user's referral record
  const referralRecord = await this.findOne({ userId });
  if (!referralRecord || referralRecord.referralChain.length === 0) {
    return { message: 'No referrers found', commissions: [] };
  }
  
  const commissions = [];
  
  // Process commissions for each level with VIP-based rates
  for (const chainItem of referralRecord.referralChain) {
    // Get referrer's VIP level
    const referrer = await User.findById(chainItem.referrerId).select('vipLevel');
    const referrerVipLevel = referrer ? referrer.vipLevel : 0;
    
    // Calculate VIP-based commission percentage
    const vipCommissionRate = this.getVipCommissionRate(referrerVipLevel, chainItem.level);
    const commissionAmount = Math.round((amount * vipCommissionRate) / 100);
    
    if (commissionAmount > 0) {
      // Create commission record with VIP-adjusted rate
      const commission = new Commission({
        fromUserId: userId,
        toUserId: chainItem.referrerId,
        level: chainItem.level,
        percentage: vipCommissionRate, // Use VIP-based rate
        originalAmount: amount,
        commissionAmount,
        transactionType,
        transactionId,
        metadata: {
          ...metadata,
          referrerVipLevel,
          originalPercentage: chainItem.percentage, // Store original percentage
          vipAdjustedPercentage: vipCommissionRate
        }
      });
      
      await commission.save();
      commissions.push(commission);
      
      // Update referrer's coin balance
      const Coin = mongoose.model('Coin');
      
      await User.findByIdAndUpdate(chainItem.referrerId, {
        $inc: { coinBalance: commissionAmount }
      });
      
      // Create coin transaction record
      const coinTransaction = new Coin({
        userId: chainItem.referrerId,
        amount: commissionAmount,
        type: 'earned',
        source: `referral_commission_level_${chainItem.level}_vip${referrerVipLevel}`,
        description: `Level ${chainItem.level} referral commission (VIP${referrerVipLevel}: ${vipCommissionRate}%) from ${transactionType}`,
        status: 'completed',
        metadata: {
          fromUserId: userId,
          originalAmount: amount,
          percentage: vipCommissionRate,
          vipLevel: referrerVipLevel,
          transactionId
        }
      });
      
      await coinTransaction.save();
      
      // Mark commission as paid
      commission.status = 'paid';
      commission.paidAt = new Date();
      await commission.save();
      
      // Update total commissions
      await this.findOneAndUpdate(
        { userId: chainItem.referrerId },
        { $inc: { totalCommissionsEarned: commissionAmount } }
      );
    }
  }
  
  // Calculate total commission percentage paid (varies by VIP levels)
  const totalCommissionPaid = commissions.reduce((sum, comm) => sum + comm.percentage, 0);
  
  // Update total commissions paid for the user who made the purchase
  await this.findOneAndUpdate(
    { userId },
    { $inc: { totalCommissionsPaid: Math.round((amount * totalCommissionPaid) / 100) } }
  );
  
  return { message: 'VIP-based commissions processed successfully', commissions };
};

// Static method to get referral statistics
multiLevelReferralSchema.statics.getReferralStats = async function(userId) {
  const Commission = mongoose.model('Commission');
  
  // Get direct referrals (Level 1)
  const level1Referrals = await this.find({ level1Referrer: userId }).populate('userId', 'firstName lastName email createdAt');
  
  // Get Level 2 referrals
  const level2Referrals = await this.find({ level2Referrer: userId }).populate('userId', 'firstName lastName email createdAt');
  
  // Get Level 3 referrals
  const level3Referrals = await this.find({ level3Referrer: userId }).populate('userId', 'firstName lastName email createdAt');
  
  // Get commission earnings
  const commissionStats = await Commission.aggregate([
    { $match: { toUserId: new mongoose.Types.ObjectId(userId), status: 'paid' } },
    {
      $group: {
        _id: '$level',
        totalCommissions: { $sum: '$commissionAmount' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
  
  // Format commission stats
  const commissionsByLevel = {
    level1: { total: 0, count: 0 },
    level2: { total: 0, count: 0 },
    level3: { total: 0, count: 0 }
  };
  
  commissionStats.forEach(stat => {
    commissionsByLevel[`level${stat._id}`] = {
      total: stat.totalCommissions,
      count: stat.transactionCount
    };
  });
  
  const totalCommissions = commissionStats.reduce((sum, stat) => sum + stat.totalCommissions, 0);
  
  return {
    referrals: {
      level1: {
        count: level1Referrals.length,
        users: level1Referrals.map(r => r.userId)
      },
      level2: {
        count: level2Referrals.length,
        users: level2Referrals.map(r => r.userId)
      },
      level3: {
        count: level3Referrals.length,
        users: level3Referrals.map(r => r.userId)
      }
    },
    commissions: commissionsByLevel,
    totalReferrals: level1Referrals.length + level2Referrals.length + level3Referrals.length,
    totalCommissions
  };
};

const Commission = mongoose.model('Commission', commissionSchema);
const MultiLevelReferral = mongoose.model('MultiLevelReferral', multiLevelReferralSchema);

module.exports = { MultiLevelReferral, Commission };
