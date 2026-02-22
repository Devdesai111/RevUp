'use strict';

/**
 * Redis key factory functions.
 * Always import from here — never write raw key strings.
 * Note: keyPrefix (env.REDIS_KEY_PREFIX) is applied by ioredis automatically.
 * These functions return the suffix portion only.
 */

const REDIS_KEYS = {
  // ── Auth ───────────────────────────────────────────────────────────────────
  /** Stores refresh token for a user. TTL: 7d (604800s) */
  refreshToken: (userId) => `auth:refresh:${userId}`,

  /** Stores password reset token for an email. TTL: 1h (3600s) */
  passwordReset: (email) => `auth:reset:${email}`,

  /** Session version for token invalidation (logout all). */
  sessionVersion: (userId) => `auth:version:${userId}`,

  // ── Cache ─────────────────────────────────────────────────────────────────
  /** Cached identity profile. TTL: 1h (3600s) */
  identityCache: (userId) => `cache:identity:${userId}`,

  /** Cached weekly plan. TTL: 7d (604800s) */
  planCache: (userId, week) => `cache:plan:${userId}:${week}`,

  /** Cached avatar state. TTL: 30min (1800s) */
  avatarStateCache: (userId) => `cache:avatar:${userId}`,

  /** Cached dashboard summary. TTL: 15min (900s) */
  dashboardCache: (userId) => `cache:dashboard:${userId}`,

  // ── Limits ────────────────────────────────────────────────────────────────
  /** Weekly AI usage counter for free tier. TTL: until end of week */
  aiUsageWeekly: (userId, weekKey) => `limit:ai:${userId}:${weekKey}`,

  /** Sprint reroll count per week. TTL: until end of week */
  sprintRerolls: (userId, weekKey) => `limit:reroll:${userId}:${weekKey}`,

  // ── Locks ─────────────────────────────────────────────────────────────────
  /** Distributed lock for alignment score calculation. TTL: 30s */
  alignmentLock: (userId) => `lock:alignment:${userId}`,

  // ── Sweep tracking ────────────────────────────────────────────────────────
  /** Marks midnight sweep as done for a user+date. */
  midnightSwept: (userId, date) => `sweep:${userId}:${date}`,

  // ── Notifications ─────────────────────────────────────────────────────────
  /** Last drift alert sent timestamp. TTL: 7d (604800s) */
  lastDriftAlert: (userId) => `notif:drift:${userId}`,

  /** FCM push token for a user. */
  fcmToken: (userId) => `fcm:token:${userId}`,
};

module.exports = REDIS_KEYS;
