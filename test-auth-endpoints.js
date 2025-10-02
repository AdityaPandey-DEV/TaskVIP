const https = require('https');

// Test the auth endpoints
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

async function testAuthAPI() {
  console.log('🧪 Testing TaskVIP Auth API Endpoints...\n');
  
  try {
    // Test health check first
    await testEndpoint('/api/health');
    
    // Test login endpoint (should fail without credentials but should exist)
    await testEndpoint('/api/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'testpassword'
    });
    
    // Test register endpoint (should fail with validation but should exist)
    await testEndpoint('/api/auth/register', 'POST', {
      email: 'test@example.com'
    });
    
    console.log('\n✅ Auth API endpoint tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuthAPI();
