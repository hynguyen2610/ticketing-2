import request from 'supertest';
import { app } from '../../app';

it('responds with details about the current user', async () => {
  const cookie = await global.signin();

  const response = await request(app)
    .get('/api/users/currentuser')
    .set('Cookie', cookie)
    .send()
    .expect(200);

  expect(response.body.currentUser.email).toEqual('test@test.com');
});

it('responds with null if not authenticated', async () => {
  const response = await request(app)
    .get('/api/users/currentuser')
    .send()
    .expect(200);

  expect(response.body.currentUser).toEqual(null);
});

it('responds with Auth0 session user details', async () => {
  const session = {
    auth0User: {
      id: 'local-user-id',
      email: 'auth0@test.com',
      name: 'Auth0 Test User',
      sub: 'auth0|123',
    },
  };
  const sessionJSON = JSON.stringify(session);
  const base64 = Buffer.from(sessionJSON).toString('base64');

  const response = await request(app)
    .get('/api/users/currentuser')
    .set('Cookie', [`session=${base64}`])
    .send()
    .expect(200);

  expect(response.body.currentUser).toEqual(session.auth0User);
});
