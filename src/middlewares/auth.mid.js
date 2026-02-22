'use strict';

const User = require('../models/User');
const { verifyToken } = require('../utils/jwt.util');
const { Errors } = require('../utils/AppError');
const env = require('../config/env');

/**
 * requireAuth — protects any route that needs a logged-in user.
 * Extracts Bearer token → verifies → fetches user → attaches to req.user.
 */
const requireAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(Errors.unauthorized('Authorization header missing or malformed'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token, env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.sub);
    if (!user) {
      return next(Errors.unauthorized('User no longer exists'));
    }

    if (!user.isActive) {
      return next(Errors.forbidden('Account is deactivated'));
    }

    // Check token version to ensure logout-all invalidates old tokens
    if (user.tokenVersion !== decoded.version) {
      return next(Errors.tokenExpired('Token has been revoked'));
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { requireAuth };
