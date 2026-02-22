'use strict';

const request = require('supertest');
const app = require('../../app');

// ─── Helpers ──────────────────────────────────────────────────────────────────
let authToken;
let userId;

const register = () =>
  request(app).post('/api/v1/auth/register').send({
    email:    'identity-test@example.com',
    password: 'Password123!',
  });

const login = () =>
  request(app).post('/api/v1/auth/login').send({
    email:    'identity-test@example.com',
    password: 'Password123!',
  });

beforeAll(async () => {
  await register();
  const res = await login();
  authToken = res.body.data.accessToken;
  userId    = res.body.data.user._id;
});

describe('GET /api/v1/identity/me', () => {
  it('should return identity profile', async () => {
    const res = await request(app)
      .get('/api/v1/identity/me')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });
});

describe('GET /api/v1/identity/status', () => {
  it('should return completion percentage', async () => {
    const res = await request(app)
      .get('/api/v1/identity/status')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('completionPct');
    expect(res.body.data.completionPct).toBeGreaterThanOrEqual(0);
    expect(res.body.data.completionPct).toBeLessThanOrEqual(100);
  });
});

describe('POST /api/v1/identity/current', () => {
  it('should save current identity and set currentIdentityDone=true', async () => {
    const res = await request(app)
      .post('/api/v1/identity/current')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ role: 'Engineer', energyLevel: 7, executionGapSeverity: 3 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.onboardingSteps.currentIdentityDone).toBe(true);
  });

  it('should reject invalid energyLevel', async () => {
    const res = await request(app)
      .post('/api/v1/identity/current')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ energyLevel: 99 });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/identity/future', () => {
  it('should save future identity and set futureIdentityDone=true', async () => {
    const res = await request(app)
      .post('/api/v1/identity/future')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ desiredRole: 'CTO', incomeRange: '$200k' });
    expect(res.status).toBe(200);
    expect(res.body.data.onboardingSteps.futureIdentityDone).toBe(true);
  });
});

describe('POST /api/v1/identity/constraints', () => {
  it('should save constraints and set constraintsDone=true', async () => {
    const res = await request(app)
      .post('/api/v1/identity/constraints')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ availableHoursPerDay: 4, sleepHours: 8 });
    expect(res.status).toBe(200);
    expect(res.body.data.onboardingSteps.constraintsDone).toBe(true);
  });
});

describe('POST /api/v1/identity/risk', () => {
  it('should compute risk profile and set riskAssessmentDone=true', async () => {
    const res = await request(app)
      .post('/api/v1/identity/risk')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ answers: [3, 2, 4, 1, 5, 3] });
    expect(res.status).toBe(200);
    expect(res.body.data.onboardingSteps.riskAssessmentDone).toBe(true);
    expect(res.body.data.riskProfile).toHaveProperty('stabilityScore');
  });

  it('should reject wrong number of answers', async () => {
    const res = await request(app)
      .post('/api/v1/identity/risk')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ answers: [1, 2, 3] });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/identity/pillars', () => {
  it('should save pillars and set pillarsSelected=true', async () => {
    const res = await request(app)
      .post('/api/v1/identity/pillars')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ pillars: ['career', 'health'] });
    expect(res.status).toBe(200);
    expect(res.body.data.onboardingSteps.pillarsSelected).toBe(true);
  });
});

describe('POST /api/v1/identity/avatar-base', () => {
  it('should save avatar preferences and set avatarCreated=true', async () => {
    const res = await request(app)
      .post('/api/v1/identity/avatar-base')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ genderPresentation: 'neutral', skinTone: 'medium' });
    expect(res.status).toBe(200);
    expect(res.body.data.onboardingSteps.avatarCreated).toBe(true);
  });
});

describe('PATCH /api/v1/identity/declaration', () => {
  it('should update declaration sentence', async () => {
    const res = await request(app)
      .patch('/api/v1/identity/declaration')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ declaration: 'I am becoming a builder who ships with discipline.' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
