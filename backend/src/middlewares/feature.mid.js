'use strict';

// ─── Task 66: Feature Flag Middleware ─────────────────────────────────────────

const env         = require('../config/env');
const { Errors }  = require('../utils/AppError');

/**
 * Factory: returns middleware that checks if a feature flag is enabled.
 *
 * Usage: router.post('/voice', requireFeature('FEATURE_VOICE_ONBOARDING'), handler)
 *
 * @param {'FEATURE_VOICE_ONBOARDING' | 'FEATURE_TTS_RESPONSE'} flagName
 */
const requireFeature = (flagName) => (req, _res, next) => {
  if (!env[flagName]) {
    return next(Errors.forbidden(`Feature '${flagName}' is currently disabled`));
  }
  return next();
};

module.exports = { requireFeature };
