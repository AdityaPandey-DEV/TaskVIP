const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referred: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referralCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'expired'],
    default: 'pending'
  },
  bonusCredits: {
    type: Number,
    default: 0
  },
  bonusType: {
    type: String,
    enum: ['signup', 'vip_purchase', 'task_completion', 'milestone'],
    default: 'signup'
  },
  creditId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Credit',
    default: null
  },
  milestones: [{
    type: String,
    enum: ['first_task', 'vip_upgrade', 'week_active', 'month_active'],
    achievedAt: Date,
    bonusCredits: Number
  }],
  totalEarnings: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  metadata: {
    signupSource: String,
    deviceInfo: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
referralSchema.index({ referrer: 1, createdAt: -1 });
referralSchema.index({ referred: 1 });
referralSchema.index({ referralCode: 1 });
referralSchema.index({ status: 1 });
referralSchema.index({ lastActivity: -1 });

// Virtual for referral age
referralSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for is active
referralSchema.virtual('isActive').get(function() {
  return this.status === 'active' || this.status === 'completed';
});

// Method to mark as active
referralSchema.methods.markActive = function() {
  this.status = 'active';
  this.lastActivity = new Date();
  return this.save();
};

// Method to mark as completed
referralSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.lastActivity = new Date();
  return this.save();
};

// Method to add milestone
referralSchema.methods.addMilestone = function(milestone, bonusCredits = 0) {
  this.milestones.push({
    type: milestone,
    achievedAt: new Date(),
    bonusCredits
  });
  this.totalEarnings += bonusCredits;
  return this.save();
};

// Method to award bonus credits
referralSchema.methods.awardBonus = function(amount, type = 'task_completion') {
  this.bonusCredits += amount;
  this.totalEarnings += amount;
  this.bonusType = type;
  this.lastActivity = new Date();
  return this.save();
};

// Static method to get referrer's total earnings
referralSchema.statics.getReferrerEarnings = async function(referrerId) {
  const result = await this.aggregate([
    { $match: { referrer: mongoose.Types.ObjectId(referrerId) } },
    {
      $group: {
        _id: null,
        totalReferrals: { $sum: 1 },
        activeReferrals: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        completedReferrals: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalEarnings: { $sum: '$totalEarnings' },
        totalBonusCredits: { $sum: '$bonusCredits' }
      }
    }
  ]);
  
  return result.length > 0 ? result[0] : {
    totalReferrals: 0,
    activeReferrals: 0,
    completedReferrals: 0,
    totalEarnings: 0,
    totalBonusCredits: 0
  };
};

// Static method to get referral statistics
referralSchema.statics.getReferralStats = async function(referrerId, startDate, endDate) {
  const matchQuery = { referrer: mongoose.Types.ObjectId(referrerId) };
  
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
        totalEarnings: { $sum: '$totalEarnings' }
      }
    }
  ]);
  
  return stats;
};

// Static method to get top referrers
referralSchema.statics.getTopReferrers = async function(limit = 10, startDate, endDate) {
  const matchQuery = {};
  
  if (startDate && endDate) {
    matchQuery.createdAt = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  const topReferrers = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$referrer',
        totalReferrals: { $sum: 1 },
        totalEarnings: { $sum: '$totalEarnings' },
        activeReferrals: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        }
      }
    },
    { $sort: { totalEarnings: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'referrerInfo'
      }
    },
    {
      $project: {
        referrerId: '$_id',
        referrerName: { $arrayElemAt: ['$referrerInfo.firstName', 0] },
        referrerEmail: { $arrayElemAt: ['$referrerInfo.email', 0] },
        totalReferrals: 1,
        totalEarnings: 1,
        activeReferrals: 1
      }
    }
  ]);
  
  return topReferrers;
};

// Static method to check if referral is valid
referralSchema.statics.isValidReferral = async function(referralCode, referredUserId) {
  // Check if referral code exists
  const referrer = await mongoose.model('User').findOne({ referralCode });
  if (!referrer) return false;
  
  // If no referredUserId provided (e.g., during Google OAuth validation), just check if code exists
  if (!referredUserId) return true;
  
  // Check if user is already referred
  const existingReferral = await this.findOne({ referred: referredUserId });
  if (existingReferral) return false;
  
  // Check if user is trying to refer themselves
  if (referrer._id.toString() === referredUserId.toString()) return false;
  
  return true;
};

// Static method to create referral
referralSchema.statics.createReferral = async function(referralCode, referredUserId) {
  const referrer = await mongoose.model('User').findOne({ referralCode });
  if (!referrer) {
    throw new Error('Invalid referral code');
  }
  
  // Check if referral is valid
  const isValid = await this.isValidReferral(referralCode, referredUserId);
  if (!isValid) {
    throw new Error('Invalid referral or user already referred');
  }
  
  // Create referral record
  const referral = new this({
    referrer: referrer._id,
    referred: referredUserId,
    referralCode,
    status: 'pending',
    metadata: {
      signupSource: 'referral_code'
    }
  });
  
  await referral.save();
  
  // Award signup bonus to referrer
  const signupBonus = 10; // Base signup bonus
  await referral.awardBonus(signupBonus, 'signup');
  
  return referral;
};

module.exports = mongoose.model('Referral', referralSchema);
