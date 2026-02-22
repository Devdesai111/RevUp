'use strict';

const env    = require('./config/env');
const app    = require('./app');
const logger = require('./utils/logger');
const { connect: dbConnect, disconnect: dbDisconnect } = require('./config/db');
const redis  = require('./config/redis');

// ─── Server instance ──────────────────────────────────────────────────────────
let server;

// ─── Worker instances (populated in start(), used in shutdown()) ──────────────
let workers = [];

// ─── Start ────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    // 1. Connect to MongoDB
    await dbConnect();

    // 2. Start BullMQ workers (skipped automatically in test mode — each
    //    create*Worker() returns null when NODE_ENV === 'test')
    if (env.NODE_ENV !== 'test') {
      const { createAlignmentWorker }  = require('./jobs/workers/alignment.worker');
      const { createReflectionWorker } = require('./jobs/workers/reflection.worker');
      const { createReviewWorker }     = require('./jobs/workers/review.worker');
      const { createSweepWorker }      = require('./jobs/workers/sweep.worker');
      const { createMorningWorker }    = require('./jobs/workers/morning.worker');
      const { createEveningWorker }    = require('./jobs/workers/evening.worker');

      const {
        scheduleWeeklyReviews,
        scheduleMidnightSweep,
        scheduleMorningReminders,
        scheduleEveningReminders,
      } = require('./jobs/queues');

      // Instantiate workers
      workers = [
        createAlignmentWorker(),
        createReflectionWorker(),
        createReviewWorker(),
        createSweepWorker(),
        createMorningWorker(),
        createEveningWorker(),
      ].filter(Boolean); // remove any null entries (defensive)

      logger.info({ count: workers.length }, 'BullMQ workers started');

      // Register repeatable jobs (idempotent — BullMQ deduplicates by cron key)
      await scheduleWeeklyReviews();
      await scheduleMidnightSweep();
      await scheduleMorningReminders();
      await scheduleEveningReminders();

      logger.info('Repeatable BullMQ jobs scheduled');
    }

    // 3. Start HTTP server
    server = app.listen(env.PORT, () => {
      logger.info({ port: env.PORT, env: env.NODE_ENV }, 'RevUp server started');
    });

    return server;
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

// ─── Graceful shutdown ────────────────────────────────────────────────────────
// Order: HTTP → workers → MongoDB → Redis → exit
const shutdown = async (signal) => {
  logger.info({ signal }, 'Shutdown signal received — closing gracefully');

  const closeHttp = () =>
    new Promise((resolve) => {
      if (!server) { resolve(); return; }
      server.close(resolve);
    });

  try {
    // 1. Stop accepting new HTTP connections
    await closeHttp();
    logger.info('HTTP server closed');

    // 2. Close BullMQ workers (waits for in-flight jobs to finish)
    if (workers.length > 0) {
      await Promise.all(workers.map((w) => w.close()));
      logger.info({ count: workers.length }, 'BullMQ workers closed');
    }

    // 3. Close MongoDB
    await dbDisconnect();

    // 4. Close Redis
    await redis.quit();
    logger.info('Redis connection closed');

    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during graceful shutdown');
    process.exit(1);
  }
};

// Register signal handlers once
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Only boot when run directly — not when required in tests
if (require.main === module) {
  start();
}

module.exports = { start, shutdown };
