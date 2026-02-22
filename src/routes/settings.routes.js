'use strict';

// ─── Task 62: Settings Routes ─────────────────────────────────────────────────

const { Router }      = require('express');
const { z }           = require('zod');
const { requireAuth } = require('../middlewares/auth.mid');
const validate        = require('../middlewares/validate.mid');
const ctrl            = require('../controllers/settings.controller');

const notifSchema = z.object({
  body: z.object({
    morning: z.boolean().optional(),
    evening: z.boolean().optional(),
    drift:   z.boolean().optional(),
    streak:  z.boolean().optional(),
  }),
});

const fcmSchema = z.object({
  body: z.object({
    token: z.string().min(10, 'FCM token too short'),
  }),
});

const router = Router();

router.use(requireAuth);

// PATCH /settings/notifications
router.patch('/notifications', validate(notifSchema), ctrl.updateNotifications);

// PATCH /settings/fcm-token
router.patch('/fcm-token', validate(fcmSchema), ctrl.updateFcmToken);

// GET /settings/subscription
router.get('/subscription', ctrl.getSubscription);

module.exports = router;
