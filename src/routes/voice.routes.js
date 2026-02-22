'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/voice.controller');
const { requireAuth } = require('../middlewares/auth.mid');
const { requireRole } = require('../middlewares/role.mid');
const uploadAudio = require('../middlewares/upload.mid');

router.use(requireAuth);

// Premium-only: voice transcription
router.post('/transcribe', requireRole(['premium']), uploadAudio, ctrl.transcribeAudio);

module.exports = router;
