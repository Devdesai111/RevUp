'use strict';

// ─── BullMQ requires a real ioredis connection.
// In test mode, export safe no-op stubs so Redis is never attempted.
// In E2E tests that need to spy on enqueue calls, jest.mock this module.

const env = require('../config/env');

if (env.NODE_ENV === 'test') {
  module.exports = {
    alignmentQueue:          null,
    reflectionQueue:         null,
    reviewQueue:             null,
    sweepQueue:              null,
    morningQueue:            null,
    eveningQueue:            null,
    enqueueAlignment:        () => Promise.resolve({ id: 'noop' }),
    enqueueReflection:       () => Promise.resolve({ id: 'noop' }),
    enqueueWeeklyReview:     () => Promise.resolve({ id: 'noop' }),
    scheduleWeeklyReviews:   () => Promise.resolve(),
    scheduleMidnightSweep:   () => Promise.resolve(),
    scheduleMorningReminders: () => Promise.resolve(),
    scheduleEveningReminders: () => Promise.resolve(),
  };
} else {
  const { Queue } = require('bullmq');
  const { QUEUES, JOBS } = require('../config/constants');

  // BullMQ requires a dedicated ioredis connection WITHOUT keyPrefix.
  // bull-redis.js provides that — see src/config/bull-redis.js for details.
  const bullRedis = require('../config/bull-redis');

  // ─── Queue instances ────────────────────────────────────────────────────────
  const alignmentQueue  = new Queue(QUEUES.ALIGNMENT,  { connection: bullRedis });
  const reflectionQueue = new Queue(QUEUES.REFLECTION, { connection: bullRedis });
  const reviewQueue     = new Queue(QUEUES.REVIEW,     { connection: bullRedis });
  const sweepQueue      = new Queue(QUEUES.SWEEP,      { connection: bullRedis });
  const morningQueue    = new Queue(QUEUES.MORNING,    { connection: bullRedis });
  const eveningQueue    = new Queue(QUEUES.EVENING,    { connection: bullRedis });

  // ─── Default job options ────────────────────────────────────────────────────
  const defaultJobOpts = {
    attempts: 3,
    backoff:  { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail:     { count: 50  },
  };

  /** @param {{ userId: string, date: string, trigger?: string }} payload */
  const enqueueAlignment = (payload) =>
    alignmentQueue.add(JOBS.CALCULATE_ALIGNMENT, payload, defaultJobOpts);

  /** @param {{ journalEntryId: string, userId: string, date: string }} payload */
  const enqueueReflection = (payload) =>
    reflectionQueue.add(JOBS.PROCESS_REFLECTION, payload, defaultJobOpts);

  /** @param {{ userId: string, weekStart: string }} payload */
  const enqueueWeeklyReview = (payload) =>
    reviewQueue.add(JOBS.GENERATE_REVIEW, payload, defaultJobOpts);

  // ─── Repeatable job schedulers ───────────────────────────────────────────────
  const scheduleWeeklyReviews = () =>
    reviewQueue.add(
      JOBS.GENERATE_REVIEW,
      {},
      { ...defaultJobOpts, repeat: { cron: '0 23 * * 0' } },
    );

  const scheduleMidnightSweep = () =>
    sweepQueue.add(
      JOBS.MIDNIGHT_SWEEP,
      {},
      { ...defaultJobOpts, repeat: { cron: '5 * * * *' } },
    );

  // Every 30 min — worker filters which users are actually at 7:00 AM local time
  const scheduleMorningReminders = () =>
    morningQueue.add(
      JOBS.MORNING_BRIEF,
      {},
      { ...defaultJobOpts, repeat: { cron: '*/30 * * * *' } },
    );

  // Every 30 min — worker filters which users are actually at 9:00 PM local time
  const scheduleEveningReminders = () =>
    eveningQueue.add(
      JOBS.EVENING_PROMPT,
      {},
      { ...defaultJobOpts, repeat: { cron: '*/30 * * * *' } },
    );

  module.exports = {
    alignmentQueue,
    reflectionQueue,
    reviewQueue,
    sweepQueue,
    morningQueue,
    eveningQueue,
    enqueueAlignment,
    enqueueReflection,
    enqueueWeeklyReview,
    scheduleWeeklyReviews,
    scheduleMidnightSweep,
    scheduleMorningReminders,
    scheduleEveningReminders,
  };
}
