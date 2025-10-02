const https = require('https');

// Test the rewards endpoint
const testEndpoint = (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'taskvip.onrender.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n--- Testing ${method} ${path} ---`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        console.log(`Response:`, responseData);
        resolve({ status: res.statusCode, data: responseData });
      });
    });

    req.on('error', (error) => {
      console.error(`Error testing ${path}:`, error);
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

async function testRewardsAPI() {
  console.log('🧪 Testing TaskVIP Rewards API Endpoints...\n');
  
  try {
    // Test health check first
    await testEndpoint('/api/health');
    
    // Test rewards tasks endpoint (should fail without auth, but should exist)
    await testEndpoint('/api/rewards/tasks');
    
    // Test rewards complete endpoint (should fail without auth, but should exist)
    await testEndpoint('/api/rewards/complete/admob_video_1', 'POST');
    
    console.log('\n✅ API endpoint tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRewardsAPI();
