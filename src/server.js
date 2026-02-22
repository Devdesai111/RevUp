'use strict';

const env = require('./config/env');
const app = require('./app');
const logger = require('./utils/logger');
const { connect: dbConnect, disconnect: dbDisconnect } = require('./config/db');
const redis = require('./config/redis');

// ─── Server instance ──────────────────────────────────────────────────────────
let server;

const start = async () => {
  try {
    // Connect to MongoDB via db.js (handles retry + event listeners)
    await dbConnect();

    // Start HTTP server
    server = app.listen(env.PORT, () => {
      logger.info({ port: env.PORT, env: env.NODE_ENV }, 'RevUp server started');
    });

    // CORRECTION C4: Workers started in Task 77
    // const { startAllWorkers } = require('./workers');
    // startAllWorkers();

    return server;
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

// ─── Graceful shutdown ────────────────────────────────────────────────────────
// Order: HTTP server → workers (Task 77) → MongoDB → Redis (Task 4) → exit
const shutdown = async (signal) => {
  logger.info({ signal }, 'Shutdown signal received — closing gracefully');

  const closeHttp = () =>
    new Promise((resolve) => {
      if (!server) {
        resolve();
        return;
      }
      server.close(resolve);
    });

  try {
    await closeHttp();
    logger.info('HTTP server closed');

    // CORRECTION C5: Worker shutdown in Task 77
    // await stopAllWorkers();

    await dbDisconnect();
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
process.on('SIGINT', () => shutdown('SIGINT'));

// Only boot when run directly — not when required in tests
if (require.main === module) {
  start();
}

module.exports = { start, shutdown };
