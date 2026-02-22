'use strict';

const request = require('supertest');
const app = require('../../app');

let authToken;

const EMAIL    = 'avatar-test@example.com';
const PASSWORD = 'Password123!';

beforeEach(async () => {
  await request(app).post('/api/v1/auth/register').send({ email: EMAIL, password: PASSWORD });
  const res = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD });
  authToken = res.body.data.accessToken;
});

describe('GET /api/v1/avatar/state', () => {
  it('should return state 2 (stable) for a new user with no metrics', async () => {
    const res = await request(app)
      .get('/api/v1/avatar/state')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('stateLevel');
    expect(res.body.data).toHaveProperty('name');
    expect(res.body.data).toHaveProperty('visual');
    expect([1, 2, 3]).toContain(res.body.data.stateLevel);
  });

  it('new user should default to Stable (level 2)', async () => {
    const res = await request(app)
      .get('/api/v1/avatar/state')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.stateLevel).toBe(2);
    expect(res.body.data.name).toBe('Stable');
  });
});
