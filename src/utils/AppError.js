'use strict';

class AppError extends Error {
  /**
   * @param {string} message   Human-readable message
   * @param {number} statusCode HTTP status code
   * @param {string} code       Machine-readable error code
   * @param {Array}  errors     Validation / field-level error details
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', errors = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Factory methods ──────────────────────────────────────────────────────────
// Use these everywhere — never construct AppError directly in controllers.

const Errors = {
  // ── Auth ───────────────────────────────────────────────────────────────────
  userExists: (message = 'User already exists') =>
    new AppError(message, 409, 'USER_EXISTS'),

  invalidCredentials: (message = 'Invalid email or password') =>
    new AppError(message, 401, 'INVALID_CREDENTIALS'),

  unauthorized: (message = 'Unauthorized') =>
    new AppError(message, 401, 'UNAUTHORIZED'),

  forbidden: (message = 'Forbidden') =>
    new AppError(message, 403, 'FORBIDDEN'),

  tokenExpired: (message = 'Token has expired') =>
    new AppError(message, 401, 'TOKEN_EXPIRED'),

  invalidToken: (message = 'Invalid token') =>
    new AppError(message, 401, 'INVALID_TOKEN'),

  // ── Not found ─────────────────────────────────────────────────────────────
  notFound: (message = 'Resource not found') =>
    new AppError(message, 404, 'NOT_FOUND'),

  identityNotFound: (message = 'Identity profile not found') =>
    new AppError(message, 404, 'IDENTITY_NOT_FOUND'),

  planNotFound: (message = 'Plan not found') =>
    new AppError(message, 404, 'PLAN_NOT_FOUND'),

  // ── Validation ────────────────────────────────────────────────────────────
  validationError: (message = 'Validation failed', errors = []) =>
    new AppError(message, 422, 'VALIDATION_ERROR', errors),

  badRequest: (message = 'Bad request', errors = []) =>
    new AppError(message, 400, 'BAD_REQUEST', errors),

  overcommit: (message = 'Task count exceeds daily limit') =>
    new AppError(message, 422, 'OVERCOMMIT'),

  // ── Rate limiting / quotas ────────────────────────────────────────────────
  rateLimitExceeded: (message = 'Too many requests') =>
    new AppError(message, 429, 'RATE_LIMIT_EXCEEDED'),

  aiLimitExceeded: (message = 'Daily AI usage limit reached') =>
    new AppError(message, 429, 'AI_LIMIT_EXCEEDED'),

  // ── Subscription ──────────────────────────────────────────────────────────
  premiumRequired: (message = 'Premium subscription required') =>
    new AppError(message, 403, 'PREMIUM_REQUIRED'),

  // ── External services ─────────────────────────────────────────────────────
  aiUnavailable: (message = 'AI service is temporarily unavailable') =>
    new AppError(message, 503, 'AI_UNAVAILABLE'),

  // ── Audio ─────────────────────────────────────────────────────────────────
  audioTooLarge: (message = 'Audio file exceeds size limit') =>
    new AppError(message, 413, 'AUDIO_TOO_LARGE'),

  invalidAudioFormat: (message = 'Unsupported audio format') =>
    new AppError(message, 422, 'INVALID_AUDIO_FORMAT'),

  // ── Conflict / generic ────────────────────────────────────────────────────
  conflict: (message = 'Resource conflict') =>
    new AppError(message, 409, 'CONFLICT'),

  internal: (message = 'An internal error occurred') =>
    new AppError(message, 500, 'INTERNAL_ERROR'),
};

module.exports = { AppError, Errors };
