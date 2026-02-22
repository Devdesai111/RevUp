'use strict';

// ─── Task 68: Alignment Metric Factory ───────────────────────────────────────

const AlignmentMetric = require('../../../models/AlignmentMetric');

/**
 * Create N days of AlignmentMetrics for a user.
 * @param {string} userId
 * @param {number} days  — How many days back to create (default: 7)
 * @param {object} overrides — Applied to each metric
 * @returns {Promise<AlignmentMetric[]>}
 */
const createMetricHistory = async (userId, days = 7, overrides = {}) => {
  const metrics = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    metrics.push({
      userId,
      date,
      alignmentScore:   Math.floor(Math.random() * 30) + 55, // 55-85
      rawScore:         Math.floor(Math.random() * 30) + 50,
      streakMultiplier: 1.0,
      streakCount:      Math.max(0, days - i - 1),
      driftIndex:       (Math.random() * 0.4) - 0.2,
      sevenDayAverage:  68,
      stateLevel:       2,
      patternFlags:     [],
      components: {
        coreCompletion:    70,
        supportCompletion: 60,
        habitCompletion:   100,
        effortNormalized:  60,
        reflectionQuality: 0,
      },
      ...overrides,
    });
  }

  return AlignmentMetric.insertMany(metrics);
};

module.exports = { createMetricHistory };
