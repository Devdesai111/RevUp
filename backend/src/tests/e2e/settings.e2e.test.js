'use strict';

// ─── E2E: Settings Routes ─────────────────────────────────────────────────────

const request = require('supertest');
const { createTestUser } = require('../helpers/auth.helper');

let app;

beforeAll(() => { app = require('../../app'); });

// ─── PATCH /settings/notifications ───────────────────────────────────────────

describe('PATCH /api/v1/settings/notifications', () => {
  let token;

  beforeEach(async () => {
    ({ accessToken: token } = await createTestUser());
  });

  it('should update morning and evening notification prefs', async () => {
    const res = await request(app)
      .patch('/api/v1/settings/notifications')
      .set('Authorization', `Bearer ${token}`)
      .send({ morning: false, evening: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notificationPreferences).toBeDefined();
    expect(res.body.data.notificationPreferences.morning).toBe(false);
    expect(res.body.data.notificationPreferences.evening).toBe(true);
  });

  it('should allow partial updates (only drift)', async () => {
    const res = await request(app)
      .patch('/api/v1/settings/notifications')
      .set('Authorization', `Bearer ${token}`)
      .send({ drift: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notificationPreferences.drift).toBe(false);
  });

  it('should reject non-boolean values with 422', async () => {
    const res = await request(app)
      .patch('/api/v1/settings/notifications')
      .set('Authorization', `Bearer ${token}`)
      .send({ morning: 'yes' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .patch('/api/v1/settings/notifications')
      .send({ morning: true });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─── PATCH /settings/fcm-token ───────────────────────────────────────────────

describe('PATCH /api/v1/settings/fcm-token', () => {
  let token;

  beforeEach(async () => {
    ({ accessToken: token } = await createTestUser());
  });

  it('should update FCM token successfully', async () => {
    const res = await request(app)
      .patch('/api/v1/settings/fcm-token')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: 'firebase-token-abc123-valid-length' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject short FCM token with 422', async () => {
    const res = await request(app)
      .patch('/api/v1/settings/fcm-token')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: 'short' }); // < 10 chars

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('should reject missing token field with 422', async () => {
    const res = await request(app)
      .patch('/api/v1/settings/fcm-token')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(422);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app)
      .patch('/api/v1/settings/fcm-token')
      .send({ token: 'some-valid-fcm-token-here' });

    expect(res.status).toBe(401);
  });
});

// ─── GET /settings/subscription ──────────────────────────────────────────────

describe('GET /api/v1/settings/subscription', () => {
  it('should return subscription info for free user', async () => {
    const { accessToken: token } = await createTestUser({ subscriptionTier: 'free' });

    const res = await request(app)
      .get('/api/v1/settings/subscription')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tier).toBe('free');
    expect(res.body.data.isPremium).toBe(false);
  });

  it('should return subscription info for premium user', async () => {
    const { accessToken: token } = await createTestUser({ subscriptionTier: 'premium' });

    const res = await request(app)
      .get('/api/v1/settings/subscription')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tier).toBe('premium');
    expect(res.body.data.isPremium).toBe(true);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/v1/settings/subscription');
    expect(res.status).toBe(401);
  });
});
