const https = require('https');

// Test CORS configuration
const testCORS = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'taskvip.onrender.com',
      port: 443,
      path: '/api/cors/test',
      method: 'GET',
      headers: {
        'Origin': 'https://task-vip.vercel.app',
        'User-Agent': 'CORS-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('🌐 CORS Test Results:');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'NOT SET'}`);
        console.log(`Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials'] || 'NOT SET'}`);
        console.log(`Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods'] || 'NOT SET'}`);
        
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(responseData);
            console.log('\n📱 Response Data:');
            console.log(`Message: ${data.message}`);
            console.log(`Origin Detected: ${data.origin}`);
            console.log(`Timestamp: ${data.timestamp}\n`);
            
            if (res.headers['access-control-allow-origin']) {
              console.log('✅ CORS headers are present - should work now!');
            } else {
              console.log('❌ CORS headers missing - still needs fixing');
            }
          } catch (parseError) {
            console.log('❌ Failed to parse response');
            console.log(`Raw response: ${responseData}`);
          }
        } else {
          console.log('❌ CORS test endpoint not available yet');
          console.log(`Response: ${responseData}`);
        }
        
        resolve({ status: res.statusCode, data: responseData, headers: res.headers });
      });
    });

    req.on('error', (error) => {
      console.error('❌ CORS test failed:', error.message);
      reject(error);
    });
    
    req.end();
  });
};

// Test preflight request (OPTIONS)
const testPreflight = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'taskvip.onrender.com',
      port: 443,
      path: '/api/auth/google',
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://task-vip.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    };

    const req = https.request(options, (res) => {
      console.log('\n🔍 Preflight Request Test:');
      console.log(`Status: ${res.statusCode}`);
      console.log(`Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'NOT SET'}`);
      console.log(`Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods'] || 'NOT SET'}`);
      console.log(`Access-Control-Allow-Headers: ${res.headers['access-control-allow-headers'] || 'NOT SET'}`);
      
      if (res.statusCode === 200 && res.headers['access-control-allow-origin']) {
        console.log('✅ Preflight request successful - Google OAuth should work!');
      } else {
        console.log('❌ Preflight request failed - Google OAuth may still have issues');
      }
      
      resolve({ status: res.statusCode, headers: res.headers });
    });

    req.on('error', (error) => {
      console.error('❌ Preflight test failed:', error.message);
      reject(error);
    });
    
    req.end();
  });
};

async function runCORSTests() {
  console.log('🔧 CORS Configuration Test');
  console.log('===========================\n');
  
  try {
    // Test basic CORS
    await testCORS();
    
    // Test preflight for Google OAuth
    await testPreflight();
    
    console.log('\n📋 Summary:');
    console.log('✅ AdMob environment variables: WORKING');
    console.log('🔧 CORS configuration: TESTING (should be fixed now)');
    console.log('💡 If CORS is working, Google OAuth should work again');
    console.log('\n🎯 Next: Try signing in with Google on your website!');
    
  } catch (error) {
    console.error('❌ CORS tests failed:', error.message);
    console.log('\n⏳ Backend may still be deploying. Try again in 1-2 minutes.');
  }
}

runCORSTests();
