// Test script to verify deployment status
const https = require('https');

const testEndpoint = (url, description) => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`\n${description}:`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data.substring(0, 200)}...`);
        resolve({ status: res.statusCode, data });
      });
    });
    
    req.on('error', (err) => {
      console.log(`\n${description} - ERROR:`, err.message);
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      console.log(`\n${description} - TIMEOUT`);
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
};

async function testDeployment() {
  console.log('Testing TaskVIP deployment status...\n');
  
  try {
    // Test basic health
    await testEndpoint('https://taskvip.onrender.com/api/stats/dashboard', 'Dashboard Stats Endpoint');
    
    // Test withdrawal methods (this should work)
    await testEndpoint('https://taskvip.onrender.com/api/razorpay-withdrawals/methods', 'Withdrawal Methods Endpoint');
    
    console.log('\n✅ Deployment test completed');
  } catch (error) {
    console.log('\n❌ Deployment test failed:', error.message);
  }
}

testDeployment();
