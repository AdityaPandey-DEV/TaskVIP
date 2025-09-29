const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'ad_watch',
      'offer_completion',
      'survey_completion',
      'app_install',
      'daily_checkin',
      'referral_task'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reward: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'verified', 'failed', 'expired'],
    default: 'pending'
  },
  adNetwork: {
    type: String,
    enum: ['propellerads', 'adsterra', 'adgate', 'adscend', 'internal'],
    default: 'internal'
  },
  networkData: {
    offerId: String,
    campaignId: String,
    transactionId: String,
    verificationUrl: String,
    callbackUrl: String
  },
  completionData: {
    completedAt: Date,
    verificationData: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    deviceId: String
  },
  verificationStatus: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verificationMethod: String,
    verificationData: mongoose.Schema.Types.Mixed
  },
  creditAwarded: {
    type: Number,
    default: 0
  },
  creditId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Credit',
    default: null
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
  },
  isDailyTask: {
    type: Boolean,
    default: true
  },
  taskDate: {
    type: Date,
    default: Date.now
  },
  metadata: {
    category: String,
    difficulty: String,
    estimatedTime: Number, // in minutes
    requirements: [String],
    tags: [String]
  }
}, {
  timestamps: true
});

// Indexes for better performance
taskSchema.index({ userId: 1, taskDate: -1 });
taskSchema.index({ type: 1, status: 1 });
taskSchema.index({ adNetwork: 1 });
taskSchema.index({ expiresAt: 1 });
taskSchema.index({ isDailyTask: 1, taskDate: 1 });

// Virtual for task age
taskSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for is expired
taskSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Method to mark as completed
taskSchema.methods.markCompleted = function(completionData) {
  this.status = 'completed';
  this.completionData = {
    ...completionData,
    completedAt: new Date()
  };
  return this.save();
};

// Method to mark as verified
taskSchema.methods.markVerified = function(verificationData) {
  this.status = 'verified';
  this.verificationStatus = {
    isVerified: true,
    verifiedAt: new Date(),
    verificationMethod: 'server_verification',
    verificationData
  };
  return this.save();
};

// Method to mark as failed
taskSchema.methods.markFailed = function(reason) {
  this.status = 'failed';
  this.completionData = {
    ...this.completionData,
    failureReason: reason,
    failedAt: new Date()
  };
  return this.save();
};

// Static method to get daily tasks for user
taskSchema.statics.getDailyTasks = async function(userId, date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return await this.find({
    userId,
    isDailyTask: true,
    taskDate: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $in: ['pending', 'completed', 'verified'] }
  });
};

// Static method to create daily tasks
taskSchema.statics.createDailyTasks = async function(userId) {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  
  // Check if daily tasks already exist
  const existingTasks = await this.getDailyTasks(userId, today);
  if (existingTasks.length > 0) {
    return existingTasks;
  }
  
  // Create default daily tasks
  const dailyTasks = [
    {
      userId,
      type: 'ad_watch',
      title: 'Watch 5 Video Ads',
      description: 'Watch 5 short video advertisements to earn credits',
      reward: 10,
      adNetwork: 'internal',
      isDailyTask: true,
      taskDate: startOfDay,
      metadata: {
        category: 'advertising',
        difficulty: 'easy',
        estimatedTime: 5,
        requirements: ['stable_internet'],
        tags: ['video', 'ads', 'daily']
      }
    },
    {
      userId,
      type: 'offer_completion',
      title: 'Complete 1 Offer',
      description: 'Complete any available offer from our partners',
      reward: 25,
      adNetwork: 'adgate',
      isDailyTask: true,
      taskDate: startOfDay,
      metadata: {
        category: 'offers',
        difficulty: 'medium',
        estimatedTime: 10,
        requirements: ['offer_completion'],
        tags: ['offers', 'partners', 'daily']
      }
    },
    {
      userId,
      type: 'daily_checkin',
      title: 'Daily Check-in',
      description: 'Check in daily to maintain your streak',
      reward: 5,
      adNetwork: 'internal',
      isDailyTask: true,
      taskDate: startOfDay,
      metadata: {
        category: 'engagement',
        difficulty: 'easy',
        estimatedTime: 1,
        requirements: ['login'],
        tags: ['checkin', 'streak', 'daily']
      }
    }
  ];
  
  return await this.insertMany(dailyTasks);
};

// Static method to get task statistics
taskSchema.statics.getTaskStats = async function(userId, startDate, endDate) {
  const matchQuery = { userId };
  
  if (startDate && endDate) {
    matchQuery.taskDate = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        verifiedTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
        },
        totalRewards: { $sum: '$reward' },
        totalCreditsEarned: { $sum: '$creditAwarded' }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : {
    totalTasks: 0,
    completedTasks: 0,
    verifiedTasks: 0,
    totalRewards: 0,
    totalCreditsEarned: 0
  };
};

module.exports = mongoose.model('Task', taskSchema);
