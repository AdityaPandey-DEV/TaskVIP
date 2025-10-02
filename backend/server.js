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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
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
app.use('/api/stats', require('./routes/stats'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
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
