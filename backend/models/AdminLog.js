const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: [
      'user_created',
      'user_updated',
      'user_deactivated',
      'user_activated',
      'credit_adjusted',
      'credit_deducted',
      'vip_granted',
      'vip_revoked',
      'referral_bonus_awarded',
      'referral_bonus_revoked',
      'task_verified',
      'task_rejected',
      'payout_processed',
      'payout_rejected',
      'system_config_updated',
      'ad_network_updated',
      'fraud_detected',
      'manual_verification'
    ],
    required: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  category: {
    type: String,
    enum: [
      'user_management',
      'credit_management',
      'vip_management',
      'referral_management',
      'task_management',
      'payout_management',
      'system_management',
      'security',
      'fraud_prevention'
    ],
    required: true
  },
  isReversible: {
    type: Boolean,
    default: false
  },
  reversedAt: {
    type: Date,
    default: null
  },
  reversedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reversalReason: {
    type: String,
    default: null
  },
  metadata: {
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    affectedRecords: [mongoose.Schema.Types.ObjectId],
    systemVersion: String,
    sessionId: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
adminLogSchema.index({ adminId: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });
adminLogSchema.index({ targetUserId: 1, createdAt: -1 });
adminLogSchema.index({ category: 1, severity: 1 });
adminLogSchema.index({ isReversible: 1, reversedAt: 1 });

// Virtual for is reversed
adminLogSchema.virtual('isReversed').get(function() {
  return this.reversedAt !== null;
});

// Method to reverse action
adminLogSchema.methods.reverse = function(reversedBy, reason) {
  if (!this.isReversible) {
    throw new Error('This action cannot be reversed');
  }
  
  if (this.isReversed) {
    throw new Error('This action has already been reversed');
  }
  
  this.reversedAt = new Date();
  this.reversedBy = reversedBy;
  this.reversalReason = reason;
  return this.save();
};

// Static method to log admin action
adminLogSchema.statics.logAction = async function(adminId, action, targetUserId, description, details = {}, category, severity = 'low') {
  const log = new this({
    adminId,
    action,
    targetUserId,
    description,
    details,
    category,
    severity,
    ipAddress: details.ipAddress || 'unknown',
    userAgent: details.userAgent || 'unknown',
    metadata: {
      oldValue: details.oldValue,
      newValue: details.newValue,
      affectedRecords: details.affectedRecords || [],
      systemVersion: details.systemVersion || '1.0.0',
      sessionId: details.sessionId
    }
  });
  
  await log.save();
  return log;
};

// Static method to get admin activity
adminLogSchema.statics.getAdminActivity = async function(adminId, startDate, endDate, limit = 50) {
  const matchQuery = { adminId };
  
  if (startDate && endDate) {
    matchQuery.createdAt = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  return await this.find(matchQuery)
    .populate('targetUserId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get system statistics
adminLogSchema.statics.getSystemStats = async function(startDate, endDate) {
  const matchQuery = {};
  
  if (startDate && endDate) {
    matchQuery.createdAt = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        highSeverity: {
          $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
        },
        criticalSeverity: {
          $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  return stats;
};

// Static method to get fraud detection logs
adminLogSchema.statics.getFraudLogs = async function(startDate, endDate, limit = 100) {
  const matchQuery = {
    category: 'fraud_prevention',
    severity: { $in: ['high', 'critical'] }
  };
  
  if (startDate && endDate) {
    matchQuery.createdAt = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  return await this.find(matchQuery)
    .populate('adminId', 'firstName lastName email')
    .populate('targetUserId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get audit trail for user
adminLogSchema.statics.getUserAuditTrail = async function(userId, startDate, endDate) {
  const matchQuery = { targetUserId: userId };
  
  if (startDate && endDate) {
    matchQuery.createdAt = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  return await this.find(matchQuery)
    .populate('adminId', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('AdminLog', adminLogSchema);
