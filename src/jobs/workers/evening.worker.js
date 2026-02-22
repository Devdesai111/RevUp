'use strict';

// ─── Task 65: Evening Notification Worker ─────────────────────────────────────
// Sends evening reminder to users whose local time is 9:00 PM ± 30 min.

const { QUEUES } = require('../../config/constants');
const { sendEveningReminder } = require('../../services/notifications/fcm.service');
const User   = require('../../models/User');
const logger = require('../../utils/logger');

// ─── Processor ────────────────────────────────────────────────────────────────

const processor = async (job) => {
  const now = new Date();

  const users = await User.find({
    isActive: true,
    'notificationPreferences.evening': true,
  }).lean();

  const eligible = users.filter((u) => {
    try {
      const localTime = new Date(now.toLocaleString('en-US', { timeZone: u.timezone || 'UTC' }));
      const hour = localTime.getHours();
      const min  = localTime.getMinutes();
      return hour === 21 && min < 30; // 9:00 – 9:29 PM local time
    } catch (_e) {
      return false;
    }
  });

  logger.info({ jobId: job.id, count: eligible.length }, 'Sending evening reminders');

  for (let i = 0; i < eligible.length; i += 50) {
    const batch = eligible.slice(i, i + 50);
    await Promise.allSettled(batch.map((u) => sendEveningReminder(u._id.toString())));
  }

  return { sent: eligible.length };
};

// ─── Worker factory ───────────────────────────────────────────────────────────

const createEveningWorker = () => {
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'test') { return null; }

  /* istanbul ignore next */
  const { Worker } = require('bullmq');
  /* istanbul ignore next */
  const bullRedis  = require('../../config/bull-redis');

  /* istanbul ignore next */
  const worker = new Worker(QUEUES.EVENING, processor, {
    connection:  bullRedis,
    concurrency: 1,
  });

  /* istanbul ignore next */
  worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, err: err.message }, 'Evening reminder job failed'),
  );

  /* istanbul ignore next */
  return worker;
};

module.exports = { createEveningWorker, processor };
