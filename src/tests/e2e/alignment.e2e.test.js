'use strict';

// ─── Task 75: Alignment Dashboard E2E Tests ───────────────────────────────────

const request = require('supertest');
const { createTestUser } = require('../helpers/auth.helper');
const { createMetricHistory } = require('../helpers/factories/metric.factory');

let app;
beforeAll(() => { app = require('../../app'); });

describe('Alignment Dashboard E2E', () => {
  let accessToken;
  let userId;

  beforeEach(async () => {
    const { user, accessToken: token } = await createTestUser();
    accessToken = token;
    userId      = user._id.toString();
  });

  test('GET /alignment/dashboard — unauthenticated returns 401', async () => {
    const res = await request(app).get('/api/v1/alignment/dashboard');
    expect(res.status).toBe(401);
  });

  test('GET /alignment/dashboard — new user returns baseline defaults', async () => {
    const res = await request(app)
      .get('/api/v1/alignment/dashboard')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stateLevel).toBe(2);
    expect(res.body.data.streakCount).toBe(0);
    expect(res.body.data.today).toBeDefined();
    expect(res.body.data.today.logged).toBe(false);
  });

  test('GET /alignment/dashboard — with metric history returns real scores', async () => {
    await createMetricHistory(userId, 7);

    const res = await request(app)
      .get('/api/v1/alignment/dashboard')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.currentScore).toBeGreaterThan(0);
    expect(res.body.data.streakCount).toBeGreaterThanOrEqual(0);
  });

  test('GET /alignment/trend — returns array of metrics', async () => {
    await createMetricHistory(userId, 10);

    const res = await request(app)
      .get('/api/v1/alignment/trend')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(10);
  });

  test('GET /alignment/trend — new user returns empty array', async () => {
    const res = await request(app)
      .get('/api/v1/alignment/trend')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  test('GET /alignment/patterns — returns empty patterns for new user', async () => {
    const res = await request(app)
      .get('/api/v1/alignment/patterns')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.patterns)).toBe(true);
    expect(res.body.data.patterns.length).toBe(0);
  });
});
