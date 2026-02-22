'use strict';

const request = require('supertest');
const { Errors } = require('../../utils/AppError');

let app;

beforeAll(() => {
  app = require('../../app');
});

describe('Global error handler', () => {
  it('should handle 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('should handle AppError thrown via next(err)', async () => {
    // We test this via a test-only route registered in the test itself
    const express = require('express');
    const testApp = express();
    testApp.use(express.json());

    testApp.get('/test-err', (_req, _res, next) => {
      next(Errors.forbidden('Access denied test'));
    });

    // Mount the error middleware from the module under test
    const errorMiddleware = require('../../middlewares/error.mid');
    testApp.use(errorMiddleware);

    const res = await request(testApp).get('/test-err');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
    expect(res.body.message).toBe('Access denied test');
  });

  it('should handle generic Error as 500', async () => {
    const express = require('express');
    const testApp = express();
    testApp.use(express.json());

    testApp.get('/test-generic', (_req, _res, next) => {
      next(new Error('Something blew up'));
    });

    const errorMiddleware = require('../../middlewares/error.mid');
    testApp.use(errorMiddleware);

    const res = await request(testApp).get('/test-generic');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INTERNAL_ERROR');
  });

  it('should map Mongoose duplicate key (11000) to 409', async () => {
    const express = require('express');
    const testApp = express();
    testApp.use(express.json());

    testApp.get('/test-dup', (_req, _res, next) => {
      const err = new Error('Duplicate key');
      err.code = 11000;
      err.keyValue = { email: 'test@test.com' };
      next(err);
    });

    const errorMiddleware = require('../../middlewares/error.mid');
    testApp.use(errorMiddleware);

    const res = await request(testApp).get('/test-dup');
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });
});
