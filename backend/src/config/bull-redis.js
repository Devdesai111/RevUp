'use strict';

// ─── BullMQ-compatible Redis connection ───────────────────────────────────────
// BullMQ requires a dedicated ioredis instance WITHOUT keyPrefix.
// (The main redis.js client uses keyPrefix for app-level key namespacing,
//  but BullMQ manages its own key namespacing and throws if keyPrefix is set.)
//
// Rules:
//  - maxRetriesPerRequest: null  ← required by BullMQ / ioredis
//  - enableReadyCheck: false     ← avoids startup race on slow connections
//  - NO keyPrefix                ← BullMQ does its own namespacing

const env = require('./env');

// In test mode, return a minimal stub — workers/queues are no-ops in tests.
if (env.NODE_ENV === 'test') {
  module.exports = null;
} else {
  const Redis   = require('ioredis');
  const logger  = require('../utils/logger');

  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck:     false,
  });

  client.on('ready',        () => logger.info({ url: env.REDIS_URL }, 'BullMQ Redis connected'));
  client.on('error',        (err) => logger.error({ err: err.message }, 'BullMQ Redis error'));
  client.on('reconnecting', (delay) => logger.warn({ delay }, 'BullMQ Redis reconnecting'));

  module.exports = client;
}
