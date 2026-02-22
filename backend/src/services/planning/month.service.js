'use strict';

const Plan = require('../../models/Plan');
const logger = require('../../utils/logger');

/**
 * extractMonthObjectives — pull the monthlyBreakdown slice for a given monthIndex.
 * monthIndex 0 = months 1-3, 1 = months 4-6, 2 = months 7-9
 * @param {object} quarterPlan  — Plan document or plain object with macroObjectives
 * @param {number} monthIndex   — 0, 1, or 2
 * @returns {string[]} Up to 3 objective strings for that month
 */
const extractMonthObjectives = (quarterPlan, monthIndex) => {
  const objectives = (quarterPlan.macroObjectives || [])
    .slice(0, 3)
    .map((obj) => obj.monthlyBreakdown[monthIndex])
    .filter(Boolean);

  return objectives;
};

/**
 * computeMonthIndex — calculate which monthly slice to use based on days elapsed.
 * @param {Date} quarterStartDate
 * @param {Date} [now]
 * @returns {0|1|2}
 */
const computeMonthIndex = (quarterStartDate, now = new Date()) => {
  const daysElapsed = Math.floor((now - new Date(quarterStartDate)) / (1000 * 60 * 60 * 24));
  if (daysElapsed < 30) { return 0; }
  if (daysElapsed < 60) { return 1; }
  return 2;
};

/**
 * generateMonthPlan — update Plan with current month's objectives.
 * @param {string|ObjectId} userId
 * @returns {object} Updated plan
 */
const generateMonthPlan = async (userId) => {
  const plan = await Plan.findOne({ userId }).sort({ createdAt: -1 });
  if (!plan) { throw new Error('No quarter plan found — generate quarter first'); }

  const monthIndex  = computeMonthIndex(plan.quarterStartDate);
  const objectives  = extractMonthObjectives(plan, monthIndex);
  const monthStart  = new Date();
  monthStart.setUTCHours(0, 0, 0, 0);

  plan.monthlyPlans = plan.monthlyPlans || [];
  plan.monthlyPlans.push({ month: monthStart, objectives });
  await plan.save();

  logger.info({ userId, monthIndex, objectives: objectives.length }, 'Month plan generated');
  return plan;
};

module.exports = { extractMonthObjectives, computeMonthIndex, generateMonthPlan };
