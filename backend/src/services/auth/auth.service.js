'use strict';

const User = require('../../models/User');
const redis = require('../../config/redis');
const { hashPassword, comparePassword } = require('../../utils/hash.util');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../../utils/jwt.util');
const REDIS_KEYS = require('../../config/redis-keys');
const { Errors } = require('../../utils/AppError');
const env = require('../../config/env');

const REFRESH_TTL = 604800; // 7 days in seconds

// ─── Register ─────────────────────────────────────────────────────────────────
const registerUser = async (email, password) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw Errors.userExists('Email is already registered');
  }

  const passwordHash = await hashPassword(password);
  const user = new User({ email, passwordHash, authProvider: 'local' });
  await user.save();

  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await redis.set(REDIS_KEYS.refreshToken(user._id), refreshToken, 'EX', REFRESH_TTL);

  return { user, accessToken, refreshToken };
};

// ─── Login ────────────────────────────────────────────────────────────────────
const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw Errors.invalidCredentials();
  }

  const match = await comparePassword(password, user.passwordHash);
  if (!match) {
    throw Errors.invalidCredentials();
  }

  if (!user.isActive) {
    throw Errors.forbidden('Account is deactivated');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await redis.set(REDIS_KEYS.refreshToken(user._id), refreshToken, 'EX', REFRESH_TTL);

  return { user, accessToken, refreshToken };
};

// ─── Refresh tokens ───────────────────────────────────────────────────────────
const refreshTokens = async (refreshToken) => {
  const decoded = verifyToken(refreshToken, env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.sub);

  if (!user || user.tokenVersion !== decoded.version) {
    throw Errors.invalidToken('Refresh token has been revoked');
  }

  const newAccessToken  = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  await redis.del(REDIS_KEYS.refreshToken(user._id));
  await redis.set(REDIS_KEYS.refreshToken(user._id), newRefreshToken, 'EX', REFRESH_TTL);

  return { user, accessToken: newAccessToken, refreshToken: newRefreshToken };
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logoutUser = async (userId) => {
  await redis.del(REDIS_KEYS.refreshToken(userId));
};

// ─── Logout all devices ───────────────────────────────────────────────────────
const logoutAll = async (userId) => {
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } }, { new: true });
  await redis.del(REDIS_KEYS.refreshToken(userId));
};

module.exports = { registerUser, loginUser, refreshTokens, logoutUser, logoutAll };
