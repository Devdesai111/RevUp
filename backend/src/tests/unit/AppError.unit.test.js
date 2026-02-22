'use strict';

const { AppError, Errors } = require('../../utils/AppError');

describe('AppError', () => {
  it('should create an error with correct properties', () => {
    const err = new AppError('Something failed', 400, 'BAD_REQUEST');
    expect(err.message).toBe('Something failed');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.isOperational).toBe(true);
    expect(err.errors).toEqual([]);
    expect(err instanceof Error).toBe(true);
  });

  it('should default statusCode to 500 and code to INTERNAL_ERROR', () => {
    const err = new AppError('oops');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
  });
});

describe('Errors factories', () => {
  const cases = [
    ['userExists',          409, 'USER_EXISTS'],
    ['invalidCredentials',  401, 'INVALID_CREDENTIALS'],
    ['unauthorized',        401, 'UNAUTHORIZED'],
    ['forbidden',           403, 'FORBIDDEN'],
    ['tokenExpired',        401, 'TOKEN_EXPIRED'],
    ['invalidToken',        401, 'INVALID_TOKEN'],
    ['notFound',            404, 'NOT_FOUND'],
    ['identityNotFound',    404, 'IDENTITY_NOT_FOUND'],
    ['planNotFound',        404, 'PLAN_NOT_FOUND'],
    ['validationError',     422, 'VALIDATION_ERROR'],
    ['overcommit',          422, 'OVERCOMMIT'],
    ['rateLimitExceeded',   429, 'RATE_LIMIT_EXCEEDED'],
    ['aiLimitExceeded',     429, 'AI_LIMIT_EXCEEDED'],
    ['premiumRequired',     403, 'PREMIUM_REQUIRED'],
    ['aiUnavailable',       503, 'AI_UNAVAILABLE'],
    ['audioTooLarge',       413, 'AUDIO_TOO_LARGE'],
    ['invalidAudioFormat',  422, 'INVALID_AUDIO_FORMAT'],
    ['conflict',            409, 'CONFLICT'],
    ['badRequest',          400, 'BAD_REQUEST'],
    ['internal',            500, 'INTERNAL_ERROR'],
  ];

  it.each(cases)('Errors.%s() returns correct statusCode and code', (factory, statusCode, code) => {
    const err = Errors[factory]('test message');
    expect(err.statusCode).toBe(statusCode);
    expect(err.code).toBe(code);
    expect(err.isOperational).toBe(true);
  });
});
