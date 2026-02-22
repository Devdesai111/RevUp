'use strict';

const { Router }      = require('express');
const { requireAuth } = require('../middlewares/auth.mid');
const { requireRole } = require('../middlewares/role.mid');
const validate        = require('../middlewares/validate.mid');
const uploadAudio     = require('../middlewares/upload.mid');
const {
  logSchema,
  timerSchema,
  intentSchema,
}                     = require('../validators/exec.validator');
const {
  declareIntent,
  saveLog,
  editLog,
  syncTimer,
  commitVoice,
  getToday,
}                     = require('../controllers/exec.controller');

const router = Router();

// All execution routes require auth
router.use(requireAuth);

// POST /execute/intent
router.post('/intent', validate(intentSchema), declareIntent);

// POST /execute/log
router.post('/log', validate(logSchema), saveLog);

// PATCH /execute/log
router.patch('/log', validate(logSchema), editLog);

// POST /execute/timer
router.post('/timer', validate(timerSchema), syncTimer);

// POST /execute/commit-voice — premium only
router.post(
  '/commit-voice',
  requireRole(['premium']),
  uploadAudio,
  commitVoice,
);

// GET /execute/today
router.get('/today', getToday);

module.exports = router;
