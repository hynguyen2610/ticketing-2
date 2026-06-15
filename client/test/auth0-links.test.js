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

const findRewrite = (rewrites, source) => {
  return rewrites.find((rewrite) => rewrite.source === source);
};

const loadNextConfig = () => {
  const nextConfigPath = require.resolve('../next.config');
  delete require.cache[nextConfigPath];

  return require('../next.config');
};

const run = async () => {
  const signin = readClientFile('pages/auth/signin.js');
  const signup = readClientFile('pages/auth/signup.js');
  const signout = readClientFile('pages/auth/signout.js');
  const authError = readClientFile('pages/auth/error.js');

  assertIncludes(signin, 'href="/auth/login"', 'signin page');
  assertIncludes(signin, '<Auth0ErrorAlert query={query} />', 'signin page');
  assertIncludes(signup, 'href="/auth/login?screen_hint=signup"', 'signup page');
  assertIncludes(signup, '<Auth0ErrorAlert query={query} />', 'signup page');
  assertIncludes(signout, "window.location.href = '/auth/logout'", 'signout page');
  assertIncludes(authError, '<Auth0ErrorAlert query={query} />', 'Auth0 error page');
  assertIncludes(authError, 'href="/auth/signin"', 'Auth0 error page');

  const auth0ErrorAlert = readClientFile('components/auth0-error-alert.js');
  assertIncludes(auth0ErrorAlert, 'Auth0 sign-in failed', 'Auth0 error alert');

  const nextConfig = loadNextConfig();
  const rewrites = await nextConfig.rewrites();
  const authBaseUrl = process.env.AUTH_SRV_SERVICE_HOST
    ? `http://${process.env.AUTH_SRV_SERVICE_HOST}:${process.env.AUTH_SRV_SERVICE_PORT || '3000'}`
    : 'http://auth-srv:3000';

  assert.strictEqual(
    findRewrite(rewrites, '/auth/login')?.destination,
    `${authBaseUrl}/auth/login`
  );
  assert.strictEqual(
    findRewrite(rewrites, '/auth/logout')?.destination,
    `${authBaseUrl}/auth/logout`
  );
  assert.strictEqual(
    findRewrite(rewrites, '/auth/callback')?.destination,
    `${authBaseUrl}/auth/callback`
  );

  const previousAuthHost = process.env.AUTH_SRV_SERVICE_HOST;
  const previousAuthPort = process.env.AUTH_SRV_SERVICE_PORT;

  process.env.AUTH_SRV_SERVICE_HOST = '10.96.0.10';
  process.env.AUTH_SRV_SERVICE_PORT = '3000';

  const envNextConfig = loadNextConfig();
  const envRewrites = await envNextConfig.rewrites();

  assert.strictEqual(
    findRewrite(envRewrites, '/auth/login')?.destination,
    'http://10.96.0.10:3000/auth/login'
  );

  if (previousAuthHost === undefined) {
    delete process.env.AUTH_SRV_SERVICE_HOST;
  } else {
    process.env.AUTH_SRV_SERVICE_HOST = previousAuthHost;
  }

  if (previousAuthPort === undefined) {
    delete process.env.AUTH_SRV_SERVICE_PORT;
  } else {
    process.env.AUTH_SRV_SERVICE_PORT = previousAuthPort;
  }

  console.log('Auth0 client link smoke tests passed.');
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
