'use strict';

const AlignmentMetric = require('../../models/AlignmentMetric');
const IdentityProfile = require('../../models/IdentityProfile');
const AVATAR_STATES = require('../../config/avatar-states');
const redis = require('../../config/redis');
const REDIS_KEYS = require('../../config/redis-keys');
const logger = require('../../utils/logger');

const CACHE_TTL = 30 * 60; // 30 minutes

/**
 * getAvatarState — fetch stateLevel for a user and return full visual config.
 * Falls back to stateLevel 2 (Stable) if no AlignmentMetric exists.
 * @param {string|ObjectId} userId
 * @returns {{ stateLevel, ...AVATAR_STATES[stateLevel] }}
 */
const getAvatarState = async (userId) => {
  const cacheKey = REDIS_KEYS.avatarStateCache(userId);

  // Cache hit
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Latest alignment metric → stateLevel
  const latest = await AlignmentMetric.findOne({ userId }).sort({ date: -1 }).lean();

  let stateLevel = 2; // default: Stable
  if (latest && latest.stateLevel) {
    stateLevel = latest.stateLevel;
  } else {
    // If no metric, check identity baseline
    const identity = await IdentityProfile.findOne({ userId }).lean();
    if (identity?.baselineAlignmentScore !== null && identity?.baselineAlignmentScore !== undefined) {
      const score = identity.baselineAlignmentScore;
      if (score > 75) { stateLevel = 3; }
      else if (score < 45) { stateLevel = 1; }
      else { stateLevel = 2; }
    }
  }

  const config = { stateLevel, ...AVATAR_STATES[stateLevel] };

  await redis.set(cacheKey, JSON.stringify(config), 'EX', CACHE_TTL);
  logger.debug({ userId, stateLevel }, 'Avatar state resolved');

  return config;
};

/**
 * invalidateAvatarCache — call after AlignmentMetric upsert.
 * @param {string|ObjectId} userId
 */
const invalidateAvatarCache = async (userId) => {
  await redis.del(REDIS_KEYS.avatarStateCache(userId));
};

module.exports = { getAvatarState, invalidateAvatarCache };
