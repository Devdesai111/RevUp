'use strict';

// ─── E2E: Webhook Routes ──────────────────────────────────────────────────────
// Stripe and Razorpay keys are empty in test (.env.test) so both handlers
// return early with "not configured" — this verifies route wiring and the
// graceful no-op path without needing real signature verification.

const request = require('supertest');

let app;

beforeAll(() => { app = require('../../app'); });

// ─── POST /webhooks/stripe ────────────────────────────────────────────────────

describe('POST /api/v1/webhooks/stripe', () => {
  it('should accept a stripe webhook and return 200 (no-op — not configured in test)', async () => {
    const payload = JSON.stringify({ type: 'checkout.session.completed', data: {} });

    const res = await request(app)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'test-sig-placeholder')
      .send(Buffer.from(payload));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // In test, Stripe keys are empty → handler returns early without verifying
    // sendSuccess(res, { message: '...' }) → message is in res.body.message, not res.body.data
    expect(res.body.message).toMatch(/stripe not configured/i);
  });

  it('should accept a stripe webhook without a signature header (no-op in test)', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .send(Buffer.from('{}'));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─── POST /webhooks/razorpay ──────────────────────────────────────────────────

describe('POST /api/v1/webhooks/razorpay', () => {
  it('should accept a razorpay webhook and return 200 (no-op — not configured in test)', async () => {
    const payload = JSON.stringify({ event: 'subscription.activated', payload: {} });

    const res = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', 'test-sig-placeholder')
      .send(Buffer.from(payload));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/razorpay not configured/i);
  });

  it('should handle missing signature header gracefully in test mode', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('Content-Type', 'application/json')
      .send(Buffer.from('{}'));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
