'use strict';

// ─── Task 50: Midnight Penalty Sweep Worker ───────────────────────────────────
// Runs hourly. For users whose local yesterday has no execution log,
// creates a missed-day log and triggers alignment recalculation.

const { QUEUES }           = require('../../config/constants');
const REDIS_KEYS           = require('../../config/redis-keys');
const redis                = require('../../config/redis');
const logger               = require('../../utils/logger');
const { toLocalMidnightUTC } = require('../../utils/date.util');
const { enqueueAlignment } = require('../queues');

const User              = require('../../models/User');
const DailyExecutionLog = require('../../models/DailyExecutionLog');

const SWEEP_TTL = 172800;   // 48 hours — prevents double-penalizing

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get the YYYY-MM-DD string for yesterday in the given timezone.
 * @param {string} timezone
 * @returns {string}
 */
const getYesterdayStr = (timezone) => {
  const now  = new Date();
  // Shift to user's timezone to get local "today", then subtract one day
  const localNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  localNow.setDate(localNow.getDate() - 1);
  return localNow.toISOString().slice(0, 10);
};

// ─── Processor ────────────────────────────────────────────────────────────────

/**
 * @param {{ id: string, data: {} }} job
 */
const processor = async (job) => {
  logger.info({ jobId: job.id }, 'Midnight sweep started');

  const users = await User.find({}).lean();

  for (const user of users) {
    const userId   = user._id.toString();
    const timezone = user.timezone || 'UTC';

    try {
      const yesterdayStr  = getYesterdayStr(timezone);
      const yesterdayUTC  = toLocalMidnightUTC(yesterdayStr, timezone);
      const sweepKey      = REDIS_KEYS.midnightSwept(userId, yesterdayStr);

      // Check Redis sentinel — skip if already swept for this user+date
      const alreadySwept = await redis.get(sweepKey);
      if (alreadySwept) {continue;}

      // Check if log exists for yesterday
      const existingLog = await DailyExecutionLog.findOne({ userId, date: yesterdayUTC });
      if (existingLog) {
        // Log exists — mark as swept so we don't check again
        await redis.set(sweepKey, '1', 'EX', SWEEP_TTL);
        continue;
      }

      // No log → missed day. Create penalty log.
      await DailyExecutionLog.findOneAndUpdate(
        { userId, date: yesterdayUTC },
        {
          $set: {
            isMissedDay:          true,
            tasks:                [],
            identityHabitDone:    false,
            deepWorkMinutes:      0,
            coreCompletionPct:    0,
            supportCompletionPct: 0,
            averageEffort:        0,
          },
        },
        { upsert: true, new: true },
      );

      await enqueueAlignment({ userId, date: yesterdayUTC.toISOString(), trigger: 'missed_day' });

      // Mark as swept
      await redis.set(sweepKey, '1', 'EX', SWEEP_TTL);

      logger.info({ userId, yesterdayStr }, 'Missed-day penalty applied');
    } catch (err) {
      logger.error({ userId, err: err.message }, 'Sweep failed for user');
    }
  }

  logger.info({ jobId: job.id }, 'Midnight sweep complete');
};

// ─── Worker factory ───────────────────────────────────────────────────────────

const createSweepWorker = () => {
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'test') {return null;}

  /* istanbul ignore next */
  const { Worker } = require('bullmq');
  /* istanbul ignore next */
  const bullRedis  = require('../../config/bull-redis');

  /* istanbul ignore next */
  const worker = new Worker(QUEUES.SWEEP, processor, {
    connection:  bullRedis,
    concurrency: 1,
  });

  /* istanbul ignore next */
  worker.on('completed', (job) =>
    logger.info({ jobId: job.id }, 'Sweep job completed'),
  );
  /* istanbul ignore next */
  worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, err: err.message }, 'Sweep job failed'),
  );

  /* istanbul ignore next */
  return worker;
};

module.exports = { createSweepWorker, processor };
