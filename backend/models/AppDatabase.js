const mongoose = require('mongoose');

const appDatabaseSchema = new mongoose.Schema({
  appId: {
    type: String,
    required: true,
    unique: true
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
    required: true
  },
  appRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 4.0
  },
  appSize: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    enum: ['android', 'ios', 'both'],
    required: true
  },
  downloadUrl: {
    android: String,
    ios: String
  },
  playStoreUrl: String,
  appStoreUrl: String,
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
      type: Number,
      default: 30
    },
    openTime: {
      type: Number,
      default: 60
    },
    usageDays: {
      type: Number,
      default: 0
    }
  },
  networkProvider: {
    type: String,
    enum: ['adgate', 'cpalead', 'adscend', 'offertoro', 'ayetstudios', 'internal'],
    default: 'internal'
  },
  externalOfferId: {
    type: String,
    default: null
  },
  targetCountries: [{
    type: String,
    default: ['US', 'CA', 'GB', 'AU', 'IN']
  }],
  targetDevices: [{
    type: String,
    enum: ['phone', 'tablet', 'both'],
    default: ['both']
  }],
  minAndroidVersion: {
    type: String,
    default: '5.0'
  },
  minIOSVersion: {
    type: String,
    default: '12.0'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'rejected'],
    default: 'active'
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  conversionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalInstalls: {
    type: Number,
    default: 0
  },
  successfulInstalls: {
    type: Number,
    default: 0
  },
  averageCompletionTime: {
    type: Number, // in minutes
    default: 0
  },
  isPromoted: {
    type: Boolean,
    default: false
  },
  promotionBonus: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes
appDatabaseSchema.index({ appId: 1 });
appDatabaseSchema.index({ appCategory: 1 });
appDatabaseSchema.index({ platform: 1 });
appDatabaseSchema.index({ status: 1 });
appDatabaseSchema.index({ networkProvider: 1 });
appDatabaseSchema.index({ priority: -1 });
appDatabaseSchema.index({ isPromoted: -1 });
appDatabaseSchema.index({ validFrom: 1, validUntil: 1 });

// Virtual for is active
appDatabaseSchema.virtual('isActive').get(function() {
  return this.status === 'active' && 
         this.validFrom <= new Date() && 
         this.validUntil >= new Date();
});

// Method to update conversion rate
appDatabaseSchema.methods.updateConversionRate = function() {
  if (this.totalInstalls > 0) {
    this.conversionRate = (this.successfulInstalls / this.totalInstalls) * 100;
  }
  return this.save();
};

// Method to increment install count
appDatabaseSchema.methods.incrementInstalls = function() {
  this.totalInstalls += 1;
  return this.save();
};

// Method to increment successful installs
appDatabaseSchema.methods.incrementSuccessfulInstalls = function() {
  this.successfulInstalls += 1;
  return this.updateConversionRate();
};

// Static method to get available apps for platform
appDatabaseSchema.statics.getAvailableApps = async function(platform = 'android', category = 'all', country = 'US', limit = 50) {
  const query = {
    status: 'active',
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() },
    platform: { $in: [platform, 'both'] },
    targetCountries: { $in: [country, 'ALL'] }
  };
  
  if (category !== 'all') {
    query.appCategory = category;
  }
  
  return this.find(query)
    .sort({ isPromoted: -1, priority: -1, conversionRate: -1 })
    .limit(limit)
    .select('-createdBy -__v');
};

// Static method to get promoted apps
appDatabaseSchema.statics.getPromotedApps = async function(platform = 'android', limit = 10) {
  return this.find({
    status: 'active',
    isPromoted: true,
    platform: { $in: [platform, 'both'] },
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() }
  })
  .sort({ priority: -1, rewardCoins: -1 })
  .limit(limit);
};

// Static method to seed sample apps
appDatabaseSchema.statics.seedSampleApps = async function() {
  const sampleApps = [
    {
      appId: 'com.instagram.android',
      appName: 'Instagram',
      appPackage: 'com.instagram.android',
      appIcon: 'https://play-lh.googleusercontent.com/VRMWkE5p3CkWhJs6nv-9ZsLAs1QOg5ob1_3qg-rckwYW7yp1fIGj_iZIL0HQvGv6DhUL',
      appDescription: 'Connect with friends, share photos and videos, explore content from around the world.',
      appCategory: 'social',
      appRating: 4.5,
      appSize: '75.2 MB',
      platform: 'both',
      downloadUrl: {
        android: 'https://play.google.com/store/apps/details?id=com.instagram.android',
        ios: 'https://apps.apple.com/app/instagram/id389801252'
      },
      rewardCoins: 150,
      requiredActions: ['install', 'open', 'register'],
      timeRequirements: {
        installTime: 30,
        openTime: 120,
        usageDays: 0
      },
      networkProvider: 'internal',
      isPromoted: true,
      promotionBonus: 50,
      priority: 9
    },
    {
      appId: 'com.spotify.music',
      appName: 'Spotify',
      appPackage: 'com.spotify.music',
      appIcon: 'https://play-lh.googleusercontent.com/UrY7BAZ-XfXGpfkeWg0zCCeo-7ras4DCoRalC_WXXWTK9q5b0Iw7B0YQMsVxZaNB7DM',
      appDescription: 'Stream millions of songs and podcasts for free, or upgrade to Spotify Premium.',
      appCategory: 'entertainment',
      appRating: 4.3,
      appSize: '31.8 MB',
      platform: 'both',
      downloadUrl: {
        android: 'https://play.google.com/store/apps/details?id=com.spotify.music',
        ios: 'https://apps.apple.com/app/spotify-music-and-podcasts/id324684580'
      },
      rewardCoins: 120,
      requiredActions: ['install', 'open'],
      timeRequirements: {
        installTime: 30,
        openTime: 90,
        usageDays: 0
      },
      networkProvider: 'internal',
      priority: 8
    },
    {
      appId: 'com.whatsapp',
      appName: 'WhatsApp Messenger',
      appPackage: 'com.whatsapp',
      appIcon: 'https://play-lh.googleusercontent.com/bYtqbOcTYOlgc6gqZ2rwb8lptHuwlNE75zYJu6Bn076-hTmvd96HH-6v7S0YUAAJXoJN',
      appDescription: 'Simple. Reliable. Private. WhatsApp from Facebook.',
      appCategory: 'social',
      appRating: 4.4,
      appSize: '55.7 MB',
      platform: 'both',
      downloadUrl: {
        android: 'https://play.google.com/store/apps/details?id=com.whatsapp',
        ios: 'https://apps.apple.com/app/whatsapp-messenger/id310633997'
      },
      rewardCoins: 100,
      requiredActions: ['install', 'open'],
      timeRequirements: {
        installTime: 30,
        openTime: 60,
        usageDays: 0
      },
      networkProvider: 'internal',
      priority: 7
    },
    {
      appId: 'com.pubg.imobile',
      appName: 'PUBG MOBILE',
      appPackage: 'com.pubg.imobile',
      appIcon: 'https://play-lh.googleusercontent.com/JRd05pyBH41qjgsJuWduRJpDeZG0Hnb0yjf2nWqO7VaGTG_G_dcAQCdPsWCrKl3MjGg',
      appDescription: 'Official PUBG on Mobile. 100 players drop and fight for survival!',
      appCategory: 'games',
      appRating: 4.1,
      appSize: '721 MB',
      platform: 'both',
      downloadUrl: {
        android: 'https://play.google.com/store/apps/details?id=com.pubg.imobile',
        ios: 'https://apps.apple.com/app/pubg-mobile/id1330123889'
      },
      rewardCoins: 300,
      requiredActions: ['install', 'open', 'level_up'],
      timeRequirements: {
        installTime: 60,
        openTime: 300,
        usageDays: 0
      },
      networkProvider: 'internal',
      isPromoted: true,
      promotionBonus: 100,
      priority: 10
    },
    {
      appId: 'com.amazon.mShop.android.shopping',
      appName: 'Amazon Shopping',
      appPackage: 'com.amazon.mShop.android.shopping',
      appIcon: 'https://play-lh.googleusercontent.com/MRzMmiJAe0-xaEkDKB0MKwv1a3kjDaGYoKM4GBYW_5ZTw3uMxJFHdFOO_nLM7lGccyE',
      appDescription: 'Shop millions of products, get fast delivery, and enjoy exclusive deals.',
      appCategory: 'shopping',
      appRating: 4.2,
      appSize: '67.4 MB',
      platform: 'both',
      downloadUrl: {
        android: 'https://play.google.com/store/apps/details?id=com.amazon.mShop.android.shopping',
        ios: 'https://apps.apple.com/app/amazon-shopping/id297606951'
      },
      rewardCoins: 80,
      requiredActions: ['install', 'open'],
      timeRequirements: {
        installTime: 30,
        openTime: 60,
        usageDays: 0
      },
      networkProvider: 'internal',
      priority: 6
    }
  ];
  
  for (const appData of sampleApps) {
    try {
      await this.findOneAndUpdate(
        { appId: appData.appId },
        appData,
        { upsert: true, new: true }
      );
    } catch (error) {
      console.log(`Error seeding app ${appData.appName}:`, error.message);
    }
  }
  
  console.log(`✅ Seeded ${sampleApps.length} sample apps`);
  return sampleApps.length;
};

module.exports = mongoose.model('AppDatabase', appDatabaseSchema);
