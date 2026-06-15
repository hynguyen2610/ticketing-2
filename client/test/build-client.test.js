const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const readClientFile = (relativePath) => {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
};

const assertIncludes = (content, expected, label) => {
  assert(
    content.includes(expected),
    `${label} should include ${expected}`
  );
};

const assertExcludes = (content, expected, label) => {
  assert(
    !content.includes(expected),
    `${label} should not include ${expected}`
  );
};

const run = () => {
  const buildClient = readClientFile('api/build-client.js');
  const app = readClientFile('pages/_app.js');
  const index = readClientFile('pages/index.js');

  assertIncludes(buildClient, 'serviceBaseUrl', 'build client');
  assertIncludes(buildClient, "'AUTH_SRV_SERVICE_HOST'", 'build client');
  assertIncludes(buildClient, "'TICKETS_SRV_SERVICE_HOST'", 'build client');
  assertIncludes(buildClient, "'ORDERS_SRV_SERVICE_HOST'", 'build client');
  assertIncludes(buildClient, "'PAYMENT_SRV_SERVICE_HOST'", 'build client');
  assertIncludes(buildClient, "'IMAGE_MANAGEMENT_BACKEND_SRV_SERVICE_HOST'", 'build client');
  assertIncludes(buildClient, 'serverClient.interceptors.request.use', 'build client');
  assertIncludes(buildClient, 'timeout: 3000', 'build client');
  assertExcludes(buildClient, "baseURL: 'http://client-srv:3000'", 'build client');
  assertIncludes(app, 'currentUser = null', 'app current user fallback');
  assertIncludes(app, 'catch (err)', 'app current user fallback');
  assertIncludes(index, 'return { tickets: [] }', 'homepage ticket fallback');

  console.log('Client server API routing tests passed.');
};

try {
  run();
} catch (err) {
  console.error(err);
  process.exit(1);
}
