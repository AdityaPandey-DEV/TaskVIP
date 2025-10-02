const mongoose = require('mongoose');

const appInstallSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appId: {
    type: String,
    required: true
  },
  appName: {
    type: String,
    required: true
  },
  appPackage: {
    type: String,
    required: true
  },
  appIcon: {
    type: String,
    required: true
  },
  appDescription: {
    type: String,
    required: true
  },
  appCategory: {
    type: String,
    enum: ['games', 'social', 'productivity', 'entertainment', 'shopping', 'finance', 'health', 'education', 'travel', 'other'],
    default: 'other'
  },
  appRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 4.0
  },
  appSize: {
    type: String, // e.g., "25.4 MB"
    required: true
  },
  platform: {
    type: String,
    enum: ['android', 'ios', 'both'],
    default: 'android'
  },
  downloadUrl: {
    android: String,
    ios: String
  },
  rewardCoins: {
    type: Number,
    required: true,
    min: 10
  },
  requiredActions: [{
    type: String,
    enum: ['install', 'open', 'register', 'level_up', 'purchase', 'use_for_days'],
    default: ['install', 'open']
  }],
  timeRequirements: {
    installTime: {
      type: Number, // seconds to wait after install
      default: 30
    },
    openTime: {
      type: Number, // seconds to keep app open
      default: 60
    },
    usageDays: {
      type: Number, // days to use app
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['pending', 'installed', 'opened', 'completed', 'failed', 'expired'],
    default: 'pending'
  },
  installStartTime: {
    type: Date,
    default: null
  },
  installCompleteTime: {
    type: Date,
    default: null
  },
  openTime: {
    type: Date,
    default: null
  },
  completionTime: {
    type: Date,
    default: null
  },
  verificationData: {
    deviceId: String,
    installationId: String,
    packageVerified: Boolean,
    screenTimeVerified: Boolean,
    networkProvider: String, // AdGate, CPALead, etc.
    externalId: String
  },
  failureReason: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
  },
  coinTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coin',
    default: null
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String,
    sessionId: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
appInstallSchema.index({ userId: 1, createdAt: -1 });
appInstallSchema.index({ appId: 1 });
appInstallSchema.index({ status: 1 });
appInstallSchema.index({ platform: 1 });
appInstallSchema.index({ appCategory: 1 });
appInstallSchema.index({ expiresAt: 1 });

// Virtual for time remaining
appInstallSchema.virtual('timeRemaining').get(function() {
  if (this.status === 'completed' || this.status === 'failed') return 0;
  return Math.max(0, this.expiresAt.getTime() - Date.now());
});

// Virtual for is expired
appInstallSchema.virtual('isExpired').get(function() {
  return this.expiresAt.getTime() < Date.now();
});

// Method to mark as installed
appInstallSchema.methods.markInstalled = function(verificationData = {}) {
  this.status = 'installed';
  this.installCompleteTime = new Date();
  this.verificationData = { ...this.verificationData, ...verificationData };
  return this.save();
};

// Method to mark as opened
appInstallSchema.methods.markOpened = function() {
  if (this.status !== 'installed') {
    throw new Error('App must be installed before it can be opened');
  }
  this.status = 'opened';
  this.openTime = new Date();
  return this.save();
};

// Method to mark as completed and award coins
appInstallSchema.methods.markCompleted = async function() {
  if (this.status !== 'opened') {
    throw new Error('App must be opened before completion');
  }
  
  this.status = 'completed';
  this.completionTime = new Date();
  
  // Award coins to user
  const User = mongoose.model('User');
  const Coin = mongoose.model('Coin');
  
  // Update user coin balance
  await User.findByIdAndUpdate(this.userId, {
    $inc: { coinBalance: this.rewardCoins }
  });
  
  // Create coin transaction record
  const coinTransaction = new Coin({
    userId: this.userId,
    amount: this.rewardCoins,
    type: 'earned',
    source: 'app_install',
    description: `App install reward - ${this.appName}`,
    status: 'completed',
    metadata: {
      appId: this.appId,
      appName: this.appName,
      installId: this._id,
      verificationData: this.verificationData
    }
  });
  
  await coinTransaction.save();
  this.coinTransaction = coinTransaction._id;
  
  return this.save();
};

// Method to mark as failed
appInstallSchema.methods.markFailed = function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  return this.save();
};

// Static method to get available apps for user
appInstallSchema.statics.getAvailableApps = async function(userId, platform = 'android', category = 'all', limit = 20) {
  const user = await mongoose.model('User').findById(userId);
  if (!user) throw new Error('User not found');
  
  // Find apps user hasn't completed or has pending
  const completedAppIds = await this.find({
    userId,
    status: { $in: ['completed', 'pending', 'installed', 'opened'] }
  }).distinct('appId');
  
  // Build query
  const query = {
    appId: { $nin: completedAppIds },
    platform: { $in: [platform, 'both'] },
    status: 'active'
  };
  
  if (category !== 'all') {
    query.appCategory = category;
  }
  
  // Sample available apps (in real implementation, this would come from your app database)
  const sampleApps = await this.aggregate([
    { $match: query },
    { $sample: { size: limit } },
    {
      $project: {
        appId: 1,
        appName: 1,
        appPackage: 1,
        appIcon: 1,
        appDescription: 1,
        appCategory: 1,
        appRating: 1,
        appSize: 1,
        platform: 1,
        rewardCoins: 1,
        requiredActions: 1,
        timeRequirements: 1
      }
    }
  ]);
  
  return sampleApps;
};

// Static method to create app install task
appInstallSchema.statics.createInstallTask = async function(userId, appData, metadata = {}) {
  const existingTask = await this.findOne({
    userId,
    appId: appData.appId,
    status: { $in: ['pending', 'installed', 'opened'] }
  });
  
  if (existingTask) {
    throw new Error('App install task already exists for this user');
  }
  
  const installTask = new this({
    userId,
    ...appData,
    installStartTime: new Date(),
    metadata
  });
  
  return installTask.save();
};

// Static method to get user's install history
appInstallSchema.statics.getUserInstallHistory = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const installs = await this.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('appName appIcon appCategory rewardCoins status createdAt completionTime');
  
  const total = await this.countDocuments({ userId });
  
  return {
    installs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get install statistics
appInstallSchema.statics.getInstallStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalCoins: { $sum: '$rewardCoins' }
      }
    }
  ]);
  
  const summary = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalInstalls: { $sum: 1 },
        completedInstalls: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalCoinsEarned: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$rewardCoins', 0] }
        },
        pendingInstalls: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return {
    byStatus: stats,
    summary: summary.length > 0 ? summary[0] : {
      totalInstalls: 0,
      completedInstalls: 0,
      totalCoinsEarned: 0,
      pendingInstalls: 0
    }
  };
};

// Static method to cleanup expired tasks
appInstallSchema.statics.cleanupExpiredTasks = async function() {
  const result = await this.updateMany(
    {
      status: { $in: ['pending', 'installed', 'opened'] },
      expiresAt: { $lt: new Date() }
    },
    {
      $set: {
        status: 'expired',
        failureReason: 'Task expired'
      }
    }
  );
  
  return result;
};

module.exports = mongoose.model('AppInstall', appInstallSchema);
