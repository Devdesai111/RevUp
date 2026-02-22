'use strict';

// ─── E2E: Analytics Routes ────────────────────────────────────────────────────

const request = require('supertest');
const { createTestUser } = require('../helpers/auth.helper');

let app;

beforeAll(() => { app = require('../../app'); });

// ─── GET /analytics/dashboard ─────────────────────────────────────────────────

describe('GET /api/v1/analytics/dashboard', () => {
  it('should return dashboard data for authenticated user', async () => {
    const { accessToken: token } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/analytics/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // getDashboardData returns { trend, heatmap, weekly, drift }
    // sendSuccess wraps it as data → res.body.data = { trend, heatmap, weekly, drift }
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data.trend)).toBe(true);
    expect(Array.isArray(res.body.data.heatmap)).toBe(true);
    expect(Array.isArray(res.body.data.weekly)).toBe(true);
    expect(Array.isArray(res.body.data.drift)).toBe(true);
  });

  it('should return empty arrays for a user with no history', async () => {
    const { accessToken: token } = await createTestUser();

    const res = await request(app)
      .get('/api/v1/analytics/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.trend).toHaveLength(0);
    expect(res.body.data.heatmap).toHaveLength(0);
    expect(res.body.data.weekly).toHaveLength(0);
    expect(res.body.data.drift).toHaveLength(0);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).get('/api/v1/analytics/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
