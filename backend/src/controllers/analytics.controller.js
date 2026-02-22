'use strict';

// ─── Task 54: Analytics Controller ───────────────────────────────────────────

const { sendSuccess } = require('../utils/response.util');
const { getDashboardData } = require('../services/analytics/dashboard.service');

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const data   = await getDashboardData(userId);
    return sendSuccess(res, { message: 'Dashboard data', data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
