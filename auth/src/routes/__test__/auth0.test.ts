import request from 'supertest';
import { app } from '../../app';
import { User } from '../../models/user';
import { Issuer, generators } from 'openid-client';

const mockAuthorizationUrl = jest.fn();
const mockCallback = jest.fn();
const mockClientConstructor = jest.fn();
const mockClaims = jest.fn();

jest.mock('openid-client', () => ({
  Issuer: {
    discover: jest.fn(),
  },
  generators: {
    codeVerifier: jest.fn(),
    codeChallenge: jest.fn(),
    random: jest.fn(),
  },
}));

const buildSessionCookie = (session: Record<string, unknown>) => {
  const sessionJSON = JSON.stringify(session);
  const base64 = Buffer.from(sessionJSON).toString('base64');
  return [`session=${base64}`];
};

const readSessionCookie = (cookies: string[]) => {
  const sessionCookie = cookies
    .find((cookie) => cookie.startsWith('session='))
    ?.split(';')[0]
    .replace('session=', '');

  if (!sessionCookie) {
    throw new Error('Expected session cookie to be set');
  }

  return JSON.parse(Buffer.from(decodeURIComponent(sessionCookie), 'base64').toString('utf8'));
};

beforeEach(() => {
  process.env.AUTH0_DOMAIN = 'dev-example.us.auth0.com';
  process.env.AUTH0_CLIENT_ID = 'auth0-client-id';
  process.env.AUTH0_CLIENT_SECRET = 'auth0-client-secret';
  process.env.AUTH0_CALLBACK_URL = 'http://localhost:3000/auth/callback';
  process.env.AUTH0_LOGOUT_REDIRECT_URL = 'http://localhost:3000';
  process.env.AUTH0_AUDIENCE = 'https://ticketing.example.test';

  mockAuthorizationUrl.mockReturnValue('https://dev-example.us.auth0.com/authorize');
  mockClaims.mockReturnValue({
    email: 'auth0@test.com',
    name: 'Auth0 Test User',
    sub: 'auth0|123',
  });
  mockCallback.mockResolvedValue({
    id_token: 'auth0-id-token',
    access_token: 'auth0-access-token',
    claims: mockClaims,
  });
  mockClientConstructor.mockReturnValue({
    authorizationUrl: mockAuthorizationUrl,
    callback: mockCallback,
  });

  (Issuer.discover as jest.Mock).mockResolvedValue({
    Client: mockClientConstructor,
  });
  (generators.codeVerifier as jest.Mock).mockReturnValue('test-code-verifier');
  (generators.codeChallenge as jest.Mock).mockReturnValue('test-code-challenge');
  (generators.random as jest.Mock).mockReturnValue('test-state');
});

afterEach(() => {
  jest.clearAllMocks();
});

it('redirects to Auth0 and stores PKCE state in the session', async () => {
  const response = await request(app)
    .get('/auth/login')
    .send()
    .expect(302);

  expect(Issuer.discover).toHaveBeenCalledWith('https://dev-example.us.auth0.com');
  expect(mockClientConstructor).toHaveBeenCalledWith({
    client_id: 'auth0-client-id',
    client_secret: 'auth0-client-secret',
  });
  expect(mockAuthorizationUrl).toHaveBeenCalledWith({
    scope: 'openid profile email',
    response_type: 'code',
    redirect_uri: 'http://localhost:3000/auth/callback',
    screen_hint: undefined,
    audience: 'https://ticketing.example.test',
    code_challenge: 'test-code-challenge',
    code_challenge_method: 'S256',
    state: 'test-state',
  });
  expect(response.get('Location')).toEqual('https://dev-example.us.auth0.com/authorize');
  expect(response.get('Set-Cookie')).toBeDefined();

  const session = readSessionCookie(response.get('Set-Cookie')!);
  expect(session.auth0CodeVerifier).toEqual('test-code-verifier');
  expect(session.auth0State).toEqual('test-state');
});

it('rejects Auth0 login when required Auth0 env vars are missing', async () => {
  delete process.env.AUTH0_DOMAIN;

  await request(app)
    .get('/auth/login')
    .send()
    .expect(400);

  expect(Issuer.discover).not.toHaveBeenCalled();
});

it('passes the Auth0 signup screen hint when requested', async () => {
  await request(app)
    .get('/auth/login?screen_hint=signup')
    .send()
    .expect(302);

  expect(mockAuthorizationUrl).toHaveBeenCalledWith(
    expect.objectContaining({
      screen_hint: 'signup',
    })
  );
});

it('rejects callback requests with mismatched state', async () => {
  await request(app)
    .get('/auth/callback?code=auth-code&state=wrong-state')
    .set('Cookie', buildSessionCookie({
      auth0State: 'test-state',
      auth0CodeVerifier: 'test-code-verifier',
    }))
    .send()
    .expect(400);

  expect(mockCallback).not.toHaveBeenCalled();
});

it('redirects Auth0 callback errors to the error page with feedback details', async () => {
  const response = await request(app)
    .get('/auth/callback?error=access_denied&error_description=User%20cancelled%20login')
    .set('Cookie', buildSessionCookie({
      auth0State: 'test-state',
      auth0CodeVerifier: 'test-code-verifier',
      returnTo: '/orders',
    }))
    .send()
    .expect(302);

  expect(response.get('Location')).toEqual(
    '/auth/error?error=access_denied&error_description=User+cancelled+login'
  );
  expect(response.get('Set-Cookie')).toBeDefined();

  const session = readSessionCookie(response.get('Set-Cookie')!);
  expect(session.auth0State).toBeUndefined();
  expect(session.auth0CodeVerifier).toBeUndefined();
  expect(session.returnTo).toEqual('/orders');
  expect(mockCallback).not.toHaveBeenCalled();
});

it('creates a local user and session after a successful Auth0 callback', async () => {
  const response = await request(app)
    .get('/auth/callback?code=auth-code&state=test-state')
    .set('Cookie', buildSessionCookie({
      auth0State: 'test-state',
      auth0CodeVerifier: 'test-code-verifier',
    }))
    .send()
    .expect(302);

  const user = await User.findOne({ email: 'auth0@test.com' });

  expect(mockCallback).toHaveBeenCalledWith(
    'http://localhost:3000/auth/callback',
    { code: 'auth-code', state: 'test-state' },
    { code_verifier: 'test-code-verifier' }
  );
  expect(user).toBeDefined();
  expect(user!.auth0Sub).toEqual('auth0|123');
  expect(response.get('Location')).toEqual('/');
  expect(response.get('Set-Cookie')).toBeDefined();

  const session = readSessionCookie(response.get('Set-Cookie')!);
  expect(session.jwt).toBeDefined();
  expect(session.auth0User).toEqual({
    id: user!.id,
    email: 'auth0@test.com',
    name: 'Auth0 Test User',
    sub: 'auth0|123',
  });
  expect(session.auth0IdToken).toBeUndefined();
  expect(session.auth0AccessToken).toBeUndefined();
  expect(session.auth0State).toBeUndefined();
  expect(session.auth0CodeVerifier).toBeUndefined();
});

it('reuses an existing user matched by Auth0 subject when the email changes', async () => {
  const existingUser = await User.build({
    email: 'old-email@test.com',
    password: 'password',
    auth0Sub: 'auth0|123',
  }).save();

  const response = await request(app)
    .get('/auth/callback?code=auth-code&state=test-state')
    .set('Cookie', buildSessionCookie({
      auth0State: 'test-state',
      auth0CodeVerifier: 'test-code-verifier',
    }))
    .send()
    .expect(302);

  const users = await User.find({});
  const updatedUser = await User.findById(existingUser.id);
  const session = readSessionCookie(response.get('Set-Cookie')!);

  expect(users).toHaveLength(1);
  expect(updatedUser!.email).toEqual('auth0@test.com');
  expect(session.auth0User.id).toEqual(existingUser.id);
  expect(session.auth0User.email).toEqual('auth0@test.com');
});

it('rejects Auth0 callback when subject matches but new email belongs to another user', async () => {
  await User.build({
    email: 'old-email@test.com',
    password: 'password',
    auth0Sub: 'auth0|123',
  }).save();
  await User.build({
    email: 'auth0@test.com',
    password: 'password',
  }).save();

  await request(app)
    .get('/auth/callback?code=auth-code&state=test-state')
    .set('Cookie', buildSessionCookie({
      auth0State: 'test-state',
      auth0CodeVerifier: 'test-code-verifier',
    }))
    .send()
    .expect(400);
});

it('links an existing local user to Auth0 by email when not linked yet', async () => {
  const existingUser = await User.build({
    email: 'auth0@test.com',
    password: 'password',
  }).save();

  await request(app)
    .get('/auth/callback?code=auth-code&state=test-state')
    .set('Cookie', buildSessionCookie({
      auth0State: 'test-state',
      auth0CodeVerifier: 'test-code-verifier',
    }))
    .send()
    .expect(302);

  const user = await User.findById(existingUser.id);
  const users = await User.find({});

  expect(users).toHaveLength(1);
  expect(user!.auth0Sub).toEqual('auth0|123');
});

it('rejects Auth0 callback when the email is linked to a different Auth0 subject', async () => {
  await User.build({
    email: 'auth0@test.com',
    password: 'password',
    auth0Sub: 'auth0|different',
  }).save();

  await request(app)
    .get('/auth/callback?code=auth-code&state=test-state')
    .set('Cookie', buildSessionCookie({
      auth0State: 'test-state',
      auth0CodeVerifier: 'test-code-verifier',
    }))
    .send()
    .expect(400);
});

it('rejects Auth0 callback when the profile does not include an email', async () => {
  mockClaims.mockReturnValue({
    name: 'Auth0 Test User',
    sub: 'auth0|123',
  });

  await request(app)
    .get('/auth/callback?code=auth-code&state=test-state')
    .set('Cookie', buildSessionCookie({
      auth0State: 'test-state',
      auth0CodeVerifier: 'test-code-verifier',
    }))
    .send()
    .expect(400);
});

it('rejects Auth0 callback when the profile does not include a subject', async () => {
  mockClaims.mockReturnValue({
    email: 'auth0@test.com',
    name: 'Auth0 Test User',
  });

  await request(app)
    .get('/auth/callback?code=auth-code&state=test-state')
    .set('Cookie', buildSessionCookie({
      auth0State: 'test-state',
      auth0CodeVerifier: 'test-code-verifier',
    }))
    .send()
    .expect(400);
});

it('redirects through Auth0 logout when Auth0 logout env vars are configured', async () => {
  const response = await request(app)
    .get('/auth/logout')
    .send()
    .expect(302);

  expect(response.get('Location')).toEqual(
    'https://dev-example.us.auth0.com/v2/logout?client_id=auth0-client-id&returnTo=http%3A%2F%2Flocalhost%3A3000'
  );
  expect(response.get('Set-Cookie')).toBeDefined();
});
