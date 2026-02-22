'use strict';

// ─── Task 64: FCM Push Notification Service ───────────────────────────────────

const { getFirebaseApp, getAdmin } = require('../../config/firebase');
const redis       = require('../../config/redis');
const REDIS_KEYS  = require('../../config/redis-keys');
const logger      = require('../../utils/logger');
const { NOTIFICATION_TYPES } = require('../../config/constants');

/**
 * Send a push notification to a user.
 * Silently no-ops if Firebase is not configured or user has no FCM token.
 *
 * @param {string} userId
 * @param {{ title: string, body: string, type: string, data?: object }} notification
 */
const sendPushToUser = async (userId, notification) => {
  try {
    const app = getFirebaseApp();
    if (!app) { return; } // Firebase not configured — skip silently

    // Get FCM token: try Redis first, fall back to DB
    let fcmToken = await redis.get(REDIS_KEYS.fcmToken(userId));
    if (!fcmToken) {
      const User = require('../../models/User');
      const user = await User.findById(userId).select('fcmToken');
      if (!user?.fcmToken) { return; }
      fcmToken = user.fcmToken;
      await redis.setex(REDIS_KEYS.fcmToken(userId), 86400, fcmToken);
    }

    const admin = getAdmin();
    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body:  notification.body,
      },
      data: {
        type: notification.type,
        ...(notification.data || {}),
      },
      android: { priority: 'high' },
      apns:    { payload: { aps: { sound: 'default' } } },
    };

    await admin.messaging().send(message);
    logger.info({ userId, type: notification.type }, 'Push notification sent');
  } catch (err) {
    // Never crash — notification failure is non-critical
    logger.error({ err: err.message, userId }, 'Failed to send push notification');
  }
};

// ─── Pre-built Notification Templates ─────────────────────────────────────────

const sendMorningReminder = (userId) =>
  sendPushToUser(userId, {
    title: '🌅 Good morning. Time to set your intent.',
    body:  'What will you accomplish today to become who you said you would be?',
    type:  NOTIFICATION_TYPES.MORNING_BRIEF,
  });

const sendEveningReminder = (userId) =>
  sendPushToUser(userId, {
    title: '🌙 Evening check-in time.',
    body:  'Log your progress and reflect on today.',
    type:  NOTIFICATION_TYPES.EVENING_PROMPT,
  });

const sendDriftAlert = (userId, score) =>
  sendPushToUser(userId, {
    title: '⚠️ Alignment drift detected.',
    body:  `Your score has dropped to ${score}. Your future self needs you now.`,
    type:  NOTIFICATION_TYPES.DRIFT_ALERT,
    data:  { score: String(score) },
  });

const sendStreakMilestone = (userId, streakCount) =>
  sendPushToUser(userId, {
    title: `🔥 ${streakCount}-day streak!`,
    body:  'You are building real momentum. Keep going.',
    type:  NOTIFICATION_TYPES.STREAK_MILESTONE,
    data:  { streakCount: String(streakCount) },
  });

module.exports = {
  sendPushToUser,
  sendMorningReminder,
  sendEveningReminder,
  sendDriftAlert,
  sendStreakMilestone,
};
