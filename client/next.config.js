/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.watchOptions.poll = 300;
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/users/:path*',
        destination: 'http://auth-srv:3000/api/users/:path*',
      },
      {
        source: '/auth/login',
        destination: 'http://auth-srv:3000/auth/login',
      },
      {
        source: '/auth/logout',
        destination: 'http://auth-srv:3000/auth/logout',
      },
      {
        source: '/auth/callback',
        destination: 'http://auth-srv:3000/auth/callback',
      },
      {
        source: '/api/tickets/:path*',
        destination: 'http://tickets-srv:3000/api/tickets/:path*',
      },
      {
        source: '/api/orders/:path*',
        destination: 'http://orders-srv:3000/api/orders/:path*',
      },
      {
        source: '/api/payment/:path*',
        destination: 'http://payment-srv:3000/api/payment/:path*',
      },
      {
        source: '/api/images/:path*',
        destination: 'http://image-management-backend-srv:3000/api/images/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
