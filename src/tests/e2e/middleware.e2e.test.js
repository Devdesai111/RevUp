'use strict';

const request = require('supertest');

let app;

beforeAll(() => {
  app = require('../../app');
});

describe('Security middleware', () => {
  describe('CORS headers', () => {
    it('should return CORS headers for allowed origin', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'http://localhost:3001');

      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle preflight OPTIONS request', async () => {
      const res = await request(app)
        .options('/api/v1/health')
        .set('Origin', 'http://localhost:3001')
        .set('Access-Control-Request-Method', 'GET');

      expect([200, 204]).toContain(res.status);
    });
  });

  describe('Helmet security headers', () => {
    it('should set x-content-type-options header', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set x-frame-options header', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers['x-frame-options']).toBeDefined();
    });
  });

  describe('Global rate limiter', () => {
    it('should include rate limit headers in response', async () => {
      const res = await request(app).get('/api/v1/health');
      // RateLimit-Limit or X-RateLimit-Limit must be present
      const hasRateLimit =
        res.headers['ratelimit-limit'] !== undefined ||
        res.headers['x-ratelimit-limit'] !== undefined;
      expect(hasRateLimit).toBe(true);
    });
  });
});
