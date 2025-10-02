#!/usr/bin/env node

/**
 * Test script for the keep-alive system
 * This script simulates what the GitHub Actions workflow does
 */

const https = require('https');
const http = require('http');

// Configuration
const BACKEND_URL = process.env.RENDER_BACKEND_URL || 'https://your-app-name.onrender.com';
const HEALTH_ENDPOINT = '/api/health';
const TIMEOUT = 30000; // 30 seconds

console.log('🧪 Testing Keep-Alive System');
console.log('================================');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Health Endpoint: ${HEALTH_ENDPOINT}`);
console.log(`Timeout: ${TIMEOUT}ms`);
console.log('');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'KeepAlive-Test/1.0'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(TIMEOUT);
    req.end();
  });
}

async function testHealthEndpoint() {
  console.log('🏥 Testing health endpoint...');
  
  try {
    const startTime = Date.now();
    const response = await makeRequest(`${BACKEND_URL}${HEALTH_ENDPOINT}`);
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ Health check successful!`);
    console.log(`   Status Code: ${response.statusCode}`);
    console.log(`   Response Time: ${responseTime}ms`);
    console.log(`   Response: ${response.data}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Health check failed!`);
    console.log(`   Error: ${error.message}`);
    
    return false;
  }
}

async function testWakeUp() {
  console.log('');
  console.log('🚀 Testing wake-up sequence...');
  
  const endpoints = [
    '/api/health',
    '/',
    '/api/stats'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`   Trying: ${endpoint}`);
    
    try {
      const startTime = Date.now();
      const response = await makeRequest(`${BACKEND_URL}${endpoint}`);
      const responseTime = Date.now() - startTime;
      
      console.log(`   ✅ Success: ${response.statusCode} (${responseTime}ms)`);
      
      if (response.statusCode === 200) {
        console.log(`   🎉 Backend is awake!`);
        return true;
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
    
    // Wait 2 seconds between attempts
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return false;
}

async function runTest() {
  console.log(`⏰ Test started at: ${new Date().toISOString()}`);
  console.log('');
  
  // Test 1: Health endpoint
  const healthOk = await testHealthEndpoint();
  
  // Test 2: Wake-up sequence (if health check failed)
  if (!healthOk) {
    const wakeUpOk = await testWakeUp();
    
    if (wakeUpOk) {
      // Final health check
      console.log('');
      console.log('🔍 Final health verification...');
      await testHealthEndpoint();
    }
  }
  
  console.log('');
  console.log('📊 Test Summary:');
  console.log(`   Backend URL: ${BACKEND_URL}`);
  console.log(`   Test completed at: ${new Date().toISOString()}`);
  console.log('   This simulates what GitHub Actions will do every 14 minutes');
  console.log('');
  console.log('💡 Next steps:');
  console.log('   1. Update RENDER_BACKEND_URL in GitHub Secrets');
  console.log('   2. Enable GitHub Actions in your repository');
  console.log('   3. Monitor the Actions tab for automated pings');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node test-keep-alive.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('');
  console.log('Environment Variables:');
  console.log('  RENDER_BACKEND_URL    Your Render backend URL');
  console.log('');
  console.log('Example:');
  console.log('  RENDER_BACKEND_URL=https://my-app.onrender.com node test-keep-alive.js');
  process.exit(0);
}

// Run the test
runTest().catch(error => {
  console.error('💥 Test failed with error:', error);
  process.exit(1);
});

