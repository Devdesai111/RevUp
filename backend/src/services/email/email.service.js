'use strict';

// ─── Task 51: Email Service (Resend) ─────────────────────────────────────────

const env    = require('../../config/env');
const logger = require('../../utils/logger');

// Lazy-init Resend to avoid crashing if SDK is not installed in test
let _resend;
const getResend = () => {
  if (!_resend) {
    if (!env.RESEND_API_KEY) {
      logger.warn('RESEND_API_KEY not set — email sending disabled');
      return null;
    }
    const { Resend } = require('resend');
    _resend = new Resend(env.RESEND_API_KEY);
  }
  return _resend;
};

// ─── Templates ────────────────────────────────────────────────────────────────

const resetEmailHTML = (resetLink) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h1 style="color:#1a1a2e">Reset Your Password</h1>
  <p>Click the button below to reset your RevUp password. This link expires in 1 hour.</p>
  <a href="${resetLink}"
     style="display:inline-block;background:#e94560;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">
    Reset Password
  </a>
  <p style="color:#666;font-size:12px;margin-top:24px">
    If you didn't request this, ignore this email — your password won't change.
  </p>
</body>
</html>`;

const welcomeEmailHTML = (name) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h1 style="color:#1a1a2e">Welcome to RevUp, ${name}!</h1>
  <p>You're on your way to becoming your future self. Start by completing your identity profile.</p>
  <a href="${env.FRONTEND_WEB_URL}/onboarding"
     style="display:inline-block;background:#e94560;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">
    Start Onboarding
  </a>
</body>
</html>`;

// ─── Senders ──────────────────────────────────────────────────────────────────

/**
 * Send password reset email with a token link.
 *
 * @param {string} email
 * @param {string} resetToken
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  const resend = getResend();
  if (!resend) {
    logger.info({ email }, 'Email skipped — no Resend API key');
    return;
  }

  const resetLink = `${env.FRONTEND_WEB_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  await resend.emails.send({
    from:    'RevUp <noreply@revup.app>',
    to:      email,
    subject: 'Reset your RevUp password',
    html:    resetEmailHTML(resetLink),
  });

  logger.info({ email }, 'Password reset email sent');
};

/**
 * Send welcome email after successful identity synthesis.
 *
 * @param {string} email
 * @param {string} name
 */
const sendWelcomeEmail = async (email, name) => {
  const resend = getResend();
  if (!resend) {
    logger.info({ email }, 'Welcome email skipped — no Resend API key');
    return;
  }

  await resend.emails.send({
    from:    'RevUp <noreply@revup.app>',
    to:      email,
    subject: 'Welcome to RevUp — your journey starts now',
    html:    welcomeEmailHTML(name || 'there'),
  });

  logger.info({ email }, 'Welcome email sent');
};

module.exports = { sendPasswordResetEmail, sendWelcomeEmail };
