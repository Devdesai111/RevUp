'use strict';

// ─── Task 68: Auth Test Helper ────────────────────────────────────────────────

const User                                       = require('../../models/User');
const { hashPassword }                           = require('../../utils/hash.util');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt.util');

/**
 * Create a test user and return user + tokens.
 * @param {object} overrides - Field overrides
 * @returns {{ user, accessToken, refreshToken }}
 */
const createTestUser = async (overrides = {}) => {
  const defaults = {
    name:             overrides.name     || `Test User ${Date.now()}`,
    email:            overrides.email    || `test-${Date.now()}@revup.app`,
    passwordHash:     overrides.passwordHash || await hashPassword('Password123!'),
    authProvider:     'local',
    subscriptionTier: 'free',
    timezone:         'UTC',
  };

  const merged = { ...defaults, ...overrides };
  const user   = await User.create(merged);
  return {
    user,
    accessToken:  generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
};

const createPremiumUser = (overrides = {}) =>
  createTestUser({ subscriptionTier: 'premium', ...overrides });

const createAdminUser = (overrides = {}) =>
  createTestUser({ isAdmin: true, subscriptionTier: 'premium', ...overrides });

module.exports = { createTestUser, createPremiumUser, createAdminUser };
