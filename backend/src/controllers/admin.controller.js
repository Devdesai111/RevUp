'use strict';

// ─── Task 63: Admin Controller ────────────────────────────────────────────────

const User            = require('../models/User');
const AlignmentMetric = require('../models/AlignmentMetric');
const { enqueueAlignment } = require('../jobs/queues');
const { sendSuccess, sendPaginated } = require('../utils/response.util');
const { PAGINATION } = require('../config/constants');

/**
 * POST /admin/calibrate/:userId
 * Force alignment recalculation for a specific user.
 */
const calibrateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const date = new Date().toISOString();
    await enqueueAlignment({ userId, date, trigger: 'admin_calibrate' });
    return sendSuccess(res, { message: 'Recalculation queued', data: { userId } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /admin/users
 * Paginated list of users with optional tier filter.
 */
const listUsers = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page,  10) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT;
    const { tier } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (tier) { filter.subscriptionTier = tier; }

    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).select('-passwordHash'),
      User.countDocuments(filter),
    ]);

    return sendPaginated(res, {
      data:       users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /admin/metrics
 * Platform-wide usage statistics.
 */
const getPlatformMetrics = async (req, res, next) => {
  try {
    const [totalUsers, premiumUsers, totalMetrics, avgScore] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ subscriptionTier: 'premium', isActive: true }),
      AlignmentMetric.countDocuments({}),
      AlignmentMetric.aggregate([
        { $group: { _id: null, avg: { $avg: '$alignmentScore' } } },
      ]),
    ]);

    return sendSuccess(res, {
      data: {
        totalActiveUsers:      totalUsers,
        premiumUsers,
        totalAlignmentMetrics: totalMetrics,
        platformAverageScore:  avgScore[0]?.avg?.toFixed(2) || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { calibrateUser, listUsers, getPlatformMetrics };
