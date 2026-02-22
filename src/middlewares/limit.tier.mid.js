'use strict';

// ─── Task 53: AI Usage Limit Middleware (Free Tier) ───────────────────────────
// Enforces weekly AI call quota using Redis atomic counters.
// Premium users bypass this middleware entirely.

const { getISOWeek, getYear } = require('date-fns');
const redis          = require('../config/redis');
const REDIS_KEYS     = require('../config/redis-keys');
const { FREE_LIMITS } = require('../config/constants');
const { Errors }     = require('../utils/AppError');

/**
 * Compute seconds remaining until end of current ISO week (Sunday 23:59:59 UTC).
 * @returns {number}
 */
const secondsUntilWeekEnd = () => {
  const now  = new Date();
  // Day of week: 0=Sun, 1=Mon … 6=Sat.  ISO week ends Sunday.
  const dayOfWeek    = now.getUTCDay();  // 0=Sun … 6=Sat
  const daysUntilSun = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const endOfWeek    = new Date(now);
  endOfWeek.setUTCDate(endOfWeek.getUTCDate() + daysUntilSun);
  endOfWeek.setUTCHours(23, 59, 59, 999);
  return Math.max(1, Math.floor((endOfWeek - now) / 1000));
};

/**
 * checkAILimit — enforce weekly AI call quota for free users.
 * Premium users are always allowed through.
 */
const checkAILimit = async (req, _res, next) => {
  try {
    const user = req.user;

    // Premium users bypass the limit entirely
    if (user.tier === 'premium') {
      return next();
    }

    const userId  = user._id.toString();
    const weekKey = `${getYear(new Date())}-${getISOWeek(new Date())}`;
    const key     = REDIS_KEYS.aiUsageWeekly(userId, weekKey);

    // Atomically increment and get new count
    const count = await redis.incr(key);

    // Set TTL on first call (count === 1)
    if (count === 1) {
      await redis.expire(key, secondsUntilWeekEnd());
    }

    if (count > FREE_LIMITS.AI_CALLS_PER_WEEK) {
      return next(Errors.forbidden('Weekly AI limit reached. Upgrade to premium for unlimited access.'));
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { checkAILimit, secondsUntilWeekEnd };
