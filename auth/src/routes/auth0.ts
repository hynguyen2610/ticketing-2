import express from 'express';
import jwt from 'jsonwebtoken';
import { Issuer, generators, Client } from 'openid-client';
import { BadRequestError } from '@ndhcode/common';
import { User } from '../models/user';

const router = express.Router();
let auth0Client: Client | undefined;

const getAuth0Client = async () => {
  if (auth0Client) {
    return auth0Client;
  }

  const {
    AUTH0_DOMAIN,
    AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET,
  } = process.env;

  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_CLIENT_SECRET) {
    throw new Error('Auth0 environment variables are required for Auth0 login routes');
  }

  const issuer = await Issuer.discover(`https://${AUTH0_DOMAIN}`);
  auth0Client = new issuer.Client({
    client_id: AUTH0_CLIENT_ID,
    client_secret: AUTH0_CLIENT_SECRET,
  });

  return auth0Client;
};

const buildAuthUrlOptions = (screenHint?: string) => {
  const {
    AUTH0_CALLBACK_URL,
    AUTH0_AUDIENCE,
  } = process.env;

  if (!AUTH0_CALLBACK_URL) {
    throw new Error('AUTH0_CALLBACK_URL must be defined for Auth0 login flow');
  }

  const options: Record<string, unknown> = {
    scope: 'openid profile email',
    response_type: 'code',
    redirect_uri: AUTH0_CALLBACK_URL,
    screen_hint: screenHint,
  };

  if (AUTH0_AUDIENCE) {
    options.audience = AUTH0_AUDIENCE;
  }

  return options;
};

router.get('/auth/login', async (req, res, next) => {
  try {
    const client = await getAuth0Client();
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);
    const state = generators.random();
    const screenHint = req.query.screen_hint === 'signup' ? 'signup' : undefined;
    const sessionData = req.session || {};

    req.session = {
      ...sessionData,
      auth0CodeVerifier: codeVerifier,
      auth0State: state,
    };

    const options = buildAuthUrlOptions(screenHint);
    const authUrl = client.authorizationUrl({
      ...options,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    });

    res.redirect(authUrl);
  } catch (err) {
    next(err);
  }
});

router.get('/auth/callback', async (req, res, next) => {
  try {
    const { code, state } = req.query;
    const session = req.session as any;

    if (!code || !state || !session?.auth0State || !session?.auth0CodeVerifier) {
      throw new BadRequestError('Invalid Auth0 callback state');
    }
    if (state !== session.auth0State) {
      throw new BadRequestError('Auth0 callback state mismatch');
    }

    const client = await getAuth0Client();
    const tokenSet = await client.callback(
      process.env.AUTH0_CALLBACK_URL!,
      { code: code as string, state: state as string },
      { code_verifier: session.auth0CodeVerifier }
    );

    const claims = tokenSet.claims();
    const email = claims.email;
    if (!email || typeof email !== 'string') {
      throw new BadRequestError('Auth0 user profile must include email');
    }

    let user: any = await User.findOne({ email });
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(2);
      user = await User.build({ email, password: randomPassword }).save();
    }

    const userJwt = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_KEY!
    );

    req.session = {
      ...req.session,
      jwt: userJwt,
      auth0IdToken: tokenSet.id_token,
      auth0AccessToken: tokenSet.access_token,
      auth0User: {
        id: user.id,
        email,
        name: claims.name,
        sub: claims.sub,
      },
    };

    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

router.get('/auth/logout', (req, res) => {
  req.session = null;

  const {
    AUTH0_DOMAIN,
    AUTH0_CLIENT_ID,
    AUTH0_LOGOUT_REDIRECT_URL,
  } = process.env;

  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_LOGOUT_REDIRECT_URL) {
    return res.redirect('/');
  }

  const logoutUrl = `https://${AUTH0_DOMAIN}/v2/logout?client_id=${AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(
    AUTH0_LOGOUT_REDIRECT_URL
  )}`;
  res.redirect(logoutUrl);
});

export { router as auth0Router };
