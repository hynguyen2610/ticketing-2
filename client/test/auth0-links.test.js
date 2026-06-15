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

  const nextConfig = require('../next.config');
  const rewrites = await nextConfig.rewrites();

  assert.strictEqual(
    findRewrite(rewrites, '/auth/login')?.destination,
    'http://auth-srv:3000/auth/login'
  );
  assert.strictEqual(
    findRewrite(rewrites, '/auth/logout')?.destination,
    'http://auth-srv:3000/auth/logout'
  );
  assert.strictEqual(
    findRewrite(rewrites, '/auth/callback')?.destination,
    'http://auth-srv:3000/auth/callback'
  );

  console.log('Auth0 client link smoke tests passed.');
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
