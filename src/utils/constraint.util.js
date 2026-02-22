'use strict';

/**
 * checkOvercommit — validate task hours against user's available daily hours.
 * @param {{ estimatedMins: number }[]} tasks
 * @param {number} availableHoursPerDay
 * @returns {{ isOvercommitted, totalHours, availableHours, excessHours }}
 */
const checkOvercommit = (tasks, availableHoursPerDay) => {
  const totalMins  = tasks.reduce((sum, t) => sum + (t.estimatedMins || 0), 0);
  const totalHours = totalMins / 60;
  const excessHours = Math.max(0, totalHours - availableHoursPerDay);

  return {
    isOvercommitted: totalHours > availableHoursPerDay,
    totalHours,
    availableHours: availableHoursPerDay,
    excessHours,
  };
};

module.exports = { checkOvercommit };
