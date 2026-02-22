'use strict';

// ─── Task 54: Dashboard Analytics Aggregation ────────────────────────────────
// Heavy MongoDB aggregations for web dashboard charts.
// Results cached in Redis for 30 minutes.

const redis          = require('../../config/redis');
const REDIS_KEYS     = require('../../config/redis-keys');
const AlignmentMetric = require('../../models/AlignmentMetric');
const DailyExecutionLog = require('../../models/DailyExecutionLog');
const logger         = require('../../utils/logger');

const CACHE_TTL  = 1800;  // 30 minutes
const DAY_NAMES  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Aggregation functions ────────────────────────────────────────────────────

/**
 * 30-day alignment score trend for sparkline/area chart.
 */
const get30DayTrend = async (userId) => {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  return AlignmentMetric.aggregate([
    { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId), date: { $gte: since } } },
    { $sort:  { date: 1 } },
    { $project: { _id: 0, date: 1, alignmentScore: 1, driftIndex: 1 } },
  ]);
};

/**
 * Execution heatmap: average completion by day-of-week.
 */
const getExecutionHeatmap = async (userId) => {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const rows = await DailyExecutionLog.aggregate([
    { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId), date: { $gte: since } } },
    { $group: { _id: { $dayOfWeek: '$date' }, avgCompletion: { $avg: '$coreCompletionPct' } } },
    { $sort:  { _id: 1 } },
  ]);

  return rows.map((r) => ({
    day:           DAY_NAMES[r._id - 1] || 'Unknown',
    avgCompletion: Math.round(r.avgCompletion || 0),
  }));
};

/**
 * Weekly completion graph: completion + habit rate per week.
 */
const getWeeklyCompletionGraph = async (userId) => {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  return DailyExecutionLog.aggregate([
    { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId), date: { $gte: since } } },
    { $group: {
      _id:            { $isoWeek: '$date' },
      avgCompletion:  { $avg: '$coreCompletionPct' },
      habitRate:      { $avg: { $cond: ['$identityHabitDone', 100, 0] } },
    }},
    { $sort: { _id: 1 } },
    { $project: { _id: 0, week: '$_id', avgCompletion: { $round: ['$avgCompletion', 0] }, habitRate: { $round: ['$habitRate', 0] } } },
  ]);
};

/**
 * Drift index series for drift chart.
 */
const getDriftChart = async (userId) => {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  return AlignmentMetric.aggregate([
    { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId), date: { $gte: since } } },
    { $sort:  { date: 1 } },
    { $project: { _id: 0, date: 1, driftIndex: 1, sevenDayAverage: 1 } },
  ]);
};

// ─── Main: full dashboard bundle (cached) ────────────────────────────────────

/**
 * Build and cache the full dashboard analytics bundle.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getDashboardData = async (userId) => {
  const cacheKey = REDIS_KEYS.dashboardCache(userId);

  const cached = await redis.get(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch (_) { /* rebuild */ }
  }

  const [trend, heatmap, weekly, drift] = await Promise.all([
    get30DayTrend(userId),
    getExecutionHeatmap(userId),
    getWeeklyCompletionGraph(userId),
    getDriftChart(userId),
  ]);

  const data = { trend, heatmap, weekly, drift };

  try {
    await redis.set(cacheKey, JSON.stringify(data), 'EX', CACHE_TTL);
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to cache dashboard data');
  }

  return data;
};

module.exports = {
  getDashboardData,
  get30DayTrend,
  getExecutionHeatmap,
  getWeeklyCompletionGraph,
  getDriftChart,
};
