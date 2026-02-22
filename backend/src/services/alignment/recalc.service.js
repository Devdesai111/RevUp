'use strict';

// ─── Task 44: Alignment Recalculation Orchestrator ───────────────────────────
// Full async pipeline: lock → fetch → score → upsert → cache invalidation.
// Pure math only — zero AI/LLM calls.

const redis          = require('../../config/redis');
const REDIS_KEYS     = require('../../config/redis-keys');
const logger         = require('../../utils/logger');
const { acquireLock, releaseLock } = require('../../utils/lock.util');

const DailyExecutionLog = require('../../models/DailyExecutionLog');
const AlignmentMetric   = require('../../models/AlignmentMetric');
const JournalEntry      = require('../../models/JournalEntry');

const { calculateRawScore }                      = require('./score.service');
const { calculateStreak, applyMultiplier }       = require('./streak.service');
const { calculateDrift, determineStateLevel }    = require('./drift.service');
const { detectPatterns }                         = require('./pattern.service');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build the execSummary object expected by calculateRawScore from a DailyExecutionLog.
 *
 * @param {object} log
 * @returns {object}
 */
const buildExecSummary = (log) => {
  const tasks        = log.tasks || [];
  const coreTasks    = tasks.filter((t) => t.isCore);
  const supportTasks = tasks.filter((t) => !t.isCore);

  return {
    coreTasksTotal:    coreTasks.length,
    coreTasksDone:     coreTasks.filter((t) => t.completed).length,
    supportTasksTotal: supportTasks.length,
    supportTasksDone:  supportTasks.filter((t) => t.completed).length,
    habitDone:         log.identityHabitDone,
    averageEffort:     log.averageEffort,
    isMissedDay:       log.isMissedDay,
  };
};

// ─── Main orchestrator ────────────────────────────────────────────────────────

/**
 * Recalculate the alignment score for a user on a given date.
 *
 * Steps:
 *   1. Acquire distributed lock (30s TTL) — skip if another recalc is running
 *   2. Fetch DailyExecutionLog for date
 *   3. Fetch last 7 AlignmentMetrics (sorted newest-first)
 *   4. Fetch JournalEntry for reflectionQualityScore
 *   5. Calculate raw score, streak, final score, drift, state, patterns
 *   6. Upsert AlignmentMetric
 *   7. Invalidate avatar + dashboard caches
 *   8. Release lock (always — even on error)
 *
 * @param {string} userId
 * @param {string|Date} date
 * @returns {Promise<AlignmentMetric|null>}
 */
const recalcDailyAlignment = async (userId, date) => {
  const lockKey = REDIS_KEYS.alignmentLock(userId);

  // ── Step 1: Acquire lock ───────────────────────────────────────────────────
  const locked = await acquireLock(lockKey, 30);
  if (!locked) {
    logger.warn({ userId }, 'Alignment recalc skipped — lock already held');
    return null;
  }

  try {
    // ── Step 2: Fetch execution log ──────────────────────────────────────────
    const log = await DailyExecutionLog.findOne({ userId, date });
    if (!log) {
      logger.warn({ userId, date }, 'Alignment recalc skipped — no execution log found');
      return null;
    }

    // ── Step 3: Fetch last 7 previous metrics (newest-first) ────────────────
    const previousMetrics = await AlignmentMetric
      .find({ userId, date: { $lt: date } })
      .sort({ date: -1 })
      .limit(7)
      .lean();

    // ── Step 4: Fetch journal entry for reflection quality ───────────────────
    const journal          = await JournalEntry.findOne({ userId, date });
    const reflectionQuality = journal?.reflectionQualityScore ?? 0;

    // ── Step 5a: Raw score ───────────────────────────────────────────────────
    const execSummary = buildExecSummary(log);
    const { rawScore, components } = calculateRawScore(execSummary, reflectionQuality);

    // ── Step 5b: Streak + multiplier ─────────────────────────────────────────
    const { streakCount, multiplier } = calculateStreak(rawScore, previousMetrics);
    const alignmentScore              = applyMultiplier(rawScore, multiplier);

    // ── Step 5c: Drift + state level ─────────────────────────────────────────
    const { driftIndex, sevenDayAverage } = calculateDrift(alignmentScore, previousMetrics);
    const stateLevel                       = determineStateLevel(sevenDayAverage, driftIndex, previousMetrics);

    // ── Step 5d: Pattern detection (last 30 days) ────────────────────────────
    const last30Metrics = await AlignmentMetric
      .find({ userId })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    const last30Logs = await DailyExecutionLog
      .find({ userId })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    const patternFlags = detectPatterns(last30Metrics, last30Logs);

    // ── Step 6: Upsert AlignmentMetric ───────────────────────────────────────
    const metric = await AlignmentMetric.findOneAndUpdate(
      { userId, date },
      {
        $set: {
          alignmentScore,
          rawScore,
          streakMultiplier: multiplier,
          driftIndex,
          sevenDayAverage,
          streakCount,
          stateLevel,
          patternFlags,
          components,
        },
      },
      { upsert: true, new: true },
    );

    // ── Step 7: Invalidate caches ─────────────────────────────────────────────
    await redis.del(REDIS_KEYS.avatarStateCache(userId));
    await redis.del(REDIS_KEYS.dashboardCache(userId));

    // ── Step 7b: Send drift alert if state dropped to DIMINISHED ─────────────
    // Lazy require to avoid circular dependencies and simplify mocking
    try {
      const { sendDriftAlert, sendStreakMilestone } = require('../notifications/fcm.service');

      if (metric.stateLevel === 1) {
        const alerted = await redis.get(REDIS_KEYS.lastDriftAlert(userId));
        if (!alerted) {
          await sendDriftAlert(userId, metric.alignmentScore);
          await redis.setex(REDIS_KEYS.lastDriftAlert(userId), 86400 * 7, '1');
        }
      }

      const STREAK_MILESTONES = [7, 14, 30, 60, 90];
      if (STREAK_MILESTONES.includes(metric.streakCount)) {
        await sendStreakMilestone(userId, metric.streakCount);
      }
    } catch (_notifErr) {
      // Notification failure is non-critical — never block the recalc result
    }

    logger.info({ userId, date, alignmentScore, stateLevel, streakCount }, 'Alignment recalc complete');
    return metric;

  } finally {
    // ── Step 8: Always release lock ───────────────────────────────────────────
    await releaseLock(lockKey);
  }
};

module.exports = { recalcDailyAlignment };
