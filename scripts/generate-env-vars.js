#!/usr/bin/env node

/**
 * Environment Variables Generator for TaskVIP Production
 * Generates secure random values for JWT secrets and other sensitive data
 */

const crypto = require('crypto');

console.log('🔐 TaskVIP Environment Variables Generator');
console.log('==========================================\n');

// Generate secure JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('🔑 JWT Configuration:');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_EXPIRE=7d\n`);

// Generate admin password
const adminPassword = crypto.randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
console.log('👤 Admin Configuration:');
console.log(`ADMIN_EMAIL=admin@taskvip.com`);
console.log(`ADMIN_PASSWORD=${adminPassword}\n`);

// Basic production settings
console.log('⚙️ Basic Production Settings:');
console.log(`NODE_ENV=production`);
console.log(`PORT=10000`);
console.log(`FRONTEND_URL=https://your-frontend-domain.vercel.app\n`);

// Database template
console.log('🗄️ Database Configuration:');
console.log(`MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskvip\n`);

// Email template
console.log('📧 Email Configuration:');
console.log(`EMAIL_HOST=smtp.gmail.com`);
console.log(`EMAIL_PORT=587`);
console.log(`EMAIL_USER=your-email@gmail.com`);
console.log(`EMAIL_PASS=your-gmail-app-password\n`);

// Security settings
console.log('🛡️ Security Settings:');
console.log(`BCRYPT_ROUNDS=12`);
console.log(`RATE_LIMIT_WINDOW=900000`);
console.log(`RATE_LIMIT_MAX=100\n`);

// Payment gateway template
console.log('💳 Payment Gateway (Optional):');
console.log(`RAZORPAY_KEY_ID=rzp_test_your_key_id`);
console.log(`RAZORPAY_KEY_SECRET=your_razorpay_secret\n`);

// Google OAuth (Recommended)
console.log('🔐 Google OAuth (Recommended):');
console.log(`GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com\n`);

// Hybrid Reward System (Monetization)
console.log('🎯 Hybrid Reward System (Monetization):');
console.log(`# CPALead - High-value offers`);
console.log(`CPALEAD_API_KEY=your-cpalead-api-key`);
console.log(`CPALEAD_SUBID=your-cpalead-subid`);
console.log(`# AdGate Media - Surveys and offers`);
console.log(`ADGATE_API_KEY=your-adgate-api-key`);
console.log(`ADGATE_WALL_ID=your-adgate-wall-id`);
console.log(`# Google AdMob - Premium video ads`);
console.log(`ADMOB_APP_ID=ca-app-pub-1881146103066218~5156611105`);
console.log(`ADMOB_PUBLISHER_ID=pub-1881146103066218`);
console.log(`ADMOB_REWARDED_AD_UNIT_ID=ca-app-pub-1881146103066218/5022532125`);
console.log(`# Unity Ads - Alternative video network`);
console.log(`UNITY_GAME_ID=your-unity-game-id`);
console.log(`UNITY_API_KEY=your-unity-api-key`);
console.log(`# Adscend Media - Additional offers`);
console.log(`ADSCEND_API_KEY=your-adscend-api-key`);
console.log(`ADSCEND_PUB_ID=your-adscend-publisher-id\n`);

console.log('📋 Instructions:');
console.log('1. Copy the values above');
console.log('2. Go to Render Dashboard → Your Service → Environment');
console.log('3. Add each variable (replace template values with real ones)');
console.log('4. Save and redeploy your service');
console.log('');
console.log('🔒 Security Notes:');
console.log('- JWT_SECRET: Generated securely (keep this secret!)');
console.log('- ADMIN_PASSWORD: Generated randomly (change if needed)');
console.log('- EMAIL_PASS: Use Gmail App Password, not regular password');
console.log('- MONGODB_URI: Replace with your actual MongoDB connection string');
console.log('');
console.log('✅ Your TaskVIP hybrid reward system will be fully configured once these are set!');
console.log('🎯 Monetization ready: AdMob + CPALead + AdGate for maximum profitability!');
console.log('');
console.log('🎨 Frontend Environment Variables (for deployment):');
console.log('==================================================');
console.log('');
console.log('📁 Create .env.local in frontend directory:');
console.log(`NEXT_PUBLIC_API_URL=https://taskvip.onrender.com/api`);
console.log(`NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com`);
console.log('');
console.log('📋 Frontend Deployment Instructions:');
console.log('1. Deploy frontend to Vercel/Netlify');
console.log('2. Add NEXT_PUBLIC_API_URL environment variable');
console.log('3. Update FRONTEND_URL in backend Render settings');
console.log('4. Test the connection between frontend and backend');
