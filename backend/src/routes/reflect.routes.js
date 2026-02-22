'use strict';

// ─── Tasks 46 + 67 + 72: Reflection Routes ────────────────────────────────────

const { Router }       = require('express');
const { requireAuth }  = require('../middlewares/auth.mid');
const { requireRole }  = require('../middlewares/role.mid');
const validate         = require('../middlewares/validate.mid');

const { eveningSchema, searchSchema, historySchema, exportPDFSchema } = require('../validators/reflect.validator');
const {
  eveningReflection,
  getReflectionHistory,
  searchReflections,
  exportPDF,
} = require('../controllers/reflect.controller');

const router = Router();

router.use(requireAuth);

// POST /reflect/evening
router.post('/evening', validate(eveningSchema), eveningReflection);

// GET /reflect/history
router.get('/history', validate(historySchema), getReflectionHistory);

// GET /reflect/search
router.get('/search', validate(searchSchema), searchReflections);

// GET /reflect/export/pdf — premium only
router.get('/export/pdf', requireRole(['premium']), validate(exportPDFSchema), exportPDF);

module.exports = router;
