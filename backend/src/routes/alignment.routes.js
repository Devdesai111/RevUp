'use strict';

// ─── Task 61: Alignment Routes ────────────────────────────────────────────────

const { Router }      = require('express');
const { requireAuth } = require('../middlewares/auth.mid');
const {
  getDashboard,
  getTrend,
  getPatterns,
} = require('../controllers/alignment.controller');

const router = Router();

router.use(requireAuth);

// GET /alignment/dashboard
router.get('/dashboard', getDashboard);

// GET /alignment/trend
router.get('/trend', getTrend);

// GET /alignment/patterns
router.get('/patterns', getPatterns);

module.exports = router;
