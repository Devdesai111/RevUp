'use strict';

// ─── Task 62: Settings Controller ─────────────────────────────────────────────

const User        = require('../models/User');
const redis       = require('../config/redis');
const REDIS_KEYS  = require('../config/redis-keys');
const { sendSuccess } = require('../utils/response.util');

/**
 * PATCH /settings/notifications
 * Update user notification preferences.
 */
const updateNotifications = async (req, res, next) => {
  try {
    const { morning, evening, drift, streak } = req.body;
    const update = {};
    if (morning !== undefined) { update['notificationPreferences.morning'] = morning; }
    if (evening !== undefined) { update['notificationPreferences.evening'] = evening; }
    if (drift   !== undefined) { update['notificationPreferences.drift']   = drift; }
    if (streak  !== undefined) { update['notificationPreferences.streak']  = streak; }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true },
    );
    return sendSuccess(res, { data: { notificationPreferences: user.notificationPreferences } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /settings/fcm-token
 * Update Firebase Cloud Messaging token for push notifications.
 */
const updateFcmToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    await User.findByIdAndUpdate(req.user._id, { $set: { fcmToken: token } });
    // Cache in Redis for fast notification lookups (30 days)
    await redis.setex(REDIS_KEYS.fcmToken(req.user._id.toString()), 86400 * 30, token);
    return sendSuccess(res, { message: 'FCM token updated' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /settings/subscription
 * Return current subscription tier and status.
 */
const getSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('subscriptionTier stripeCustomerId');
    return sendSuccess(res, {
      data: {
        tier:             user.subscriptionTier,
        stripeCustomerId: user.stripeCustomerId,
        isPremium:        user.subscriptionTier === 'premium',
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { updateNotifications, updateFcmToken, getSubscription };
