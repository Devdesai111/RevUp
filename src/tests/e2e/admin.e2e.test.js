'use strict';

// ─── E2E: Admin Routes ────────────────────────────────────────────────────────

const request = require('supertest');
const { createTestUser, createAdminUser } = require('../helpers/auth.helper');

let app;

beforeAll(() => { app = require('../../app'); });

// ─── POST /admin/calibrate/:userId ───────────────────────────────────────────

describe('POST /api/v1/admin/calibrate/:userId', () => {
  it('should enqueue recalculation for admin user', async () => {
    const { user: targetUser }          = await createTestUser();
    const { accessToken: adminToken }   = await createAdminUser();

    const res = await request(app)
      .post(`/api/v1/admin/calibrate/${targetUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe(targetUser._id.toString());
  });

  it('should return 403 for non-admin user', async () => {
    const { user: targetUser }           = await createTestUser();
    const { accessToken: regularToken }  = await createTestUser();

    const res = await request(app)
      .post(`/api/v1/admin/calibrate/${targetUser._id}`)
      .set('Authorization', `Bearer ${regularToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 without auth', async () => {
    const { user } = await createTestUser();
    const res = await request(app)
      .post(`/api/v1/admin/calibrate/${user._id}`);

    expect(res.status).toBe(401);
  });
});

// ─── GET /admin/users ─────────────────────────────────────────────────────────

describe('GET /api/v1/admin/users', () => {
  let adminToken;
  let regularToken;

  beforeEach(async () => {
    ({ accessToken: adminToken }   = await createAdminUser());
    ({ accessToken: regularToken } = await createTestUser());
    // Seed a couple of extra users so the list is non-empty
    await createTestUser({ subscriptionTier: 'premium' });
    await createTestUser({ subscriptionTier: 'free' });
  });

  it('should return paginated user list for admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(20);
    // passwordHash must never be returned
    res.body.data.forEach((u) => expect(u.passwordHash).toBeUndefined());
  });

  it('should filter by tier when ?tier=premium', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users?tier=premium')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((u) => expect(u.subscriptionTier).toBe('premium'));
  });

  it('should return 403 for non-admin user', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${regularToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/v1/admin/users');
    expect(res.status).toBe(401);
  });
});

// ─── GET /admin/metrics ───────────────────────────────────────────────────────

describe('GET /api/v1/admin/metrics', () => {
  let adminToken;
  let regularToken;

  beforeEach(async () => {
    ({ accessToken: adminToken }   = await createAdminUser());
    ({ accessToken: regularToken } = await createTestUser());
  });

  it('should return platform metrics for admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.totalActiveUsers).toBe('number');
    expect(typeof res.body.data.premiumUsers).toBe('number');
    expect(typeof res.body.data.totalAlignmentMetrics).toBe('number');
    expect(res.body.data.platformAverageScore).toBeDefined();
  });

  it('should return 403 for non-admin user', async () => {
    const res = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', `Bearer ${regularToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/v1/admin/metrics');
    expect(res.status).toBe(401);
  });
});
