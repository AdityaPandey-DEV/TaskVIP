const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  network: {
    type: String,
    enum: ['admob', 'cpalead', 'adgate', 'adscend', 'ayetstudios', 'offertoro'],
    required: true
  },
  type: {
    type: String,
    enum: [
      'rewarded_video',    // AdMob rewarded video
      'app_install',       // Install and run app
      'survey',           // Complete survey
      'signup',           // Sign up for service
      'purchase',         // Make a purchase
      'game_level',       // Reach level in game
      'social_follow',    // Follow social media
      'email_submit',     // Submit email
      'quiz',            // Complete quiz
      'video_watch'      // Watch video content
    ],
    required: true
  },
  coinReward: {
    min: {
      type: Number,
      required: true,
      min: 1
    },
    max: {
      type: Number,
      required: true,
      min: 1
    }
  },
  requirements: {
    minLevel: {
      type: Number,
      default: 0
    },
    countries: [String], // Allowed countries
    devices: [String],   // 'android', 'ios', 'web'
    vipOnly: {
      type: Boolean,
      default: false
    }
  },
  externalId: String,    // ID from ad network
  clickUrl: String,      // URL to redirect user
  imageUrl: String,      // Offer image
  category: {
    type: String,
    enum: ['gaming', 'shopping', 'finance', 'entertainment', 'education', 'lifestyle', 'other'],
    default: 'other'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  estimatedTime: {
    type: Number, // minutes
    default: 5
  },
  conversionRate: {
    type: Number, // percentage of users who complete
    default: 50
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0 // Higher priority shows first
  },
  dailyLimit: {
    type: Number,
    default: 1000 // Max completions per day
  },
  userLimit: {
    type: Number,
    default: 1 // Max completions per user
  },
  expiresAt: Date,
  metadata: {
    appPackage: String,    // For app install offers
    surveyLength: Number,  // For survey offers
    gameLevel: Number,     // For game offers
    socialPlatform: String, // For social offers
    purchaseAmount: Number  // For purchase offers
  }
}, {
  timestamps: true
});

// Indexes
offerSchema.index({ network: 1, isActive: 1 });
offerSchema.index({ type: 1, isActive: 1 });
offerSchema.index({ priority: -1, createdAt: -1 });
offerSchema.index({ 'requirements.countries': 1 });
offerSchema.index({ category: 1 });

// Virtual for average reward
offerSchema.virtual('avgReward').get(function() {
  return Math.round((this.coinReward.min + this.coinReward.max) / 2);
});

// Static method to get offers for user
offerSchema.statics.getOffersForUser = async function(userId, filters = {}) {
  const User = mongoose.model('User');
  const OfferCompletion = mongoose.model('OfferCompletion');
  
  const user = await User.findById(userId);
  if (!user) return [];
  
  // Build query
  const query = {
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  };
  
  // Filter by user requirements
  if (user.vipLevel === 0) {
    query['requirements.vipOnly'] = { $ne: true };
  }
  
  // Filter by category if specified
  if (filters.category) {
    query.category = filters.category;
  }
  
  // Filter by type if specified
  if (filters.type) {
    query.type = filters.type;
  }
  
  // Get offers
  const offers = await this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .limit(filters.limit || 50);
  
  // Get user's completed offers
  const completedOffers = await OfferCompletion.find({
    userId,
    status: 'completed'
  }).distinct('offerId');
  
  // Filter out completed offers that have user limits
  const availableOffers = offers.filter(offer => {
    if (offer.userLimit === 0) return true; // No limit
    
    const completedCount = completedOffers.filter(id => id.equals(offer._id)).length;
    return completedCount < offer.userLimit;
  });
  
  return availableOffers;
};

// Static method to get trending offers
offerSchema.statics.getTrendingOffers = async function(limit = 10) {
  const OfferCompletion = mongoose.model('OfferCompletion');
  
  // Get offers completed in last 24 hours
  const trending = await OfferCompletion.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$offerId',
        completions: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    },
    { $sort: { completions: -1 } },
    { $limit: limit }
  ]);
  
  const offerIds = trending.map(t => t._id);
  const offers = await this.find({ _id: { $in: offerIds }, isActive: true });
  
  // Add trending stats to offers
  return offers.map(offer => {
    const stats = trending.find(t => t._id.equals(offer._id));
    return {
      ...offer.toObject(),
      trendingStats: {
        completions: stats.completions,
        avgRating: stats.avgRating || 0
      }
    };
  });
};

module.exports = mongoose.model('Offer', offerSchema);
