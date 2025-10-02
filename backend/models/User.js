const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  referralCode: {
    type: String,
    unique: true,
    required: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userType: {
    type: String,
    enum: ['trial', 'free', 'vip'],
    default: 'trial'
  },
  trialExpiry: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
    }
  },
  vipLevel: {
    type: Number,
    enum: [0, 1, 2, 3],
    default: 0
  },
  vipExpiry: {
    type: Date,
    default: null
  },
  totalCredits: {
    type: Number,
    default: 0
  },
  availableCredits: {
    type: Number,
    default: 0
  },
  withdrawableCredits: {
    type: Number,
    default: 0
  },
  dailyCreditsEarned: {
    type: Number,
    default: 0
  },
  dailyAdsWatched: {
    type: Number,
    default: 0
  },
  lastDailyReset: {
    type: Date,
    default: Date.now
  },
  trialRewardClaimed: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerifiedAt: {
    type: Date,
    default: null
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  kycVerifiedAt: {
    type: Date,
    default: null
  },
  kycDocuments: {
    aadhar: String,
    pan: String,
    bankAccount: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  streak: {
    type: Number,
    default: 0
  },
  lastTaskDate: {
    type: Date
  },
  badges: [{
    type: String,
    enum: ['first_task', 'week_streak', 'month_streak', 'vip_upgrade', 'referral_master', 'credit_earner']
  }],
  deviceInfo: {
    ip: String,
    userAgent: String,
    deviceId: String
  }
}, {
  timestamps: true
});

// Indexes for better performance (email and referralCode already have unique indexes)
userSchema.index({ referredBy: 1 });
userSchema.index({ vipLevel: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate referral code
userSchema.pre('save', function(next) {
  if (this.isNew && !this.referralCode) {
    this.referralCode = this._id.toString().slice(-8).toUpperCase();
  }
  next();
});

// Static method to ensure default referral user exists
userSchema.statics.ensureDefaultReferralUser = async function() {
  try {
    const defaultUser = await this.findOne({ referralCode: '0000' });
    if (!defaultUser) {
      console.log('Creating default referral user with code 0000...');
      const defaultReferralUser = new this({
        firstName: 'TaskVIP',
        lastName: 'System',
        email: 'system@taskvip.com',
        phone: '+919999999999',
        password: 'system123456', // This will be hashed
        referralCode: '0000',
        vipLevel: 5, // Max VIP level
        isEmailVerified: true,
        totalCredits: 0,
        availableCredits: 0
      });
      await defaultReferralUser.save();
      console.log('Default referral user created successfully');
    }
  } catch (error) {
    console.error('Error creating default referral user:', error);
  }
};

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Get VIP benefits
userSchema.methods.getVipBenefits = function() {
  const vipBenefits = {
    0: { 
      dailyAdsLimit: 10, 
      perAdReward: 1, 
      maxDailyEarning: 10, 
      referralBonus: 0, 
      name: 'Free',
      price: 0
    },
    1: { 
      dailyAdsLimit: 20, 
      perAdReward: 1.5, 
      maxDailyEarning: 30, 
      referralBonus: 10, 
      name: 'VIP 1', 
      price: 300,
      monthlyEarning: 900
    },
    2: { 
      dailyAdsLimit: 50, 
      perAdReward: 2.0, 
      maxDailyEarning: 100, 
      referralBonus: 10, 
      name: 'VIP 2', 
      price: 600,
      monthlyEarning: 3000
    },
    3: { 
      dailyAdsLimit: 100, 
      perAdReward: 2.5, 
      maxDailyEarning: 250, 
      referralBonus: 10, 
      name: 'VIP 3', 
      price: 1000,
      monthlyEarning: 7500
    }
  };
  
  return vipBenefits[this.vipLevel] || vipBenefits[0];
};

// Check if VIP is active
userSchema.methods.isVipActive = function() {
  return this.vipLevel > 0 && this.vipExpiry && this.vipExpiry > new Date();
};

// Get daily ads limit
userSchema.methods.getDailyAdsLimit = function() {
  const benefits = this.getVipBenefits();
  return benefits.dailyAdsLimit;
};

// Get per ad reward
userSchema.methods.getPerAdReward = function() {
  const benefits = this.getVipBenefits();
  return benefits.perAdReward;
};

// Get max daily earning
userSchema.methods.getMaxDailyEarning = function() {
  const benefits = this.getVipBenefits();
  return benefits.maxDailyEarning;
};

// Check if user is in trial period
userSchema.methods.isTrialActive = function() {
  return this.userType === 'trial' && this.trialExpiry && this.trialExpiry > new Date();
};

// Check if user is free (not trial, not VIP)
userSchema.methods.isFreeUser = function() {
  return this.userType === 'free' && !this.isVipActive();
};

// Update user type based on current status
userSchema.methods.updateUserType = function() {
  if (this.isVipActive()) {
    this.userType = 'vip';
  } else if (this.isTrialActive()) {
    this.userType = 'trial';
  } else {
    this.userType = 'free';
  }
  return this.save();
};

// Check if daily ads limit reached
userSchema.methods.hasReachedDailyAdsLimit = function() {
  const today = new Date();
  const lastReset = new Date(this.lastDailyReset);
  
  // Reset daily ads if it's a new day
  if (today.toDateString() !== lastReset.toDateString()) {
    this.dailyAdsWatched = 0;
    this.dailyCreditsEarned = 0;
    this.lastDailyReset = today;
    this.save();
  }
  
  return this.dailyAdsWatched >= this.getDailyAdsLimit();
};

// Check if daily earning limit reached
userSchema.methods.hasReachedDailyEarningLimit = function() {
  const today = new Date();
  const lastReset = new Date(this.lastDailyReset);
  
  // Reset daily credits if it's a new day
  if (today.toDateString() !== lastReset.toDateString()) {
    this.dailyCreditsEarned = 0;
    this.dailyAdsWatched = 0;
    this.lastDailyReset = today;
    this.save();
  }
  
  return this.dailyCreditsEarned >= this.getMaxDailyEarning();
};

module.exports = mongoose.model('User', userSchema);
