import request from 'supertest';
import { app } from '../../app';

it('clears the cookie after signing out', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
      password: 'password',
    })
    .expect(201);

  const response = await request(app)
    .post('/api/users/signout')
    .send({})
    .expect(200);

  expect(response.get('Set-Cookie')![0]).toEqual(
    'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly'
  );
});

it('clears Auth0 session metadata after signing out through the local API', async () => {
  const session = {
    jwt: 'internal-jwt',
    auth0User: {
      id: 'local-user-id',
      email: 'auth0@test.com',
      name: 'Auth0 Test User',
      sub: 'auth0|123',
    },
    auth0State: 'test-state',
    auth0CodeVerifier: 'test-code-verifier',
  };
  const sessionJSON = JSON.stringify(session);
  const base64 = Buffer.from(sessionJSON).toString('base64');

  const response = await request(app)
    .post('/api/users/signout')
    .set('Cookie', [`session=${base64}`])
    .send({})
    .expect(200);

  expect(response.get('Set-Cookie')![0]).toEqual(
    'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly'
  );
});
