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
    required: false,
    default: '',
    trim: true
  },
  referralCode: {
    type: String,
    unique: true,
    required: false // Generated automatically in pre-save hook
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
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isAdmin: {
    type: Boolean,
    default: false
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
  coinBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  balance: {
    type: Number,
    default: 0,
    get: function() {
      return Math.floor((this.coinBalance || 0) / 10);
    }
  },
  withdrawableCredits: {
    type: Number,
    default: 0
  },
  dailyCreditsEarned: {
    type: Number,
    default: 0
  },
  
  // === COMPREHENSIVE STATS FIELDS ===
  
  // Referral Tracking
  level1ReferralUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  level2ReferralUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  level3ReferralUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Task & Activity Stats
  totalTasksAssigned: {
    type: Number,
    default: 0
  },
  totalTasksCompleted: {
    type: Number,
    default: 0
  },
  daysActive: {
    type: Number,
    default: 0
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date,
    default: null
  },
  
  // Financial Stats
  totalWithdrawn: {
    type: Number,
    default: 0
  },
  dailyProgress: {
    type: Number,
    default: 0 // Percentage (0-100)
  },
  
  // Calculated Fields (for easy access)
  creditsReady: {
    type: Number,
    default: 0 // Current available balance
  },
  totalEarned: {
    type: Number,
    default: 0 // creditsReady + totalWithdrawn
  },
  
  // Referral Stats
  totalDirectReferrals: {
    type: Number,
    default: 0
  },
  totalIndirectReferrals: {
    type: Number,
    default: 0
  },
  totalDeepReferrals: {
    type: Number,
    default: 0
  },
  totalReferralEarnings: {
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

// Generate referral code based on email
userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    // Generate referral code from email
    const emailHash = require('crypto').createHash('md5').update(this.email).digest('hex');
    this.referralCode = emailHash.slice(0, 8).toUpperCase();
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
        password: 'system123456', // This will be hashed
        referralCode: '0000',
        vipLevel: 3, // Max VIP level
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

// Method to migrate old balance fields to coinBalance
userSchema.methods.migrateToCoinBalance = function() {
  // If coinBalance is 0 but availableCredits or creditsReady has value, migrate
  if (this.coinBalance === 0 || this.coinBalance === undefined) {
    const availableBalance = this.availableCredits || this.creditsReady || 0;
    if (availableBalance > 0) {
      this.coinBalance = availableBalance;
      console.log(`Migrated balance for user ${this._id}: ${availableBalance} -> coinBalance`);
    }
  }
  return this;
};

// Method to get balance in rupees
userSchema.methods.getBalanceInRupees = function() {
  return Math.floor((this.coinBalance || 0) / 10);
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
    this.dailyProgress = 0;
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
    this.dailyProgress = 0;
    this.lastDailyReset = today;
    this.save();
  }
  
  return this.dailyCreditsEarned >= this.getMaxDailyEarning();
};

// Method to get daily credit limit (alias for getMaxDailyEarning)
userSchema.methods.getDailyCreditLimit = function() {
  return this.getMaxDailyEarning();
};

// Method to check if user has reached daily credit limit (alias for hasReachedDailyEarningLimit)
userSchema.methods.hasReachedDailyLimit = function() {
  return this.hasReachedDailyEarningLimit();
};

// === COMPREHENSIVE STATS UPDATE METHODS ===

// Update user stats when earning credits/coins
userSchema.methods.updateEarningStats = function(amount, source = 'task') {
  this.creditsReady += amount;
  this.totalEarned = this.creditsReady + this.totalWithdrawn;
  this.dailyCreditsEarned += amount;
  
  // Update daily progress
  const dailyLimit = this.getDailyCreditLimit();
  this.dailyProgress = Math.min((this.dailyCreditsEarned / dailyLimit) * 100, 100);
  
  // Update activity tracking
  this.updateActivityStats();
  
  return this.save();
};

// Update user stats when withdrawing
userSchema.methods.updateWithdrawalStats = function(amount) {
  this.creditsReady -= amount;
  this.totalWithdrawn += amount;
  // totalEarned stays the same (creditsReady + totalWithdrawn)
  
  return this.save();
};

// Update activity stats (streak, days active)
userSchema.methods.updateActivityStats = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActive = this.lastActiveDate ? new Date(this.lastActiveDate) : null;
  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
  }
  
  // Check if this is a new day of activity
  if (!lastActive || lastActive.getTime() !== today.getTime()) {
    this.daysActive += 1;
    
    // Update streak
    if (lastActive) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastActive.getTime() === yesterday.getTime()) {
        // Consecutive day - increment streak
        this.currentStreak += 1;
      } else {
        // Gap in activity - reset streak
        this.currentStreak = 1;
      }
    } else {
      // First day active
      this.currentStreak = 1;
    }
    
    this.lastActiveDate = today;
  }
};

// Ensure all user stats are properly initialized
userSchema.methods.ensureStatsInitialized = function() {
  let needsSave = false;
  
  // Initialize financial stats
  if (this.creditsReady === undefined || this.creditsReady === null) {
    this.creditsReady = this.coinBalance || 0;
    needsSave = true;
  }
  
  if (this.totalEarned === undefined || this.totalEarned === null) {
    this.totalEarned = this.totalCredits || 0;
    needsSave = true;
  }
  
  // Initialize activity stats
  if (this.daysActive === undefined || this.daysActive === null) {
    this.daysActive = 1;
    needsSave = true;
  }
  
  if (this.currentStreak === undefined || this.currentStreak === null) {
    this.currentStreak = 1;
    needsSave = true;
  }
  
  if (this.dailyProgress === undefined || this.dailyProgress === null) {
    this.dailyProgress = 0;
    needsSave = true;
  }
  
  // Initialize task stats
  if (this.totalTasksAssigned === undefined || this.totalTasksAssigned === null) {
    this.totalTasksAssigned = 0;
    needsSave = true;
  }
  
  if (this.totalTasksCompleted === undefined || this.totalTasksCompleted === null) {
    this.totalTasksCompleted = 0;
    needsSave = true;
  }
  
  // Initialize referral stats
  if (this.totalDirectReferrals === undefined || this.totalDirectReferrals === null) {
    this.totalDirectReferrals = 0;
    needsSave = true;
  }
  
  if (this.totalReferralEarnings === undefined || this.totalReferralEarnings === null) {
    this.totalReferralEarnings = 0;
    needsSave = true;
  }
  
  return needsSave;
};

// Update user stats when they earn credits or complete tasks
userSchema.methods.updateUserStats = function(creditsEarned = 0, tasksCompleted = 0) {
  // Update financial stats
  if (creditsEarned > 0) {
    this.creditsReady += creditsEarned;
    this.totalEarned += creditsEarned;
    this.coinBalance += creditsEarned;
    this.dailyCreditsEarned += creditsEarned;
    
    // Update daily progress
    const dailyLimit = this.getDailyCreditLimit();
    this.dailyProgress = dailyLimit > 0 ? Math.min((this.dailyCreditsEarned / dailyLimit) * 100, 100) : 0;
  }
  
  // Update task stats
  if (tasksCompleted > 0) {
    this.totalTasksCompleted += tasksCompleted;
  }
  
  // Update activity stats
  this.updateActivityStats();
  
  return this.save();
};

// Update task completion stats
userSchema.methods.updateTaskStats = function(assigned = 0, completed = 0) {
  this.totalTasksAssigned += assigned;
  this.totalTasksCompleted += completed;
  
  return this.save();
};

// Update referral stats
userSchema.methods.updateReferralStats = function(level, earnings = 0) {
  switch (level) {
    case 1:
      this.totalDirectReferrals += 1;
      break;
    case 2:
      this.totalIndirectReferrals += 1;
      break;
    case 3:
      this.totalDeepReferrals += 1;
      break;
  }
  
  if (earnings > 0) {
    this.totalReferralEarnings += earnings;
  }
  
  return this.save();
};

// Set referral chain (when user signs up with referral code)
userSchema.methods.setReferralChain = async function(referralCode) {
  const referrer = await this.constructor.findOne({ referralCode });
  if (!referrer) return false;
  
  // Set level 1 referrer
  this.level1ReferralUserId = referrer._id;
  
  // Set level 2 referrer (referrer's level 1)
  if (referrer.level1ReferralUserId) {
    this.level2ReferralUserId = referrer.level1ReferralUserId;
    
    // Set level 3 referrer (referrer's level 2)
    if (referrer.level2ReferralUserId) {
      this.level3ReferralUserId = referrer.level2ReferralUserId;
    }
  }
  
  await this.save();
  
  // Update referrer's stats
  await referrer.updateReferralStats(1);
  
  // Update level 2 referrer's stats
  if (this.level2ReferralUserId) {
    const level2Referrer = await this.constructor.findById(this.level2ReferralUserId);
    if (level2Referrer) {
      await level2Referrer.updateReferralStats(2);
    }
  }
  
  // Update level 3 referrer's stats
  if (this.level3ReferralUserId) {
    const level3Referrer = await this.constructor.findById(this.level3ReferralUserId);
    if (level3Referrer) {
      await level3Referrer.updateReferralStats(3);
    }
  }
  
  return true;
};

// Check if user is admin
userSchema.methods.isAdminUser = function() {
  return this.role === 'admin' || this.isAdmin === true;
};

// Get comprehensive dashboard stats (directly from user model)
userSchema.methods.getDashboardStats = function() {
  return {
    // VIP Info
    vipLevel: this.vipLevel,
    isVipActive: this.isVipActive,
    
    // Financial Stats
    creditsReady: this.creditsReady,
    totalEarned: this.totalEarned,
    totalWithdrawn: this.totalWithdrawn,
    coinBalance: this.coinBalance,
    
    // Daily Stats
    dailyCreditsEarned: this.dailyCreditsEarned,
    dailyCreditLimit: this.getDailyCreditLimit(),
    dailyProgress: this.dailyProgress,
    
    // Activity Stats
    daysActive: this.daysActive,
    currentStreak: this.currentStreak,
    
    // Task Stats
    totalTasksAssigned: this.totalTasksAssigned,
    totalTasksCompleted: this.totalTasksCompleted,
    
    // Referral Stats
    totalDirectReferrals: this.totalDirectReferrals,
    totalIndirectReferrals: this.totalIndirectReferrals,
    totalDeepReferrals: this.totalDeepReferrals,
    totalReferralEarnings: this.totalReferralEarnings,
    
    // Referral Chain
    level1ReferralUserId: this.level1ReferralUserId,
    level2ReferralUserId: this.level2ReferralUserId,
    level3ReferralUserId: this.level3ReferralUserId
  };
};

module.exports = mongoose.model('User', userSchema);
