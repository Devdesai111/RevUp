'use strict';

// ─── Task 61: Alignment Dashboard Controller ──────────────────────────────────

const AlignmentMetric   = require('../models/AlignmentMetric');
const DailyExecutionLog = require('../models/DailyExecutionLog');
const { sendSuccess }   = require('../utils/response.util');
const redis             = require('../config/redis');
const REDIS_KEYS        = require('../config/redis-keys');
const { getLocalDayBounds } = require('../utils/date.util');

/**
 * GET /alignment/dashboard
 * Returns current score, drift, streak, stateLevel, sevenDayAverage, patternFlags
 */
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    // Check cache first
    const cached = await redis.get(REDIS_KEYS.dashboardCache(userId));
    if (cached) {
      return sendSuccess(res, { message: 'Dashboard data', data: JSON.parse(cached) });
    }

    // Fetch latest metric
    const latestMetric = await AlignmentMetric
      .findOne({ userId })
      .sort({ date: -1 });

    // Check if user logged today
    const { startUTC, endUTC } = getLocalDayBounds(req.user.timezone || 'UTC');
    const todayLog = await DailyExecutionLog.findOne({
      userId,
      date: { $gte: startUTC, $lte: endUTC },
    });

    const data = latestMetric
      ? {
          currentScore:    latestMetric.alignmentScore,
          driftIndex:      latestMetric.driftIndex,
          streakCount:     latestMetric.streakCount,
          stateLevel:      latestMetric.stateLevel,
          sevenDayAverage: latestMetric.sevenDayAverage,
          patternFlags:    latestMetric.patternFlags,
          today: {
            date:   new Date().toISOString().split('T')[0],
            logged: Boolean(todayLog),
          },
        }
      : {
          currentScore:    req.user.baselineAlignmentScore || 50,
          driftIndex:      0,
          streakCount:     0,
          stateLevel:      2,
          sevenDayAverage: 50,
          patternFlags:    [],
          today: { date: new Date().toISOString().split('T')[0], logged: false },
        };

    // Cache for 30 min
    await redis.setex(REDIS_KEYS.dashboardCache(userId), 1800, JSON.stringify(data));

    return sendSuccess(res, { message: 'Dashboard data', data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /alignment/trend
 * Returns last 30 days of alignment metrics sorted ascending.
 */
const getTrend = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metrics = await AlignmentMetric.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    })
      .sort({ date: 1 })
      .select('date alignmentScore driftIndex stateLevel');

    return sendSuccess(res, { message: 'Trend data', data: metrics });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /alignment/patterns
 * Returns current pattern flags with human-readable descriptions.
 */
const getPatterns = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const latest = await AlignmentMetric
      .findOne({ userId })
      .sort({ date: -1 })
      .select('patternFlags date');

    const descriptions = {
      MIDWEEK_DRIFT:    'Your Wednesday scores consistently drop 15+ points from Monday.',
      EFFORT_INFLATION: 'You rate your effort high but task completion stays low.',
      OVERCOMMITMENT:   'You are completing fewer than 40% of tasks most days.',
      STREAK_BREAK:     'You recently broke a strong streak. Rebuild momentum.',
    };

    const flags = latest?.patternFlags || [];
    const data  = flags.map((f) => ({
      flag:        f,
      description: descriptions[f] || f,
    }));

    return sendSuccess(res, { message: 'Pattern data', data: { patterns: data, detectedAt: latest?.date } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getTrend, getPatterns };
