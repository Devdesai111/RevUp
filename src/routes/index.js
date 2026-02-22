'use strict';

const { Router } = require('express');
const router = Router();

// ─── Phase 3: Auth ────────────────────────────────────────────────────────────
router.use('/auth', require('./auth.routes'));

// ─── Future routes (Tasks 25, 31, 37, 41, 46, 61…76) ─────────────────────────
router.use('/identity',   require('./identity.routes'));
// router.use('/plan',       require('./plan.routes'));
// router.use('/log',        require('./log.routes'));
// router.use('/alignment',  require('./alignment.routes'));
// router.use('/reflection', require('./reflection.routes'));
// router.use('/review',     require('./review.routes'));
// router.use('/avatar',     require('./avatar.routes'));
// router.use('/journal',    require('./journal.routes'));
// router.use('/notify',     require('./notify.routes'));
// router.use('/payments',   require('./payment.routes'));
// router.use('/webhooks',   require('./webhook.routes'));

module.exports = router;
