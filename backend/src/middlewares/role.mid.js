'use strict';

const { Errors } = require('../utils/AppError');

/**
 * requireRole(allowedTiers) — gates routes by subscription tier.
 * Usage: requireRole(['premium'])
 */
const requireRole = (allowedTiers) => (req, _res, next) => {
  if (!req.user) {
    return next(Errors.unauthorized());
  }
  if (!allowedTiers.includes(req.user.subscriptionTier)) {
    return next(Errors.premiumRequired('This feature requires a premium subscription'));
  }
  return next();
};

/**
 * requireAdmin — gates routes to admin users only.
 */
const requireAdmin = (req, _res, next) => {
  if (!req.user) {
    return next(Errors.unauthorized());
  }
  if (!req.user.isAdmin) {
    return next(Errors.forbidden('Admin access required'));
  }
  return next();
};

module.exports = { requireRole, requireAdmin };
