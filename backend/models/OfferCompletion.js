const mongoose = require('mongoose');

const offerCompletionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    required: true
  },
  status: {
    type: String,
    enum: ['started', 'pending', 'completed', 'failed', 'reversed'],
    default: 'started'
  },
  coinsEarned: {
    type: Number,
    default: 0
  },
  network: {
    type: String,
    enum: ['admob', 'cpalead', 'adgate', 'adscend', 'ayetstudios', 'offertoro'],
    required: true
  },
  externalTransactionId: String, // ID from ad network
  clickId: String,               // Unique click tracking ID
  conversionData: {
    startedAt: Date,
    completedAt: Date,
    verifiedAt: Date,
    ipAddress: String,
    userAgent: String,
    deviceId: String,
    referrer: String
  },
  fraudCheck: {
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    flags: [String],
    verified: {
      type: Boolean,
      default: false
    }
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String,
  adminNotes: String,
  reversalReason: String
}, {
  timestamps: true
});

// Indexes
offerCompletionSchema.index({ userId: 1, createdAt: -1 });
offerCompletionSchema.index({ offerId: 1, status: 1 });
offerCompletionSchema.index({ network: 1, status: 1 });
offerCompletionSchema.index({ externalTransactionId: 1 });
offerCompletionSchema.index({ clickId: 1 });
offerCompletionSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware to update completion timestamp
offerCompletionSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.conversionData.completedAt) {
    this.conversionData.completedAt = new Date();
  }
  next();
});

// Static method to start offer
offerCompletionSchema.statics.startOffer = async function(userId, offerId, metadata = {}) {
  const Offer = mongoose.model('Offer');
  const User = mongoose.model('User');
  
  const offer = await Offer.findById(offerId);
  if (!offer || !offer.isActive) {
    throw new Error('Offer not found or inactive');
  }
  
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Check if user can access this offer
  if (offer.requirements.vipOnly && user.vipLevel === 0) {
    throw new Error('VIP membership required for this offer');
  }
  
  // Check user limit
  if (offer.userLimit > 0) {
    const completedCount = await this.countDocuments({
      userId,
      offerId,
      status: 'completed'
    });
    
    if (completedCount >= offer.userLimit) {
      throw new Error('You have already completed this offer');
    }
  }
  
  // Check daily limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayCompletions = await this.countDocuments({
    offerId,
    status: 'completed',
    createdAt: { $gte: today }
  });
  
  if (todayCompletions >= offer.dailyLimit) {
    throw new Error('Daily limit reached for this offer');
  }
  
  // Generate unique click ID
  const clickId = `${userId}_${offerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const completion = new this({
    userId,
    offerId,
    network: offer.network,
    clickId,
    conversionData: {
      startedAt: new Date(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      deviceId: metadata.deviceId,
      referrer: metadata.referrer
    }
  });
  
  await completion.save();
  return completion;
};

// Static method to complete offer
offerCompletionSchema.statics.completeOffer = async function(completionId, coinsEarned, externalTransactionId = null) {
  const completion = await this.findById(completionId).populate('offerId userId');
  if (!completion) {
    throw new Error('Completion record not found');
  }
  
  if (completion.status !== 'started' && completion.status !== 'pending') {
    throw new Error('Offer already completed or failed');
  }
  
  // Calculate fraud score
  const fraudScore = await this.calculateFraudScore(completion);
  
  completion.status = fraudScore > 70 ? 'pending' : 'completed';
  completion.coinsEarned = coinsEarned;
  completion.externalTransactionId = externalTransactionId;
  completion.fraudCheck.score = fraudScore;
  completion.fraudCheck.verified = fraudScore <= 70;
  
  if (fraudScore > 70) {
    completion.fraudCheck.flags.push('high_fraud_score');
  }
  
  await completion.save();
  
  // Award coins if not flagged as fraud
  if (fraudScore <= 70) {
    const CoinTransaction = mongoose.model('CoinTransaction');
    await CoinTransaction.createReward(
      completion.userId._id,
      this.getRewardType(completion.network),
      coinsEarned,
      `Completed: ${completion.offerId.title}`,
      {
        adNetwork: completion.network,
        offerId: completion.offerId._id,
        offerName: completion.offerId.title,
        completionId: completion._id,
        externalTransactionId
      }
    );
  }
  
  return completion;
};

// Static method to calculate fraud score
offerCompletionSchema.statics.calculateFraudScore = async function(completion) {
  let score = 0;
  
  // Check completion time (too fast = suspicious)
  const completionTime = new Date() - completion.conversionData.startedAt;
  const minTime = completion.offerId.estimatedTime * 60 * 1000; // Convert to milliseconds
  
  if (completionTime < minTime * 0.3) score += 40; // Completed too fast
  if (completionTime < minTime * 0.1) score += 60; // Way too fast
  
  // Check user's recent activity
  const recentCompletions = await this.countDocuments({
    userId: completion.userId,
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
    status: 'completed'
  });
  
  if (recentCompletions > 10) score += 30; // Too many completions
  
  // Check device/IP patterns
  const sameDeviceCompletions = await this.countDocuments({
    'conversionData.deviceId': completion.conversionData.deviceId,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    status: 'completed'
  });
  
  if (sameDeviceCompletions > 50) score += 25; // Too many from same device
  
  return Math.min(score, 100);
};

// Static method to get reward type based on network
offerCompletionSchema.statics.getRewardType = function(network) {
  const typeMap = {
    'admob': 'earned_admob_video',
    'cpalead': 'earned_cpalead_offer',
    'adgate': 'earned_adgate_offer',
    'adscend': 'earned_adscend_offer',
    'ayetstudios': 'earned_ayet_offer',
    'offertoro': 'earned_offertoro_offer'
  };
  
  return typeMap[network] || 'earned_cpalead_offer';
};

module.exports = mongoose.model('OfferCompletion', offerCompletionSchema);
