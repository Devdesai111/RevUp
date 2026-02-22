'use strict';

// ─── Task 47: Short-Term Memory Context Fetcher ───────────────────────────────
// Compressed context string injected into AI prompts.
// Cached in Redis for 10 minutes.

const redis          = require('../../config/redis');
const logger         = require('../../utils/logger');
const IdentityProfile = require('../../models/IdentityProfile');
const AlignmentMetric = require('../../models/AlignmentMetric');
const Plan            = require('../../models/Plan');

const CACHE_TTL = 600;  // 10 minutes
const cacheKey  = (userId) => `cache:memory:${userId}`;

/**
 * Build compact memory context for AI prompt injection.
 * Includes: identity declaration + risk summary, last 7 metrics, current sprint objectives.
 *
 * @param {string} userId
 * @returns {Promise<{ identityDeclaration: string, riskSummary: string, last7Days: object[], sprintObjectives: string[] }>}
 */
const buildMemoryContext = async (userId) => {
  // Check cache
  const cached = await redis.get(cacheKey(userId));
  if (cached) {
    try { return JSON.parse(cached); } catch (_) { /* ignore parse error, rebuild */ }
  }

  // ── Identity ──────────────────────────────────────────────────────────────
  const identity = await IdentityProfile.findOne({ userId }).lean();
  const identityDeclaration = identity?.futureIdentity?.declarationSentence || '';
  const riskSummary = identity?.riskProfile
    ? `Drift probability ${Math.round((identity.riskProfile.driftProbability || 0) * 100)}%, ` +
      `procrastination index ${identity.riskProfile.procrastinationIndex || 0}/100`
    : 'No risk profile available';

  // ── Last 7 alignment metrics ──────────────────────────────────────────────
  const last7Days = await AlignmentMetric
    .find({ userId })
    .sort({ date: -1 })
    .limit(7)
    .select('date alignmentScore stateLevel streakCount')
    .lean();

  // ── Current sprint objectives ─────────────────────────────────────────────
  const plan = await Plan.findOne({ userId }).sort({ createdAt: -1 }).lean();
  const sprintObjectives = plan?.coreActions?.map((a) => a.title || a.text || String(a)) || [];

  const context = { identityDeclaration, riskSummary, last7Days, sprintObjectives };

  // Cache for 10 minutes
  try {
    await redis.set(cacheKey(userId), JSON.stringify(context), 'EX', CACHE_TTL);
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to cache memory context');
  }

  return context;
};

module.exports = { buildMemoryContext };
