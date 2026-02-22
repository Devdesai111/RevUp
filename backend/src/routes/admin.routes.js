'use strict';

// ─── Task 63: Admin Routes ────────────────────────────────────────────────────

const { Router }       = require('express');
const { requireAuth }  = require('../middlewares/auth.mid');
const { requireAdmin } = require('../middlewares/role.mid');
const ctrl             = require('../controllers/admin.controller');

const router = Router();

router.use(requireAuth, requireAdmin);

// POST /admin/calibrate/:userId
router.post('/calibrate/:userId', ctrl.calibrateUser);

// GET /admin/users
router.get('/users', ctrl.listUsers);

// GET /admin/metrics
router.get('/metrics', ctrl.getPlatformMetrics);

module.exports = router;
