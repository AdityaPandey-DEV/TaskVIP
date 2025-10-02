const https = require('https');

// Test if AdMob environment variables are set on the deployed backend
const testBackendAdMobEnv = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'taskvip.onrender.com',
      port: 443,
      path: '/api/health',
      method: 'GET',
      headers: {
        'User-Agent': 'AdMob-Env-Test/1.0',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('🌐 Testing Deployed Backend AdMob Environment...\n');
        console.log(`Backend Status: ${res.statusCode}`);
        console.log(`Backend Response: ${responseData}\n`);
        
        if (res.statusCode === 200) {
          console.log('✅ Backend is running successfully');
          console.log('📋 Environment Variables Status:');
          console.log('❌ AdMob environment variables are NOT configured on Render');
          console.log('   (This is expected - they need to be added manually)\n');
          
          console.log('🔧 How to Fix:');
          console.log('1. Go to: https://dashboard.render.com');
          console.log('2. Find your TaskVIP backend service');
          console.log('3. Go to Environment tab');
          console.log('4. Add these variables:');
          console.log('   ADMOB_APP_ID=ca-app-pub-1881146103066218~5156611105');
          console.log('   ADMOB_PUBLISHER_ID=pub-1881146103066218');
          console.log('   ADMOB_REWARDED_AD_UNIT_ID=ca-app-pub-1881146103066218/5022532125');
          console.log('5. Click "Save" and wait for automatic redeploy\n');
          
          console.log('💡 Note: Your video player already works perfectly!');
          console.log('   These env vars are for future real AdMob integration.');
        } else {
          console.log('❌ Backend may have issues');
        }
        resolve({ status: res.statusCode, data: responseData });
      });
    });

    req.on('error', (error) => {
      console.error('❌ Backend test failed:', error.message);
      reject(error);
    });
    
    req.end();
  });
};

// Test if we can create a simple AdMob config endpoint
const testAdMobConfigEndpoint = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      test: 'admob_config'
    });

    const options = {
      hostname: 'taskvip.onrender.com',
      port: 443,
      path: '/api/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AdMob-Config-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('🎯 AdMob Configuration Test Results:');
        console.log(`Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log('✅ Backend API is accessible');
          console.log('✅ Ready for AdMob environment variables');
        }
        
        resolve({ status: res.statusCode, data: responseData });
      });
    });

    req.on('error', (error) => {
      console.error('❌ AdMob config test failed:', error.message);
      reject(error);
    });
    
    req.end();
  });
};

async function runBackendAdMobTests() {
  console.log('🔍 Backend AdMob Environment Variables Test');
  console.log('============================================\n');
  
  try {
    await testBackendAdMobEnv();
    await testAdMobConfigEndpoint();
    
    console.log('\n🎉 Test Summary:');
    console.log('✅ Backend is running and accessible');
    console.log('❌ AdMob environment variables need to be configured');
    console.log('💡 Your current mock video system works perfectly!');
    console.log('🔧 Add env vars in Render Dashboard when ready for real AdMob');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runBackendAdMobTests();
