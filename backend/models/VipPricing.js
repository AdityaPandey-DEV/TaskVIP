const mongoose = require('mongoose');

const vipPricingSchema = new mongoose.Schema({
  level: {
    type: Number,
    enum: [0, 1, 2, 3],
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  duration: {
    type: Number,
    default: 30, // days
    min: 1
  },
  dailyCreditLimitMultiplier: {
    type: Number,
    required: true,
    min: 1
  },
  referralBonusMultiplier: {
    type: Number,
    required: true,
    min: 1
  },
  exclusiveOffers: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    required: true
  },
  features: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
vipPricingSchema.index({ level: 1 });
vipPricingSchema.index({ isActive: 1 });
vipPricingSchema.index({ sortOrder: 1 });

// Static method to get active VIP pricing
vipPricingSchema.statics.getActivePricing = async function() {
  return await this.find({ isActive: true }).sort({ sortOrder: 1, level: 1 });
};

// Static method to get pricing by level
vipPricingSchema.statics.getPricingByLevel = async function(level) {
  return await this.findOne({ level, isActive: true });
};

// Static method to initialize default pricing
vipPricingSchema.statics.initializeDefaultPricing = async function(adminUserId) {
  const defaultPricing = [
    {
      level: 0,
      name: 'Free',
      price: 0,
      dailyCreditLimitMultiplier: 1,
      referralBonusMultiplier: 1,
      exclusiveOffers: false,
      description: 'Basic access to earning opportunities • 20% referral commission',
      features: [
        'Basic earning opportunities',
        '20% referral commission',
        'Standard support'
      ],
      sortOrder: 0,
      createdBy: adminUserId
    },
    {
      level: 1,
      name: 'Bronze',
      price: 99,
      dailyCreditLimitMultiplier: 1.5,
      referralBonusMultiplier: 1.2,
      exclusiveOffers: true,
      description: 'Enhanced earning limits • 30% referral commission • Exclusive offers',
      features: [
        'Enhanced earning limits',
        '30% referral commission',
        'Exclusive offers',
        'Priority support'
      ],
      sortOrder: 1,
      createdBy: adminUserId
    },
    {
      level: 2,
      name: 'Silver',
      price: 199,
      dailyCreditLimitMultiplier: 2,
      referralBonusMultiplier: 1.5,
      exclusiveOffers: true,
      description: 'Higher earning potential • 40% referral commission • Premium rewards',
      features: [
        'Higher earning potential',
        '40% referral commission',
        'Premium rewards',
        'Priority support',
        'Exclusive tasks'
      ],
      sortOrder: 2,
      createdBy: adminUserId
    },
    {
      level: 3,
      name: 'Gold',
      price: 299,
      dailyCreditLimitMultiplier: 3,
      referralBonusMultiplier: 2,
      exclusiveOffers: true,
      description: 'Maximum earning potential • 50% referral commission • Exclusive benefits',
      features: [
        'Maximum earning potential',
        '50% referral commission',
        'Exclusive benefits',
        'Priority support',
        'Exclusive tasks',
        'Higher reward rates'
      ],
      sortOrder: 3,
      createdBy: adminUserId
    }
  ];

  // Check if pricing already exists
  const existingPricing = await this.find();
  if (existingPricing.length > 0) {
    return existingPricing;
  }

  // Create default pricing
  return await this.insertMany(defaultPricing);
};

module.exports = mongoose.model('VipPricing', vipPricingSchema);
