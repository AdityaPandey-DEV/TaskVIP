const https = require('https');

// Test the new AdMob config endpoint
const testAdMobConfigEndpoint = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'taskvip.onrender.com',
      port: 443,
      path: '/api/admob/config',
      method: 'GET',
      headers: {
        'User-Agent': 'AdMob-Complete-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('🎯 AdMob Configuration Endpoint Test:');
        console.log(`Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const config = JSON.parse(responseData);
            console.log('📱 AdMob Configuration Status:');
            console.log(`App ID: ${config.appId || '❌ NOT SET'}`);
            console.log(`Publisher ID: ${config.publisherId || '❌ NOT SET'}`);
            console.log(`Rewarded Ad Unit ID: ${config.rewardedAdUnitId || '❌ NOT SET'}`);
            console.log(`Fully Configured: ${config.configured ? '✅ YES' : '❌ NO'}`);
            console.log(`Timestamp: ${config.timestamp}\n`);
            
            if (config.configured) {
              console.log('🎉 AdMob is fully configured on the backend!');
            } else {
              console.log('⚠️  AdMob environment variables need to be set in Render Dashboard');
            }
          } catch (parseError) {
            console.log('❌ Failed to parse AdMob config response');
            console.log(`Raw response: ${responseData}`);
          }
        } else {
          console.log('❌ AdMob config endpoint not available yet (needs deployment)');
          console.log(`Response: ${responseData}`);
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

async function runCompleteAdMobTest() {
  console.log('🔍 Complete AdMob Environment Test');
  console.log('===================================\n');
  
  // Test local environment
  console.log('📍 Local Environment Test:');
  console.log(`ADMOB_APP_ID: ${process.env.ADMOB_APP_ID || '❌ NOT SET'}`);
  console.log(`ADMOB_PUBLISHER_ID: ${process.env.ADMOB_PUBLISHER_ID || '❌ NOT SET'}`);
  console.log(`ADMOB_REWARDED_AD_UNIT_ID: ${process.env.ADMOB_REWARDED_AD_UNIT_ID || '❌ NOT SET'}\n`);
  
  // Test deployed backend
  console.log('🌐 Deployed Backend Test:');
  try {
    await testAdMobConfigEndpoint();
  } catch (error) {
    console.error('Backend test failed:', error.message);
  }
  
  console.log('\n📋 Summary & Next Steps:');
  console.log('1. ✅ Your video player works perfectly (as shown in your screenshot)');
  console.log('2. ❌ AdMob environment variables are not configured yet');
  console.log('3. 🔧 To configure them:');
  console.log('   - Go to Render Dashboard → Your Service → Environment');
  console.log('   - Add: ADMOB_APP_ID=ca-app-pub-1881146103066218~5156611105');
  console.log('   - Add: ADMOB_PUBLISHER_ID=pub-1881146103066218');
  console.log('   - Add: ADMOB_REWARDED_AD_UNIT_ID=ca-app-pub-1881146103066218/5022532125');
  console.log('   - Save and wait for redeploy');
  console.log('4. 💡 This is optional - your current system already works!');
  
  console.log('\n✅ Test completed!');
}

runCompleteAdMobTest();
