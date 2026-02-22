'use strict';

// ─── Task 52: Webhook Routes ──────────────────────────────────────────────────
// CRITICAL: express.raw() must be applied BEFORE express.json() globally.
// This is configured in app.js — these routes inherit the raw body parser.

const { Router } = require('express');
const { handleStripeWebhook, handleRazorpayWebhook } = require('../controllers/webhook.controller');

const router = Router();

// Both webhook routes receive raw body (Buffer) — app.js mounts these
// under /api/v1/webhooks with express.raw({ type: 'application/json' })
// applied BEFORE the global express.json() middleware.
router.post('/stripe',    handleStripeWebhook);
router.post('/razorpay',  handleRazorpayWebhook);

module.exports = router;
