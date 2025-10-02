const https = require('https');

// Test if AdMob environment variables are accessible on the backend
const testAdMobEnv = () => {
  console.log('🧪 Testing AdMob Environment Variables...\n');
  
  // Test backend environment variables
  console.log('📱 Backend AdMob Environment Variables:');
  console.log(`ADMOB_APP_ID: ${process.env.ADMOB_APP_ID || '❌ NOT SET'}`);
  console.log(`ADMOB_PUBLISHER_ID: ${process.env.ADMOB_PUBLISHER_ID || '❌ NOT SET'}`);
  console.log(`ADMOB_REWARDED_AD_UNIT_ID: ${process.env.ADMOB_REWARDED_AD_UNIT_ID || '❌ NOT SET'}\n`);
  
  // Expected values
  console.log('✅ Expected Values:');
  console.log('ADMOB_APP_ID: ca-app-pub-1881146103066218~5156611105');
  console.log('ADMOB_PUBLISHER_ID: pub-1881146103066218');
  console.log('ADMOB_REWARDED_AD_UNIT_ID: ca-app-pub-1881146103066218/5022532125\n');
  
  // Validation
  const expectedAppId = 'ca-app-pub-1881146103066218~5156611105';
  const expectedPublisherId = 'pub-1881146103066218';
  const expectedAdUnitId = 'ca-app-pub-1881146103066218/5022532125';
  
  const appIdMatch = process.env.ADMOB_APP_ID === expectedAppId;
  const publisherIdMatch = process.env.ADMOB_PUBLISHER_ID === expectedPublisherId;
  const adUnitIdMatch = process.env.ADMOB_REWARDED_AD_UNIT_ID === expectedAdUnitId;
  
  console.log('🔍 Validation Results:');
  console.log(`App ID: ${appIdMatch ? '✅ CORRECT' : '❌ INCORRECT/MISSING'}`);
  console.log(`Publisher ID: ${publisherIdMatch ? '✅ CORRECT' : '❌ INCORRECT/MISSING'}`);
  console.log(`Ad Unit ID: ${adUnitIdMatch ? '✅ CORRECT' : '❌ INCORRECT/MISSING'}\n`);
  
  if (appIdMatch && publisherIdMatch && adUnitIdMatch) {
    console.log('🎉 All AdMob environment variables are correctly configured!');
  } else {
    console.log('⚠️  Some AdMob environment variables need to be configured.');
    console.log('📋 Next Steps:');
    console.log('1. Go to Render Dashboard → Your Service → Environment');
    console.log('2. Add the missing environment variables');
    console.log('3. Redeploy your service');
  }
};

// Test backend API endpoint for AdMob configuration
const testBackendAdMobAPI = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'taskvip.onrender.com',
      port: 443,
      path: '/api/health',
      method: 'GET',
      headers: {
        'User-Agent': 'AdMob-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('\n🌐 Backend API Test:');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${responseData}`);
        
        if (res.statusCode === 200) {
          console.log('✅ Backend is accessible and running');
        } else {
          console.log('❌ Backend may have issues');
        }
        resolve({ status: res.statusCode, data: responseData });
      });
    });

    req.on('error', (error) => {
      console.error('❌ Backend API test failed:', error.message);
      reject(error);
    });
    
    req.end();
  });
};

// Run tests
async function runAdMobTests() {
  console.log('🔧 AdMob Environment Variables Test\n');
  console.log('==========================================\n');
  
  // Test local environment variables
  testAdMobEnv();
  
  // Test backend API
  try {
    await testBackendAdMobAPI();
  } catch (error) {
    console.error('Backend test failed:', error.message);
  }
  
  console.log('\n==========================================');
  console.log('📋 Summary:');
  console.log('- Local env test shows what variables are available locally');
  console.log('- Backend API test checks if the deployed backend is running');
  console.log('- For production, variables must be set in Render Dashboard');
  console.log('\n✅ Test completed!');
}

runAdMobTests();
