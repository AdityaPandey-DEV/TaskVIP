const mongoose = require('mongoose');

const creditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: [
      'task_completion',
      'referral_bonus',
      'vip_purchase',
      'milestone_reward',
      'streak_bonus',
      'admin_adjustment',
      'redemption_refund'
    ],
    required: true
  },
  source: {
    type: String,
    enum: [
      'ad_watch',
      'offer_completion',
      'survey_completion',
      'app_install',
      'referral_signup',
      'referral_task',
      'vip_upgrade',
      'milestone',
      'streak',
      'admin',
      'refund'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'vested', 'available', 'redeemed', 'cancelled'],
    default: 'pending'
  },
  vestingSchedule: {
    immediate: {
      type: Number,
      default: 0
    },
    after1Day: {
      type: Number,
      default: 0
    },
    after7Days: {
      type: Number,
      default: 0
    },
    after30Days: {
      type: Number,
      default: 0
    }
  },
  vestingProgress: {
    immediate: {
      type: Number,
      default: 0
    },
    after1Day: {
      type: Number,
      default: 0
    },
    after7Days: {
      type: Number,
      default: 0
    },
    after30Days: {
      type: Number,
      default: 0
    }
  },
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  relatedReferral: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral',
    default: null
  },
  metadata: {
    adNetwork: String,
    offerId: String,
    completionTime: Date,
    verificationData: mongoose.Schema.Types.Mixed
  },
  isVested: {
    type: Boolean,
    default: false
  },
  vestedAt: {
    type: Date,
    default: null
  },
  redeemedAt: {
    type: Date,
    default: null
  },
  redeemedAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
creditSchema.index({ userId: 1, createdAt: -1 });
creditSchema.index({ type: 1, status: 1 });
creditSchema.index({ source: 1 });
creditSchema.index({ isVested: 1, vestedAt: 1 });

// Virtual for total vested amount
creditSchema.virtual('totalVested').get(function() {
  return this.vestingProgress.immediate + 
         this.vestingProgress.after1Day + 
         this.vestingProgress.after7Days + 
         this.vestingProgress.after30Days;
});

// Virtual for remaining vesting amount
creditSchema.virtual('remainingVesting').get(function() {
  return this.amount - this.totalVested;
});

// Method to check if credit is fully vested
creditSchema.methods.isFullyVested = function() {
  return this.totalVested >= this.amount;
};

// Method to get available amount for redemption
creditSchema.methods.getAvailableAmount = function() {
  if (this.status === 'redeemed') return 0;
  return this.totalVested - this.redeemedAmount;
};

// Method to process vesting
creditSchema.methods.processVesting = function() {
  const now = new Date();
  const createdAt = new Date(this.createdAt);
  
  // Calculate time differences
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  let totalVested = 0;
  
  // Immediate vesting
  if (this.vestingSchedule.immediate > 0) {
    this.vestingProgress.immediate = this.vestingSchedule.immediate;
    totalVested += this.vestingSchedule.immediate;
  }
  
  // 1 day vesting
  if (createdAt <= oneDayAgo && this.vestingSchedule.after1Day > 0) {
    this.vestingProgress.after1Day = this.vestingSchedule.after1Day;
    totalVested += this.vestingSchedule.after1Day;
  }
  
  // 7 days vesting
  if (createdAt <= sevenDaysAgo && this.vestingSchedule.after7Days > 0) {
    this.vestingProgress.after7Days = this.vestingSchedule.after7Days;
    totalVested += this.vestingSchedule.after7Days;
  }
  
  // 30 days vesting
  if (createdAt <= thirtyDaysAgo && this.vestingSchedule.after30Days > 0) {
    this.vestingProgress.after30Days = this.vestingSchedule.after30Days;
    totalVested += this.vestingSchedule.after30Days;
  }
  
  // Update status if fully vested
  if (totalVested >= this.amount) {
    this.isVested = true;
    this.vestedAt = now;
    this.status = 'vested';
  }
  
  return totalVested;
};

// Static method to get user's total available credits
creditSchema.statics.getUserAvailableCredits = async function(userId) {
  const credits = await this.find({
    userId,
    status: { $in: ['vested', 'available'] }
  });
  
  return credits.reduce((total, credit) => {
    return total + credit.getAvailableAmount();
  }, 0);
};

// Static method to get user's total credits (all time)
creditSchema.statics.getUserTotalCredits = async function(userId) {
  const result = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  return result.length > 0 ? result[0].total : 0;
};

module.exports = mongoose.model('Credit', creditSchema);
