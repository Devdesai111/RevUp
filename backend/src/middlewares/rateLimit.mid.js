'use strict';

const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const env = require('../config/env');
const { Errors } = require('../utils/AppError');

// Lazy-load redis to avoid circular dependency at module load time
const getRedisClient = () => require('../config/redis');

// ─── Store factory ────────────────────────────────────────────────────────────
// Falls back to memory store in test (no real Redis) or when Redis is unavailable.
const createStore = (prefix) => {
  if (env.NODE_ENV === 'test') {
    return undefined; // express-rate-limit uses in-memory store by default
  }

  return new RedisStore({
    sendCommand: (...args) => getRedisClient().call(...args),
    prefix: `rl:${prefix}:`,
  });
};

// ─── Handler: call next(err) instead of default JSON response ────────────────
const rateLimitHandler = (_req, _res, next) => {
  next(Errors.rateLimitExceeded('Too many requests — please try again later'));
};

// ─── Global rate limiter ──────────────────────────────────────────────────────
const globalRateLimit = rateLimit({
  max: env.RATE_LIMIT_GLOBAL_MAX,
  windowMs: env.RATE_LIMIT_GLOBAL_WINDOW_MS,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('global'),
  handler: rateLimitHandler,
});

// ─── Auth route rate limiter (applied per-router in auth routes) ──────────────
// Use a very high limit in test to avoid rate-limiting e2e tests.
const authRateLimit = rateLimit({
  max: env.NODE_ENV === 'test' ? 1000 : env.RATE_LIMIT_AUTH_MAX,
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('auth'),
  handler: rateLimitHandler,
});

module.exports = { globalRateLimit, authRateLimit };
