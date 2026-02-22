'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/avatar.controller');
const { requireAuth } = require('../middlewares/auth.mid');

router.use(requireAuth);

router.get('/state', ctrl.getState);

module.exports = router;
