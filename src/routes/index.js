'use strict';

// ─── Task 76: Complete API Route Index ────────────────────────────────────────

const { Router } = require('express');
const mongoose   = require('mongoose');
const redis      = require('../config/redis');

const router = Router();

// ─── Route Imports ────────────────────────────────────────────────────────────
const authRoutes      = require('./auth.routes');
const identityRoutes  = require('./identity.routes');
const planRoutes      = require('./plan.routes');
const execRoutes      = require('./exec.routes');
const alignmentRoutes = require('./alignment.routes');
const avatarRoutes    = require('./avatar.routes');
const reflectRoutes   = require('./reflect.routes');
const analyticsRoutes = require('./analytics.routes');
const voiceRoutes     = require('./voice.routes');
const settingsRoutes  = require('./settings.routes');
const webhookRoutes   = require('./webhook.routes');
const adminRoutes     = require('./admin.routes');

// ─── Health Check ─────────────────────────────────────────────────────────────
router.get('/health', async (_req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  let redisStatus = 'disconnected';
  try {
    await redis.ping();
    redisStatus = 'connected';
  } catch (_e) {
    // redis ping failed — status stays disconnected
  }

  const isHealthy = mongoStatus === 'connected' && redisStatus === 'connected';
  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    mongo:  mongoStatus,
    redis:  redisStatus,
  });
});

// ─── Route Mounting ───────────────────────────────────────────────────────────
router.use('/auth',      authRoutes);
router.use('/identity',  identityRoutes);
router.use('/plan',      planRoutes);
router.use('/execute',   execRoutes);
router.use('/alignment', alignmentRoutes);
router.use('/avatar',    avatarRoutes);
router.use('/reflect',   reflectRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/voice',     voiceRoutes);
router.use('/settings',  settingsRoutes);
router.use('/webhooks',  webhookRoutes);
router.use('/admin',     adminRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
router.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found`,
    code:    'NOT_FOUND',
    errors:  [],
  });
});

module.exports = router;
