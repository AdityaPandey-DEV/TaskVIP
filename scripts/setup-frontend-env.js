#!/usr/bin/env node

/**
 * Frontend Environment Setup Script for TaskVIP
 * Creates .env.local file for frontend development/testing
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 TaskVIP Frontend Environment Setup');
console.log('====================================\n');

const frontendDir = path.join(__dirname, '..', 'frontend');
const envFile = path.join(frontendDir, '.env.local');

// Check if frontend directory exists
if (!fs.existsSync(frontendDir)) {
  console.log('❌ Frontend directory not found!');
  console.log('Make sure you are running this from the project root.');
  process.exit(1);
}

// Determine API URL based on command line argument
const args = process.argv.slice(2);
let apiUrl = 'http://localhost:5000/api'; // Default for development

if (args.includes('--production') || args.includes('-p')) {
  apiUrl = 'https://taskvip.onrender.com/api';
  console.log('🚀 Setting up for PRODUCTION backend');
} else {
  console.log('🛠️ Setting up for LOCAL development');
}

// Create .env.local content
const envContent = `# TaskVIP Frontend Environment Variables
# Generated on ${new Date().toISOString()}

# Backend API URL
NEXT_PUBLIC_API_URL=${apiUrl}

# Optional: Add other environment variables here
# NEXT_PUBLIC_GA_ID=your-google-analytics-id
# NEXT_PUBLIC_HOTJAR_ID=your-hotjar-id
`;

try {
  // Write the file
  fs.writeFileSync(envFile, envContent);
  
  console.log('✅ Created .env.local file successfully!');
  console.log(`📁 Location: ${envFile}`);
  console.log(`🔗 API URL: ${apiUrl}`);
  console.log('');
  
  if (apiUrl.includes('localhost')) {
    console.log('💡 Development Setup:');
    console.log('1. Make sure your backend is running on port 5000');
    console.log('2. Run: cd frontend && npm run dev');
    console.log('3. Frontend will be available at: http://localhost:3000');
  } else {
    console.log('💡 Production Testing Setup:');
    console.log('1. Frontend will connect to production backend');
    console.log('2. Run: cd frontend && npm run dev');
    console.log('3. Test with live backend data');
  }
  
  console.log('');
  console.log('🔄 To switch environments:');
  console.log('Development: node scripts/setup-frontend-env.js');
  console.log('Production:  node scripts/setup-frontend-env.js --production');
  
} catch (error) {
  console.log('❌ Error creating .env.local file:');
  console.log(error.message);
  process.exit(1);
}

console.log('');
console.log('🎉 Frontend environment setup complete!');
