'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/plan.controller');
const { requireAuth } = require('../middlewares/auth.mid');
const validate = require('../middlewares/validate.mid');
const { editSprintSchema, extraTaskSchema } = require('../validators/plan.validator');

router.use(requireAuth);

router.post('/quarter',              ctrl.generateQuarter);
router.post('/month',                ctrl.generateMonth);
router.post('/sprint',               ctrl.generateSprint);
router.get('/current',               ctrl.getCurrentPlan);
router.get('/today',                 ctrl.getTodayTasks);
router.get('/history',               ctrl.getPlanHistory);
router.get('/stats',                 ctrl.getPlanStats);
router.patch('/sprint',              validate(editSprintSchema), ctrl.editSprint);
router.post('/sprint/reroll',        ctrl.rerollSprint);
router.post('/sprint/extra',         validate(extraTaskSchema),  ctrl.addExtraTask);
router.delete('/sprint/extra/:taskId', ctrl.removeExtraTask);

module.exports = router;
