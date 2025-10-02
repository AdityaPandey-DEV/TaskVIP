/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
  images: {
    domains: ['localhost', 'taskvip.com'],
  },
  async rewrites() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    // Ensure we don't double-add /api
    const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    console.log('API URL for rewrites:', apiUrl);
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
}

module.exports = nextConfig
