const http = require('http');

// Enhanced health check for Docker and local environments
const options = {
  hostname: process.env.HEALTH_CHECK_HOST || 'localhost',
  port: process.env.PORT || 5000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000, // Increased timeout for better reliability
  headers: {
    'User-Agent': 'HealthCheck/1.0'
  }
};

console.log(`Health check starting for ${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Health check passed:', data);
      process.exit(0);
    } else {
      console.error(`❌ Health check failed with status ${res.statusCode}:`, data);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Health check error:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Health check timeout');
  req.destroy();
  process.exit(1);
});

req.setTimeout(options.timeout);
req.end();
