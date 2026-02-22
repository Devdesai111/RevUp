'use strict';

const request = require('supertest');

// app is imported after env.js loads — implementation doesn't exist yet (TDD: this test fails first)
let app;

beforeAll(() => {
  app = require('../../app');
});

describe('GET /api/v1/health', () => {
  it('should return 200 with status ok', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.environment).toBe('test');
  });

  it('should include uptime and timestamp', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(typeof res.body.data.uptime).toBe('number');
    expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
    expect(typeof res.body.data.timestamp).toBe('string');
  });

  it('should include database connection status', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.data.database).toBeDefined();
    // 'connected' after db.helper connects mongoose; 'disconnected' is also valid here
    expect(['connected', 'disconnected']).toContain(res.body.data.database);
  });

  it('should include redis connection status field', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.data.redis).toBeDefined();
    // Task 4 will establish real redis; for now 'disconnected' is acceptable
    expect(['connected', 'disconnected']).toContain(res.body.data.redis);
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
