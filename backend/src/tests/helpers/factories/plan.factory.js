'use strict';

// ─── Task 68 (supplement): Plan Factory ──────────────────────────────────────

const Plan = require('../../../models/Plan');

/**
 * Build a plain Plan object (not saved to DB).
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {object} [overrides]
 */
const buildPlan = (userId, overrides = {}) => {
  const now         = new Date();
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const quarterEnd   = new Date(quarterStart);
  quarterEnd.setMonth(quarterEnd.getMonth() + 3);
  quarterEnd.setDate(quarterEnd.getDate() - 1);

  // Current week bounds
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return {
    userId,
    quarterTheme:     'Build the foundation',
    quarterStartDate: quarterStart,
    quarterEndDate:   quarterEnd,
    macroObjectives: [
      {
        title:         'Ship v1 product',
        pillar:        'career',
        successMetric: 'Deployed to production with 100 users',
        monthlyBreakdown: ['Design', 'Build', 'Launch'],
      },
      {
        title:         'Improve fitness baseline',
        pillar:        'health',
        successMetric: 'Run 5km in under 30 minutes',
        monthlyBreakdown: ['Start running', 'Build consistency', 'Hit goal'],
      },
    ],
    monthlyPlans: [
      {
        month:      quarterStart,
        objectives: ['Complete onboarding', 'Establish habits', 'First sprint'],
      },
    ],
    weeklySprints: [
      {
        weekStartDate: weekStart,
        weekEndDate:   weekEnd,
        coreActions: [
          {
            taskId:        'task-001',
            taskName:      'Complete project setup',
            type:          'core',
            weight:        2,
            estimatedMins: 60,
            completed:     false,
            isCore:        true,
            isScoring:     true,
          },
          {
            taskId:        'task-002',
            taskName:      'Write unit tests',
            type:          'core',
            weight:        1,
            estimatedMins: 45,
            completed:     false,
            isCore:        true,
            isScoring:     true,
          },
        ],
        supportingActions: [
          {
            taskId:        'task-003',
            taskName:      'Read one chapter of Deep Work',
            type:          'supporting',
            weight:        1,
            estimatedMins: 30,
            completed:     false,
            isCore:        false,
            isScoring:     true,
          },
        ],
        identityHabit:  'Morning 10-min meditation',
        extraTasks:     [],
        adaptiveLevel:  1,
        generatedByAI:  false,
      },
    ],
    rerollCount: 0,
    status:      'active',
    isActive:    true,
    ...overrides,
  };
};

/**
 * Create and persist a Plan document.
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {object} [overrides]
 * @returns {Promise<import('mongoose').Document>}
 */
const createPlan = (userId, overrides = {}) =>
  Plan.create(buildPlan(userId, overrides));

module.exports = { buildPlan, createPlan };
