const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['signup', 'withdrawal', 'referral', 'password_reset'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'expired'],
    default: 'pending'
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    referralCode: String,
    referrerId: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true
});

// Indexes for better performance
emailVerificationSchema.index({ token: 1 });
emailVerificationSchema.index({ userId: 1, type: 1 });
emailVerificationSchema.index({ status: 1, expiresAt: 1 });
emailVerificationSchema.index({ email: 1, type: 1 });

// Virtual for is expired
emailVerificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Method to mark as verified
emailVerificationSchema.methods.markVerified = function() {
  this.status = 'verified';
  this.verifiedAt = new Date();
  return this.save();
};

// Method to mark as expired
emailVerificationSchema.methods.markExpired = function() {
  this.status = 'expired';
  return this.save();
};

// Static method to create verification
emailVerificationSchema.statics.createVerification = async function(userId, email, type, metadata = {}) {
  // Expire any existing verifications for this user and type
  await this.updateMany(
    { userId, type, status: 'pending' },
    { status: 'expired' }
  );

  const token = require('crypto').randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const verification = new this({
    userId,
    email,
    token,
    type,
    expiresAt,
    metadata
  });

  await verification.save();
  return verification;
};

// Static method to verify token
emailVerificationSchema.statics.verifyToken = async function(token, type) {
  const verification = await this.findOne({ token, type });
  
  if (!verification) {
    return { success: false, message: 'Invalid verification token' };
  }

  if (verification.isExpired) {
    await verification.markExpired();
    return { success: false, message: 'Verification token has expired' };
  }

  if (verification.status !== 'pending') {
    return { success: false, message: 'Token already used' };
  }

  await verification.markVerified();
  return { success: true, verification };
};

// Static method to get pending verifications
emailVerificationSchema.statics.getPendingVerifications = async function(userId, type) {
  return await this.find({
    userId,
    type,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });
};

// Static method to clean up expired verifications
emailVerificationSchema.statics.cleanupExpired = async function() {
  const result = await this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: new Date() }
    },
    { status: 'expired' }
  );
  
  return result.modifiedCount;
};

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);

