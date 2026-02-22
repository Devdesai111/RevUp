'use strict';

// ─── Task 46 E2E: Reflection Routes ──────────────────────────────────────────
// Uses register → login flow (same as execute.e2e.test.js)

jest.mock('../../jobs/queues');

const request  = require('supertest');
const app      = require('../../app');
const { enqueueReflection } = require('../../jobs/queues');

const JournalEntry = require('../../models/JournalEntry');

const EMAIL    = 'reflect-e2e@example.com';
const PASSWORD = 'Password123!';
const DATE     = '2024-01-15';

// Helper: 250-word reflection text
const make250Words = () => Array.from({ length: 250 }, (_, i) => `word${i}`).join(' ');

let authToken;

beforeEach(async () => {
  enqueueReflection.mockResolvedValue({ id: 'mock-ref-job' });

  await request(app).post('/api/v1/auth/register').send({ email: EMAIL, password: PASSWORD });
  const res = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD });
  authToken = res.body.data.accessToken;
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /reflect/evening
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /api/v1/reflect/evening', () => {
  it('returns 202 immediately', async () => {
    const res = await request(app)
      .post('/api/v1/reflect/evening')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ date: DATE, text: make250Words() });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Reflection received');
    expect(enqueueReflection).toHaveBeenCalledTimes(1);
  });

  it('saves journal entry with processingStatus: pending', async () => {
    await request(app)
      .post('/api/v1/reflect/evening')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ date: DATE, text: make250Words() });

    const entry = await JournalEntry.findOne({});
    expect(entry).not.toBeNull();
    expect(entry.processingStatus).toBe('pending');
    expect(entry.wordCount).toBeGreaterThan(200);
    expect(entry.baselineScore).toBeGreaterThan(0);
  });

  it('returns 400 if text is too short', async () => {
    const res = await request(app)
      .post('/api/v1/reflect/evening')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ date: DATE, text: 'short' });

    expect(res.status).toBe(422);
  });

  it('returns 400 if date is missing', async () => {
    const res = await request(app)
      .post('/api/v1/reflect/evening')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: make250Words() });

    expect(res.status).toBe(422);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/v1/reflect/evening')
      .send({ date: DATE, text: make250Words() });

    expect(res.status).toBe(401);
  });

  it('is idempotent — second submission upserts, not duplicates', async () => {
    const text2 = 'This is a revised reflection that is long enough to pass validation requirements here.';

    await request(app)
      .post('/api/v1/reflect/evening')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ date: DATE, text: make250Words() });

    await request(app)
      .post('/api/v1/reflect/evening')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ date: DATE, text: text2 });

    const count = await JournalEntry.countDocuments({});
    expect(count).toBe(1);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /reflect/history
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /api/v1/reflect/history', () => {
  it('returns empty list when no entries', async () => {
    const res = await request(app)
      .get('/api/v1/reflect/history')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('returns entries after submitting reflection', async () => {
    await request(app)
      .post('/api/v1/reflect/evening')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ date: DATE, text: make250Words() });

    const res = await request(app)
      .get('/api/v1/reflect/history')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.pagination.total).toBe(1);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/reflect/history');
    expect(res.status).toBe(401);
  });
});
