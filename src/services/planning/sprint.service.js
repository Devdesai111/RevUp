'use strict';

const { v4: uuidv4 } = require('uuid');
const Plan = require('../../models/Plan');
const { checkOvercommit } = require('../../utils/constraint.util');
const { getAdaptiveLevel, applyAdaptiveLevel } = require('./adaptive.service');
const { getWeekBounds } = require('../../utils/date.util');
const logger = require('../../utils/logger');
const { Errors } = require('../../utils/AppError');

const DEFAULT_MINS = { core: 60, supporting: 45, habit: 30 };

/**
 * buildSprintTasks — pure function: build the task array from named actions.
 * @param {{ coreActions, supportingActions, habitDescription }} options
 * @returns {object[]} task objects
 */
const buildSprintTasks = ({ coreActions, supportingActions, habitDescription }) => {
  const tasks = [];

  (coreActions || []).forEach((name) => {
    tasks.push({
      taskId:        uuidv4(),
      taskName:      name,
      type:          'core',
      weight:        3,
      isCore:        true,
      estimatedMins: DEFAULT_MINS.core,
    });
  });

  (supportingActions || []).forEach((name) => {
    tasks.push({
      taskId:        uuidv4(),
      taskName:      name,
      type:          'supporting',
      weight:        1,
      isCore:        false,
      estimatedMins: DEFAULT_MINS.supporting,
    });
  });

  if (habitDescription) {
    tasks.push({
      taskId:        uuidv4(),
      taskName:      habitDescription,
      type:          'habit',
      weight:        1.5,
      isCore:        false,
      estimatedMins: DEFAULT_MINS.habit,
    });
  }

  return tasks;
};

/**
 * generateSprint — create a weekly sprint, validate hours, persist to Plan doc.
 * @param {{ userId, identity, streakCount, availableHoursPerDay, timezone }} opts
 * @returns {object} Updated plan document
 */
const generateSprint = async ({ userId, identity, streakCount = 0, availableHoursPerDay = 8, timezone = 'UTC' }) => {
  const plan = await Plan.findOne({ userId }).sort({ createdAt: -1 });
  if (!plan) { throw new Error('No plan found — generate quarter first'); }

  const level   = getAdaptiveLevel(streakCount);
  const counts  = applyAdaptiveLevel(level);

  // Pull task names from monthly objectives, pad with defaults if not enough
  const monthlyObj  = plan.monthlyPlans?.[plan.monthlyPlans.length - 1]?.objectives || [];
  const coreActions = Array.from(
    { length: counts.coreCount },
    (_, i) => monthlyObj[i] || `Core Task ${i + 1}`,
  );

  const supportingActions = Array.from(
    { length: counts.supportingCount },
    (_, i) => `Supporting Task ${i + 1}`,
  );

  const habit = identity?.futureIdentity?.skillGoals?.[0]
    ? `Practice: ${identity.futureIdentity.skillGoals[0]}`
    : 'Daily identity habit';

  const tasks = buildSprintTasks({
    coreActions,
    supportingActions,
    habitDescription: habit,
  });

  // Overcommit check
  const overcommit = checkOvercommit(tasks, availableHoursPerDay);
  if (overcommit.isOvercommitted) {
    throw Errors.overcommit(`Sprint exceeds available hours (${overcommit.excessHours.toFixed(1)}h excess)`);
  }

  const { startUTC, endUTC } = getWeekBounds(timezone);

  plan.weeklySprints = plan.weeklySprints || [];
  plan.weeklySprints.push({
    weekStartDate:  startUTC,
    weekEndDate:    endUTC,
    coreActions:    tasks.filter((t) => t.type === 'core'),
    supportingActions: tasks.filter((t) => t.type === 'supporting'),
    identityHabit:  habit,
    adaptiveLevel:  level,
  });

  await plan.save();
  logger.info({ userId, level, tasksCount: tasks.length }, 'Sprint generated');
  return plan;
};

module.exports = { buildSprintTasks, generateSprint };
