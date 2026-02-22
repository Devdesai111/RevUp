'use strict';

const User = require('../../models/User');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt.util');
const REDIS_KEYS = require('../../config/redis-keys');
const redis = require('../../config/redis');
const env = require('../../config/env');

const REFRESH_TTL = 604800;

/**
 * Verify Google ID token.
 * In dev/test: decode without full validation.
 * In production: call Google tokeninfo endpoint.
 */
const verifyGoogleToken = async (idToken) => {
  if (env.NODE_ENV !== 'production') {
    // Decode without verification for dev/test
    const [, payloadB64] = idToken.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    return { email: payload.email, name: payload.name, googleId: payload.sub };
  }

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
  );
  if (!res.ok) {
    throw new Error('Invalid Google token');
  }
  const payload = await res.json();
  return { email: payload.email, name: payload.name, googleId: payload.sub };
};

/**
 * Verify Apple ID token (placeholder — no full validation in dev).
 */
const verifyAppleToken = async (idToken) => {
  const [, payloadB64] = idToken.split('.');
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
  return { email: payload.email, appleId: payload.sub };
};

/**
 * Find or create a user for OAuth logins.
 * Uses upsert to avoid race conditions.
 */
const findOrCreateOAuthUser = async (email, provider) => {
  const user = await User.findOneAndUpdate(
    { email },
    { authProvider: provider, isActive: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return user;
};

/**
 * Generate token pair for an OAuth user (reusable by controller).
 */
const generateOAuthTokens = async (user) => {
  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await redis.set(REDIS_KEYS.refreshToken(user._id), refreshToken, 'EX', REFRESH_TTL);
  return { user, accessToken, refreshToken };
};

module.exports = { verifyGoogleToken, verifyAppleToken, findOrCreateOAuthUser, generateOAuthTokens };
