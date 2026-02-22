'use strict';

// ─── Task 44: Distributed Redis Lock ─────────────────────────────────────────
// Prevents concurrent alignment recalculations for the same user.

const redis = require('../config/redis');

/**
 * Acquire a distributed lock using SET NX EX.
 * Returns true if the lock was acquired, false if already held.
 *
 * @param {string} key         - Redis key for the lock
 * @param {number} ttlSeconds  - Lock TTL (auto-release safety net)
 * @returns {Promise<boolean>}
 */
const acquireLock = async (key, ttlSeconds = 30) => {
  const result = await redis.set(key, '1', 'EX', ttlSeconds, 'NX');
  return result === 'OK';
};

/**
 * Release a lock by deleting the key.
 *
 * @param {string} key
 * @returns {Promise<void>}
 */
const releaseLock = async (key) => {
  await redis.del(key);
};

module.exports = { acquireLock, releaseLock };
