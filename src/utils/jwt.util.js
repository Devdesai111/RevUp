'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { Errors } = require('./AppError');

/**
 * Generate a short-lived access token.
 * Payload: { sub: userId, tier: subscriptionTier, version: tokenVersion }
 */
const generateAccessToken = (user) =>
  jwt.sign(
    {
      sub:     user._id.toString(),
      tier:    user.subscriptionTier,
      version: user.tokenVersion,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY }
  );

/**
 * Generate a long-lived refresh token.
 * Payload: { sub: userId, version: tokenVersion }
 */
const generateRefreshToken = (user) =>
  jwt.sign(
    {
      sub:     user._id.toString(),
      version: user.tokenVersion,
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY }
  );

/**
 * Verify any JWT (access or refresh).
 * Throws AppError instead of raw JWT errors.
 */
const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw Errors.tokenExpired();
    }
    throw Errors.invalidToken();
  }
};

module.exports = { generateAccessToken, generateRefreshToken, verifyToken };
