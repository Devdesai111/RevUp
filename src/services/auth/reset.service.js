'use strict';

const crypto = require('crypto');
const User = require('../../models/User');
const redis = require('../../config/redis');
const REDIS_KEYS = require('../../config/redis-keys');
const { hashPassword } = require('../../utils/hash.util');
const { Errors } = require('../../utils/AppError');

const RESET_TTL = 3600; // 1 hour

/**
 * Generate a password reset token and store in Redis.
 * Caller is responsible for sending the token to the user's email.
 * Note: POST /forgot always returns 200 — never reveal if email exists.
 */
const generateResetToken = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    // Silently return — controller swallows this to avoid email enumeration
    return null;
  }

  const token = crypto.randomBytes(32).toString('hex');
  await redis.set(REDIS_KEYS.passwordReset(email), token, 'EX', RESET_TTL);
  return token;
};

/**
 * Validate reset token, hash new password, and update user.
 * Increments tokenVersion to invalidate all existing JWTs.
 */
const applyPasswordReset = async (token, email, newPassword) => {
  const stored = await redis.get(REDIS_KEYS.passwordReset(email));
  if (!stored || stored !== token) {
    throw Errors.badRequest('Invalid or expired reset token');
  }

  const passwordHash = await hashPassword(newPassword);
  await User.findOneAndUpdate(
    { email },
    { passwordHash, $inc: { tokenVersion: 1 } }
  );

  await redis.del(REDIS_KEYS.passwordReset(email));
};

module.exports = { generateResetToken, applyPasswordReset };
