const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
// Enhanced CORS configuration with debugging
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://task-vip.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`✅ CORS: Allowing origin ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS: Blocking origin ${origin}`);
      console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Rate limiting - more generous for development and normal usage
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs (increased from 100)
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://taskvipstore_db_user:5idopRl5sBax4Xx7@task-vip.tj4ybne.mongodb.net/taskvip')
.then(async () => {
  console.log('MongoDB connected successfully');
  
  // Ensure default referral user exists
  const User = require('./models/User');
  await User.ensureDefaultReferralUser();
})
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/vip', require('./routes/vip'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/referral-bonus', require('./routes/referral-bonus'));
app.use('/api/credits', require('./routes/credits'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ads', require('./routes/ads'));
app.use('/api/trial', require('./routes/trial'));
app.use('/api/profit-monitoring', require('./routes/profit-monitoring'));
app.use('/api/email-verification', require('./routes/email-verification'));
app.use('/api/withdrawals', require('./routes/withdrawals'));
app.use('/api/withdrawals-new', require('./routes/withdrawals-new'));
app.use('/api/coins', require('./routes/coins'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/multi-level-referrals', require('./routes/multi-level-referrals')); // Multi-level referral system
app.use('/api/razorpay-withdrawals', require('./routes/razorpay-withdrawals')); // Razorpay withdrawal system
app.use('/api/app-installs', require('./routes/app-installs')); // App install system
app.use('/api/stats', require('./routes/stats'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// AdMob configuration check endpoint
app.get('/api/admob/config', (req, res) => {
  const admobConfig = {
    appId: process.env.ADMOB_APP_ID || null,
    publisherId: process.env.ADMOB_PUBLISHER_ID || null,
    rewardedAdUnitId: process.env.ADMOB_REWARDED_AD_UNIT_ID || null,
    configured: !!(process.env.ADMOB_APP_ID && process.env.ADMOB_PUBLISHER_ID && process.env.ADMOB_REWARDED_AD_UNIT_ID),
    timestamp: new Date().toISOString()
  };
  
  res.json(admobConfig);
});

// CORS test endpoint
app.get('/api/cors/test', (req, res) => {
  res.json({
    message: 'CORS is working correctly!',
    origin: req.get('Origin') || 'No origin header',
    userAgent: req.get('User-Agent') || 'No user agent',
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
