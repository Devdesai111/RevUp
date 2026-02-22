'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/identity.controller');
const { requireAuth } = require('../middlewares/auth.mid');
const { requireRole } = require('../middlewares/role.mid');
const { validate } = require('../middlewares/validate.mid');
const {
  currentIdentitySchema,
  futureIdentitySchema,
  constraintsSchema,
  riskSchema,
  pillarsSchema,
  avatarBaseSchema,
  declarationSchema,
} = require('../validators/identity.validator');

// All identity routes require authentication
router.use(requireAuth);

router.get('/me',       ctrl.getMe);
router.get('/status',   ctrl.getStatus);

router.post('/current',     validate(currentIdentitySchema), ctrl.saveCurrentIdentity);
router.post('/future',      validate(futureIdentitySchema),  ctrl.saveFutureIdentity);
router.post('/constraints', validate(constraintsSchema),     ctrl.saveConstraints);
router.post('/risk',        validate(riskSchema),            ctrl.saveRisk);
router.post('/pillars',     validate(pillarsSchema),         ctrl.savePillars);
router.post('/synthesize',  ctrl.synthesize);
router.post('/avatar-base', validate(avatarBaseSchema),      ctrl.saveAvatarBase);

router.patch('/declaration', validate(declarationSchema), ctrl.updateDeclaration);

router.delete('/reset', requireRole(['premium']), ctrl.resetIdentity);

module.exports = router;
