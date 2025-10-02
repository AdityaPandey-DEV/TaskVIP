const mongoose = require('mongoose');

const coinTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'earned_admob_video',      // 5 coins - AdMob rewarded video
      'earned_cpalead_offer',    // 50-500 coins - CPALead offer
      'earned_adgate_offer',     // 50-500 coins - AdGate offer
      'earned_survey',           // 20-100 coins - Survey completion
      'earned_app_install',      // 30-200 coins - App installation
      'earned_referral_bonus',   // 25 coins - Referral bonus
      'earned_daily_bonus',      // 10 coins - Daily login bonus
      'earned_streak_bonus',     // 5-50 coins - Login streak bonus
      'spent_withdrawal',        // Withdrawal to cash
      'spent_vip_upgrade',       // VIP membership purchase
      'spent_boost',             // Ad boost purchase
      'refund',                  // Refunded coins
      'admin_adjustment'         // Manual admin adjustment
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    adNetwork: String,           // 'admob', 'cpalead', 'adgate', etc.
    offerId: String,             // External offer ID
    offerName: String,           // Offer/task name
    adUnitId: String,            // AdMob ad unit ID
    conversionRate: Number,      // Coins per dollar/rupee
    ipAddress: String,
    userAgent: String,
    deviceId: String,
    fraudScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'reversed'],
    default: 'completed'
  },
  externalTransactionId: String, // ID from ad network
  processingTime: {
    type: Number,
    default: 0 // milliseconds
  }
}, {
  timestamps: true
});

// Indexes for better performance
coinTransactionSchema.index({ userId: 1, createdAt: -1 });
coinTransactionSchema.index({ type: 1, status: 1 });
coinTransactionSchema.index({ 'metadata.adNetwork': 1 });
coinTransactionSchema.index({ externalTransactionId: 1 });

// Virtual for formatted amount
coinTransactionSchema.virtual('formattedAmount').get(function() {
  return this.amount >= 0 ? `+${this.amount}` : `${this.amount}`;
});

// Static method to get user's coin balance
coinTransactionSchema.statics.getUserBalance = async function(userId) {
  const result = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), status: 'completed' } },
    { $group: { _id: null, totalCoins: { $sum: '$amount' } } }
  ]);
  
  return result.length > 0 ? result[0].totalCoins : 0;
};

// Static method to get user's earning stats
coinTransactionSchema.statics.getUserStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await this.aggregate([
    { 
      $match: { 
        userId: mongoose.Types.ObjectId(userId),
        status: 'completed',
        createdAt: { $gte: startDate }
      } 
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalCoins: { $sum: '$amount' },
        avgCoins: { $avg: '$amount' }
      }
    }
  ]);
  
  return stats;
};

// Static method to detect potential fraud
coinTransactionSchema.statics.detectFraud = async function(userId, type, metadata = {}) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Check daily limits
  const dailyCount = await this.countDocuments({
    userId,
    type,
    createdAt: { $gte: today },
    status: 'completed'
  });
  
  const limits = {
    'earned_admob_video': 50,      // Max 50 AdMob videos per day
    'earned_cpalead_offer': 10,    // Max 10 CPALead offers per day
    'earned_adgate_offer': 10,     // Max 10 AdGate offers per day
    'earned_survey': 5,            // Max 5 surveys per day
    'earned_app_install': 3        // Max 3 app installs per day
  };
  
  const fraudScore = dailyCount >= (limits[type] || 100) ? 80 : 0;
  
  // Check for rapid consecutive transactions (bot behavior)
  if (fraudScore === 0) {
    const recentCount = await this.countDocuments({
      userId,
      type,
      createdAt: { $gte: new Date(now - 5 * 60 * 1000) }, // Last 5 minutes
      status: 'completed'
    });
    
    if (recentCount >= 5) {
      return 90; // High fraud score for rapid transactions
    }
  }
  
  return fraudScore;
};

// Method to create reward transaction
coinTransactionSchema.statics.createReward = async function(userId, type, amount, description, metadata = {}) {
  const fraudScore = await this.detectFraud(userId, type, metadata);
  
  const transaction = new this({
    userId,
    type,
    amount,
    description,
    metadata: {
      ...metadata,
      fraudScore,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      deviceId: metadata.deviceId
    },
    status: fraudScore > 70 ? 'pending' : 'completed'
  });
  
  await transaction.save();
  
  // Update user's total coins if not flagged as fraud
  if (fraudScore <= 70) {
    await mongoose.model('User').findByIdAndUpdate(userId, {
      $inc: { totalCoins: amount, availableCredits: amount }
    });
  }
  
  return transaction;
};

module.exports = mongoose.model('CoinTransaction', coinTransactionSchema);
