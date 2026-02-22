'use strict';

// ─── Task 44: BullMQ Alignment Worker ────────────────────────────────────────
// Listens on QUEUES.ALIGNMENT and runs recalcDailyAlignment for each job.
// Worker instantiation is skipped in test mode (no real Redis/BullMQ needed).

const { QUEUES }              = require('../../config/constants');
const logger                  = require('../../utils/logger');
const { recalcDailyAlignment } = require('../../services/alignment/recalc.service');

// ─── Processor function (exported for unit testing) ───────────────────────────

/**
 * BullMQ processor — called once per job.
 *
 * @param {{ id: string, data: { userId: string, date: string } }} job
 * @returns {Promise<{ metricId: string|undefined }>}
 */
const processor = async (job) => {
  const { userId, date } = job.data;
  logger.info({ jobId: job.id, userId, date }, 'Alignment job started');
  const metric = await recalcDailyAlignment(userId, date);
  return { metricId: metric?._id };
};

// ─── Worker factory (only instantiated in dev/prod) ───────────────────────────

const createAlignmentWorker = () => {
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'test') {return null;}

  /* istanbul ignore next */
  const { Worker } = require('bullmq');
  /* istanbul ignore next */
  const redis      = require('../../config/redis');

  /* istanbul ignore next */
  const worker = new Worker(QUEUES.ALIGNMENT, processor, {
    connection:  redis,
    concurrency: 5,
  });

  /* istanbul ignore next */
  worker.on('completed', (job) =>
    logger.info({ jobId: job.id }, 'Alignment job completed'),
  );
  /* istanbul ignore next */
  worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, err: err.message }, 'Alignment job failed'),
  );

  /* istanbul ignore next */
  return worker;
};

module.exports = { createAlignmentWorker, processor };
