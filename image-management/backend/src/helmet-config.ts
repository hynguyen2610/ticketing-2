export const helmetConfig = {
  useDefaults: true,
  directives: {
    'default-src': ["'self'"],  // Allow only content from the same origin
    'script-src': ["'self'", "'unsafe-inline'"],  // Allow scripts from the same origin and inline scripts (if necessary)
    'style-src': ["'self'", "'unsafe-inline'"],  // Allow styles from the same origin and inline styles (if necessary)
    'img-src': ["'self'", "data:"],  // Allow images from the same origin and data URIs
    'font-src': ["'self'"],  // Allow fonts from the same origin
    'connect-src': ["'self'"],  // Allow connections (e.g., API requests) from the same origin
    'frame-src': ["'none'"],  // Disallow embedding content in frames
    'object-src': ["'none'"],  // Disallow Flash, Java, or other plugins
    'form-action': ["'self'"],  // Allow form submission to the same origin
    'upgrade-insecure-requests': [],  // Automatically upgrade HTTP requests to HTTPS
    'block-all-mixed-content': []  // Block mixed content (HTTP content on HTTPS pages)
  }
};
