'use strict';

const authService  = require('../services/auth/auth.service');
const oauthService = require('../services/auth/oauth.service');
const resetService = require('../services/auth/reset.service');
const { sendSuccess, sendCreated } = require('../utils/response.util');

const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.registerUser(email, password);
    return sendCreated(res, {
      message: 'Registration successful',
      data: {
        user:         result.user,
        accessToken:  result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    return sendSuccess(res, {
      message: 'Login successful',
      data: {
        user:         result.user,
        accessToken:  result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const googleOAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const profile = await oauthService.verifyGoogleToken(idToken);
    const user = await oauthService.findOrCreateOAuthUser(profile.email, 'google');
    const result = await oauthService.generateOAuthTokens(user);
    return sendSuccess(res, {
      message: 'Google login successful',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

const appleOAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const profile = await oauthService.verifyAppleToken(idToken);
    const user = await oauthService.findOrCreateOAuthUser(profile.email, 'apple');
    const result = await oauthService.generateOAuthTokens(user);
    return sendSuccess(res, {
      message: 'Apple login successful',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, {
      message: 'User profile retrieved',
      data: { user: req.user },
    });
  } catch (err) {
    return next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const { timezone, notificationPreferences } = req.body;
    const user = req.user;

    if (timezone !== undefined) { user.timezone = timezone; }
    if (notificationPreferences !== undefined) {
      Object.assign(user.notificationPreferences, notificationPreferences);
    }
    await user.save();

    return sendSuccess(res, {
      message: 'Profile updated',
      data: { user },
    });
  } catch (err) {
    return next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshTokens(refreshToken);
    return sendSuccess(res, {
      message: 'Tokens refreshed',
      data: {
        accessToken:  result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logoutUser(req.user._id);
    return sendSuccess(res, { message: 'Logged out successfully', data: null });
  } catch (err) {
    return next(err);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    await authService.logoutAll(req.user._id);
    return sendSuccess(res, { message: 'Logged out from all devices', data: null });
  } catch (err) {
    return next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    // Always return 200 — never reveal if email exists
    await resetService.generateResetToken(email).catch(() => {});
    return sendSuccess(res, {
      message: 'If that email is registered, you will receive a reset link shortly',
      data: null,
    });
  } catch (err) {
    return next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, email, newPassword } = req.body;
    await resetService.applyPasswordReset(token, email, newPassword);
    return sendSuccess(res, { message: 'Password reset successful', data: null });
  } catch (err) {
    return next(err);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    req.user.isActive = false;
    await req.user.save();
    await authService.logoutAll(req.user._id);
    return sendSuccess(res, { message: 'Account deactivated', data: null });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  register, login, googleOAuth, appleOAuth,
  getMe, updateMe, refresh, logout, logoutAll,
  forgotPassword, resetPassword, deleteAccount,
};
