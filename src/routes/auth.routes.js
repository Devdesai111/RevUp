'use strict';

const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.mid');
const { requireAuth } = require('../middlewares/auth.mid');
const { authRateLimit } = require('../middlewares/rateLimit.mid');
const {
  registerSchema, loginSchema, forgotSchema, resetSchema,
  updateMeSchema, refreshSchema, logoutSchema,
} = require('../validators/auth.validator');

const router = Router();

// Public — rate-limited
router.post('/register',  authRateLimit, validate(registerSchema), controller.register);
router.post('/login',     authRateLimit, validate(loginSchema),    controller.login);
router.post('/google',    controller.googleOAuth);
router.post('/apple',     controller.appleOAuth);
router.post('/forgot',    authRateLimit, validate(forgotSchema),   controller.forgotPassword);
router.post('/reset',     validate(resetSchema),                   controller.resetPassword);
router.post('/refresh',   validate(refreshSchema),                 controller.refresh);

// Protected
router.get('/me',         requireAuth,                                      controller.getMe);
router.patch('/me',       requireAuth, validate(updateMeSchema),            controller.updateMe);
router.post('/logout',    requireAuth, validate(logoutSchema),              controller.logout);
router.post('/logout-all',requireAuth,                                      controller.logoutAll);
router.delete('/account', requireAuth,                                      controller.deleteAccount);

module.exports = router;
