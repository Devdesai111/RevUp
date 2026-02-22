'use strict';

// ─── Task 52: Stripe & Razorpay Webhook Handler ───────────────────────────────
// CRITICAL: These routes use express.raw() — raw body preserved for sig verification.

const env    = require('../config/env');
const logger = require('../utils/logger');
const { sendSuccess, sendError } = require('../utils/response.util');
const User   = require('../models/User');

// ─── Stripe Webhooks ──────────────────────────────────────────────────────────

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    logger.warn('Stripe not configured — ignoring webhook');
    return sendSuccess(res, { message: 'Stripe not configured' });
  }

  let event;
  try {
    const stripe = require('stripe')(env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn({ err: err.message }, 'Invalid Stripe signature');
    return sendError(res, { message: 'Invalid signature', code: 'INVALID_SIGNATURE', statusCode: 400 });
  }

  logger.info({ type: event.type }, 'Stripe event received');

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session   = event.data.object;
        const customerId = session.customer;
        if (customerId) {
          await User.findOneAndUpdate(
            { stripeCustomerId: customerId },
            { $set: { tier: 'premium' } },
          );
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await User.findOneAndUpdate(
          { stripeCustomerId: sub.customer },
          { $set: { tier: 'free' } },
        );
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        logger.warn({ customer: invoice.customer }, 'Payment failed');
        break;
      }
      default:
        logger.info({ type: event.type }, 'Unhandled Stripe event');
    }
  } catch (err) {
    logger.error({ err: err.message, type: event.type }, 'Stripe event processing failed');
  }

  return sendSuccess(res, { message: 'Webhook received' });
};

// ─── Razorpay Webhooks ────────────────────────────────────────────────────────

const handleRazorpayWebhook = async (req, res) => {
  if (!env.RAZORPAY_KEY_SECRET) {
    logger.warn('Razorpay not configured — ignoring webhook');
    return sendSuccess(res, { message: 'Razorpay not configured' });
  }

  const sig       = req.headers['x-razorpay-signature'];
  const rawBody   = req.body;

  try {
    const crypto = require('crypto');
    const expectedSig = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(rawBody)
      .digest('hex');

    if (sig !== expectedSig) {
      return sendError(res, { message: 'Invalid signature', code: 'INVALID_SIGNATURE', statusCode: 400 });
    }
  } catch (err) {
    return sendError(res, { message: 'Signature verification failed', statusCode: 400 });
  }

  let payload;
  try { payload = JSON.parse(rawBody.toString()); } catch (_) {
    return sendError(res, { message: 'Invalid JSON payload', statusCode: 400 });
  }

  logger.info({ event: payload.event }, 'Razorpay event received');

  try {
    if (payload.event === 'subscription.activated') {
      const email = payload.payload?.subscription?.entity?.notes?.email;
      if (email) {
        await User.findOneAndUpdate({ email }, { $set: { tier: 'premium' } });
      }
    } else if (payload.event === 'subscription.cancelled') {
      const email = payload.payload?.subscription?.entity?.notes?.email;
      if (email) {
        await User.findOneAndUpdate({ email }, { $set: { tier: 'free' } });
      }
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Razorpay event processing failed');
  }

  return sendSuccess(res, { message: 'Webhook received' });
};

module.exports = { handleStripeWebhook, handleRazorpayWebhook };
