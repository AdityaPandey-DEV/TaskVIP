const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔐 Auth middleware called for:', req.method, req.path);
    const authHeader = req.headers['authorization'];
    console.log('🔐 Auth header:', authHeader ? 'Present' : 'Missing');
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: 'Access token required' });
    }

    console.log('🔐 Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 Token decoded, userId:', decoded.userId);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('❌ User not found for token');
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log('✅ User authenticated:', user.email);

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account deactivated' });
    }

    if (user.isLocked) {
      return res.status(401).json({ message: 'Account locked due to multiple failed login attempts' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Token verification failed' });
  }
};

// Admin authentication
const authenticateAdmin = async (req, res, next) => {
  try {
    await authenticateToken(req, res, () => {
      if (!req.user.isAdminUser()) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      next();
    });
  } catch (error) {
    return res.status(500).json({ message: 'Admin authentication failed' });
  }
};

// Rate limiting for sensitive operations
const rateLimitSensitive = (windowMs = 15 * 60 * 1000, max = 5) => {
  return (req, res, next) => {
    // This would integrate with your rate limiting solution
    // For now, we'll use a simple in-memory store
    const key = `${req.ip}_sensitive`;
    const now = Date.now();
    
    if (!global.rateLimitStore) {
      global.rateLimitStore = new Map();
    }
    
    const userLimit = global.rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (now > userLimit.resetTime) {
      userLimit.count = 0;
      userLimit.resetTime = now + windowMs;
    }
    
    if (userLimit.count >= max) {
      return res.status(429).json({ 
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
      });
    }
    
    userLimit.count++;
    global.rateLimitStore.set(key, userLimit);
    next();
  };
};

// Validate user ownership
const validateUserOwnership = (req, res, next) => {
  const userId = req.params.userId || req.params.id;
  
  if (userId && userId !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  next();
};

// Check VIP status
const requireVip = (minLevel = 1) => {
  return (req, res, next) => {
    if (!req.user.isVipActive() || req.user.vipLevel < minLevel) {
      return res.status(403).json({ 
        message: `VIP ${minLevel} or higher required`,
        currentLevel: req.user.vipLevel,
        isActive: req.user.isVipActive()
      });
    }
    next();
  };
};

// Check KYC status
const requireKyc = (req, res, next) => {
  if (req.user.kycStatus !== 'verified') {
    return res.status(403).json({ 
      message: 'KYC verification required',
      kycStatus: req.user.kycStatus
    });
  }
  next();
};

// Validate request body
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// Log admin actions
const logAdminAction = (action, category, severity = 'low') => {
  return async (req, res, next) => {
    try {
      const AdminLog = require('../models/AdminLog');
      
      // Store original res.json
      const originalJson = res.json;
      
      // Override res.json to log after response
      res.json = function(data) {
        // Log the action
        AdminLog.logAction(
          req.user._id,
          action,
          req.params.userId || req.params.id,
          `${action} performed by admin`,
          {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            oldValue: req.body.oldValue,
            newValue: req.body,
            sessionId: req.sessionID
          },
          category,
          severity
        ).catch(console.error);
        
        // Call original json method
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Error logging admin action:', error);
      next();
    }
  };
};

module.exports = {
  authenticateToken,
  authenticateAdmin,
  rateLimitSensitive,
  validateUserOwnership,
  requireVip,
  requireKyc,
  validateRequest,
  logAdminAction
};
