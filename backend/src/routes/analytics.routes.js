'use strict';

const { Router }      = require('express');
const { requireAuth } = require('../middlewares/auth.mid');
const { getDashboard } = require('../controllers/analytics.controller');

const router = Router();
router.use(requireAuth);
router.get('/dashboard', getDashboard);

module.exports = router;
