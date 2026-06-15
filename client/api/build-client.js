import axios from 'axios';

const serviceBaseUrl = (hostEnvName, portEnvName, fallbackHost) => {
  const host = process.env[hostEnvName] || fallbackHost;
  const port = process.env[portEnvName] || '3000';

  return `http://${host}:${port}`;
};

const serverApiBaseUrls = [
  {
    prefix: '/api/users',
    baseURL: serviceBaseUrl('AUTH_SRV_SERVICE_HOST', 'AUTH_SRV_SERVICE_PORT', 'auth-srv'),
  },
  {
    prefix: '/api/tickets',
    baseURL: serviceBaseUrl('TICKETS_SRV_SERVICE_HOST', 'TICKETS_SRV_SERVICE_PORT', 'tickets-srv'),
  },
  {
    prefix: '/api/orders',
    baseURL: serviceBaseUrl('ORDERS_SRV_SERVICE_HOST', 'ORDERS_SRV_SERVICE_PORT', 'orders-srv'),
  },
  {
    prefix: '/api/payment',
    baseURL: serviceBaseUrl('PAYMENT_SRV_SERVICE_HOST', 'PAYMENT_SRV_SERVICE_PORT', 'payment-srv'),
  },
  {
    prefix: '/api/images',
    baseURL: serviceBaseUrl(
      'IMAGE_MANAGEMENT_BACKEND_SRV_SERVICE_HOST',
      'IMAGE_MANAGEMENT_BACKEND_SRV_SERVICE_PORT',
      'image-management-backend-srv'
    ),
  },
];

export default ({ req }) => {
  if (typeof window === 'undefined') {
    const serverClient = axios.create({
      headers: req.headers,
      timeout: 3000,
    });

    serverClient.interceptors.request.use((config) => {
      const match = serverApiBaseUrls.find(({ prefix }) => config.url?.startsWith(prefix));

      if (match) {
        config.baseURL = match.baseURL;
      }

      return config;
    });

    return serverClient;
  } else {
    return axios.create({
      baseURL: '/',
    });
  }
};
