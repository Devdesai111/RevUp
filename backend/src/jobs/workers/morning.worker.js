'use strict';

// ─── Task 65: Morning Notification Worker ─────────────────────────────────────
// Sends morning reminder to users whose local time is 7:00 AM ± 30 min.

const { QUEUES } = require('../../config/constants');
const { sendMorningReminder } = require('../../services/notifications/fcm.service');
const User   = require('../../models/User');
const logger = require('../../utils/logger');

// ─── Processor ────────────────────────────────────────────────────────────────

const processor = async (job) => {
  const now = new Date();

  const users = await User.find({
    isActive: true,
    'notificationPreferences.morning': true,
  }).lean();

  const eligible = users.filter((u) => {
    try {
      const localTime = new Date(now.toLocaleString('en-US', { timeZone: u.timezone || 'UTC' }));
      const hour = localTime.getHours();
      const min  = localTime.getMinutes();
      return hour === 7 && min < 30; // 7:00 – 7:29 AM local time
    } catch (_e) {
      return false;
    }
  });

  logger.info({ jobId: job.id, count: eligible.length }, 'Sending morning reminders');

  // Send in parallel batches of 50
  for (let i = 0; i < eligible.length; i += 50) {
    const batch = eligible.slice(i, i + 50);
    await Promise.allSettled(batch.map((u) => sendMorningReminder(u._id.toString())));
  }

  return { sent: eligible.length };
};

// ─── Worker factory ───────────────────────────────────────────────────────────

const createMorningWorker = () => {
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'test') { return null; }

  /* istanbul ignore next */
  const { Worker } = require('bullmq');
  /* istanbul ignore next */
  const bullRedis  = require('../../config/bull-redis');

  /* istanbul ignore next */
  const worker = new Worker(QUEUES.MORNING, processor, {
    connection:  bullRedis,
    concurrency: 1,
  });

  /* istanbul ignore next */
  worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, err: err.message }, 'Morning reminder job failed'),
  );

  /* istanbul ignore next */
  return worker;
};

module.exports = { createMorningWorker, processor };
