'use strict';

// ─── Task 68: User Factory ────────────────────────────────────────────────────

const User           = require('../../../models/User');
const { hashPassword } = require('../../../utils/hash.util');

const buildUser = async (overrides = {}) => ({
  name:             `User ${Date.now()}`,
  email:            `user-${Date.now()}@test.com`,
  passwordHash:     await hashPassword('Password123!'),
  authProvider:     'local',
  timezone:         'UTC',
  subscriptionTier: 'free',
  ...overrides,
});

const createUser = async (overrides = {}) => User.create(await buildUser(overrides));

module.exports = { buildUser, createUser };
