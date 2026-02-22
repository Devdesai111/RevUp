'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const env    = require('./config/env');
const logger = require('./utils/logger');
const { sendSuccess }    = require('./utils/response.util');
const errorMiddleware    = require('./middlewares/error.mid');
const { globalRateLimit } = require('./middlewares/rateLimit.mid');

const app = express();

// ─── CORRECTION C6: Webhook raw body parser MUST come before express.json() ──
// Stripe/Razorpay webhooks need raw body for signature verification.
// Full webhook handlers wired in Task 77.
app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }));

// ─── Security: Helmet ────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// ─── Security: CORS ──────────────────────────────────────────────────────────
app.use(cors({
  origin: env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ─── Standard middleware ──────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Global rate limiter ──────────────────────────────────────────────────────
app.use(globalRateLimit);

// ─── pino-http request logger (skip in test to keep output clean) ─────────────
if (env.NODE_ENV !== 'test') {
  const { createHttpLogger } = require('./utils/logger');
  app.use(createHttpLogger());
}

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/v1/health', async (_req, res) => {
  const redis = require('./config/redis');
  const redisStatus = redis.status === 'ready' ? 'connected' : 'disconnected';
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  return sendSuccess(res, {
    message: 'Server is healthy',
    data: {
      status: 'ok',
      environment: env.NODE_ENV,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbStatus,
      redis: redisStatus,
    },
  });
});

// ─── Swagger UI (non-production only) ────────────────────────────────────────
if (env.NODE_ENV !== 'production') {
  try {
    const swaggerUi  = require('swagger-ui-express');
    const yaml       = require('js-yaml');
    const fs         = require('fs');
    const path       = require('path');
    const swaggerDoc = yaml.load(
      fs.readFileSync(path.join(__dirname, 'docs/swagger.yaml'), 'utf8'),
    );
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  } catch (e) {
    // swagger-ui-express optional — don't crash in CI if not installed
  }
}

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', require('./routes'));

// ─── Bull Board queue monitoring (non-test + non-prod, or BULL_BOARD_ENABLED) ─
if (env.NODE_ENV !== 'test' && (env.NODE_ENV !== 'production' || env.BULL_BOARD_ENABLED)) {
  try {
    const { createBullBoard } = require('@bull-board/api');
    const { BullMQAdapter }   = require('@bull-board/api/bullMQAdapter');
    const { ExpressAdapter }  = require('@bull-board/express');
    const {
      alignmentQueue, reflectionQueue,
      reviewQueue, sweepQueue,
      morningQueue, eveningQueue,
    } = require('./jobs/queues');

    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    createBullBoard({
      queues: [
        new BullMQAdapter(alignmentQueue),
        new BullMQAdapter(reflectionQueue),
        new BullMQAdapter(reviewQueue),
        new BullMQAdapter(sweepQueue),
        new BullMQAdapter(morningQueue),
        new BullMQAdapter(eveningQueue),
      ],
      serverAdapter,
    });

    app.use('/admin/queues', serverAdapter.getRouter());
    logger.info('Bull Board mounted at /admin/queues');
  } catch (e) {
    logger.warn({ err: e.message }, 'Bull Board failed to mount — skipping');
  }
}

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
    code: 'NOT_FOUND',
    errors: [],
  });
});

// ─── Global error handler (MUST be last) ─────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
