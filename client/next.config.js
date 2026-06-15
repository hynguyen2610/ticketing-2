const serviceBaseUrl = (hostEnvName, portEnvName, fallbackHost) => {
  const host = process.env[hostEnvName] || fallbackHost;
  const port = process.env[portEnvName] || '3000';

  return `http://${host}:${port}`;
};

const serviceBaseUrls = {
  auth: serviceBaseUrl('AUTH_SRV_SERVICE_HOST', 'AUTH_SRV_SERVICE_PORT', 'auth-srv'),
  tickets: serviceBaseUrl('TICKETS_SRV_SERVICE_HOST', 'TICKETS_SRV_SERVICE_PORT', 'tickets-srv'),
  orders: serviceBaseUrl('ORDERS_SRV_SERVICE_HOST', 'ORDERS_SRV_SERVICE_PORT', 'orders-srv'),
  payment: serviceBaseUrl('PAYMENT_SRV_SERVICE_HOST', 'PAYMENT_SRV_SERVICE_PORT', 'payment-srv'),
  images: serviceBaseUrl(
    'IMAGE_MANAGEMENT_BACKEND_SRV_SERVICE_HOST',
    'IMAGE_MANAGEMENT_BACKEND_SRV_SERVICE_PORT',
    'image-management-backend-srv'
  ),
};

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
        destination: `${serviceBaseUrls.auth}/api/users/:path*`,
      },
      {
        source: '/auth/login',
        destination: `${serviceBaseUrls.auth}/auth/login`,
      },
      {
        source: '/auth/logout',
        destination: `${serviceBaseUrls.auth}/auth/logout`,
      },
      {
        source: '/auth/callback',
        destination: `${serviceBaseUrls.auth}/auth/callback`,
      },
      {
        source: '/api/tickets/:path*',
        destination: `${serviceBaseUrls.tickets}/api/tickets/:path*`,
      },
      {
        source: '/api/orders/:path*',
        destination: `${serviceBaseUrls.orders}/api/orders/:path*`,
      },
      {
        source: '/api/payment/:path*',
        destination: `${serviceBaseUrls.payment}/api/payment/:path*`,
      },
      {
        source: '/api/images/:path*',
        destination: `${serviceBaseUrls.images}/api/images/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
