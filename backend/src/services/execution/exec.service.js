'use strict';

const DailyExecutionLog = require('../../models/DailyExecutionLog');

// ─── computeCompletions ───────────────────────────────────────────────────────
/**
 * Calculate core/support completion percentages and average effort.
 * @param {Array} tasks
 * @returns {{ coreCompletionPct: number, supportCompletionPct: number, averageEffort: number }}
 */
const computeCompletions = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return { coreCompletionPct: 0, supportCompletionPct: 0, averageEffort: 0 };
  }

  const coreTasks    = tasks.filter((t) => t.isCore);
  const supportTasks = tasks.filter((t) => !t.isCore);

  const completedCore    = coreTasks.filter((t) => t.completed);
  const completedSupport = supportTasks.filter((t) => t.completed);

  const coreCompletionPct    = coreTasks.length > 0
    ? Math.round((completedCore.length / coreTasks.length) * 100)
    : 0;

  const supportCompletionPct = supportTasks.length > 0
    ? Math.round((completedSupport.length / supportTasks.length) * 100)
    : 0;

  const completedAll  = tasks.filter((t) => t.completed);
  const averageEffort = completedAll.length > 0
    ? completedAll.reduce((sum, t) => sum + (t.effortScore || 0), 0) / completedAll.length
    : 0;

  return { coreCompletionPct, supportCompletionPct, averageEffort };
};

// ─── upsertLog ────────────────────────────────────────────────────────────────
/**
 * Create or update the daily execution log for a user on a given date.
 * @param {string}  userId
 * @param {Date}    date      — UTC midnight of the user's local day
 * @param {object}  logData   — { tasks, habitDone, deepWorkMinutes }
 * @returns {Promise<Document>}
 */
const upsertLog = async (userId, date, logData) => {
  const { tasks = [], habitDone = false, deepWorkMinutes } = logData;
  const completions = computeCompletions(tasks);

  const setFields = {
    tasks,
    identityHabitDone:    habitDone,
    coreCompletionPct:    completions.coreCompletionPct,
    supportCompletionPct: completions.supportCompletionPct,
    averageEffort:        completions.averageEffort,
  };

  if (deepWorkMinutes !== undefined) {
    setFields.deepWorkMinutes = deepWorkMinutes;
  }

  return DailyExecutionLog.findOneAndUpdate(
    { userId, date },
    { $set: setFields },
    { upsert: true, new: true, runValidators: true },
  );
};

module.exports = { computeCompletions, upsertLog };
