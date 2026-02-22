'use strict';

// Mock BullMQ queues so no real Redis connection is needed
jest.mock('../../jobs/queues');

const request  = require('supertest');
const app      = require('../../app');
const { enqueueAlignment } = require('../../jobs/queues');

const EMAIL    = 'execute-test@example.com';
const PASSWORD = 'Password123!';

let authToken;

beforeEach(async () => {
  enqueueAlignment.mockResolvedValue({ id: 'mock-job-id' });

  await request(app).post('/api/v1/auth/register').send({ email: EMAIL, password: PASSWORD });
  const res = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD });
  authToken = res.body.data.accessToken;
});

// ─── Task 39: POST /execute/intent ────────────────────────────────────────────
describe('POST /api/v1/execute/intent', () => {
  it('should declare morning intent and return 200', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await request(app)
      .post('/api/v1/execute/intent')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ date: today });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('intentDeclared', true);
  });

  it('should be idempotent — second call returns 200', async () => {
    const today = new Date().toISOString().slice(0, 10);
    await request(app)
      .post('/api/v1/execute/intent')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ date: today });
    const res2 = await request(app)
      .post('/api/v1/execute/intent')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ date: today });
    expect(res2.status).toBe(200);
  });
});

// ─── Task 38: POST /execute/log ───────────────────────────────────────────────
describe('POST /api/v1/execute/log', () => {
  const today = new Date().toISOString().slice(0, 10);
  const logBody = {
    date:  today,
    tasks: [
      { taskId: 'task-1', taskName: 'Write 1000 words', weight: 3, isCore: true,  completed: true,  effortScore: 8 },
      { taskId: 'task-2', taskName: 'Read 30 mins',      weight: 1, isCore: false, completed: false, effortScore: 0 },
    ],
    habitDone:       true,
    deepWorkMinutes: 90,
  };

  it('should save execution log and return 200', async () => {
    const res = await request(app)
      .post('/api/v1/execute/log')
      .set('Authorization', `Bearer ${authToken}`)
      .send(logBody);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('identityHabitDone', true);
    expect(res.body.data).toHaveProperty('deepWorkMinutes', 90);
  });

  it('should enqueue an alignment job after saving', async () => {
    await request(app)
      .post('/api/v1/execute/log')
      .set('Authorization', `Bearer ${authToken}`)
      .send(logBody);
    expect(enqueueAlignment).toHaveBeenCalled();
  });

  it('second POST same day should return 200 not 409 (upsert)', async () => {
    await request(app)
      .post('/api/v1/execute/log')
      .set('Authorization', `Bearer ${authToken}`)
      .send(logBody);
    const res2 = await request(app)
      .post('/api/v1/execute/log')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ...logBody, deepWorkMinutes: 120 });
    expect(res2.status).toBe(200);
    expect(res2.body.data).toHaveProperty('deepWorkMinutes', 120);
  });
});

// ─── Task 38: POST /execute/timer ─────────────────────────────────────────────
describe('POST /api/v1/execute/timer', () => {
  it('should increment deep work minutes and return 200', async () => {
    const today = new Date().toISOString().slice(0, 10);
    // First create a log entry
    await request(app)
      .post('/api/v1/execute/log')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ date: today, tasks: [], habitDone: false, deepWorkMinutes: 0 });

    const res = await request(app)
      .post('/api/v1/execute/timer')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ minutes: 45 });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('deepWorkMinutes');
  });

  it('should return 404 if no log exists for today', async () => {
    // No log created — should throw notFound
    const res = await request(app)
      .post('/api/v1/execute/timer')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ minutes: 30 });
    expect(res.status).toBe(404);
  });
});

// ─── Task 38: GET /execute/today ──────────────────────────────────────────────
describe('GET /api/v1/execute/today', () => {
  it('should return today log if it exists', async () => {
    const today = new Date().toISOString().slice(0, 10);
    await request(app)
      .post('/api/v1/execute/log')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ date: today, tasks: [], habitDone: false });

    const res = await request(app)
      .get('/api/v1/execute/today')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('logged');
  });

  it('should return empty structure if no log for today', async () => {
    const res = await request(app)
      .get('/api/v1/execute/today')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.logged).toBe(false);
  });
});

// ─── Task 39: POST /execute/commit-voice (premium guard) ─────────────────────
describe('POST /api/v1/execute/commit-voice', () => {
  it('should reject free-tier users with 403', async () => {
    const res = await request(app)
      .post('/api/v1/execute/commit-voice')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(403);
  });
});
