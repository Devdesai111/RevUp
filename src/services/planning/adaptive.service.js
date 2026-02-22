'use strict';

/**
 * getAdaptiveLevel — scale task difficulty based on current streak.
 * Level 1: streak <= 14  → baseline (3 core, 2 supporting)
 * Level 2: streak > 14   → +1 supporting task
 * Level 3: streak > 28   → +1 core task (on top of level 2)
 * Max level: 5
 * @param {number} streakCount
 * @returns {1|2|3|4|5}
 */
const getAdaptiveLevel = (streakCount) => {
  if (streakCount > 28) { return 3; }
  if (streakCount > 14) { return 2; }
  return 1;
};

/**
 * applyAdaptiveLevel — return adjusted task counts for a given level.
 * @param {number} level
 * @returns {{ coreCount: number, supportingCount: number }}
 */
const applyAdaptiveLevel = (level) => {
  const base = { coreCount: 3, supportingCount: 2 };
  if (level >= 3) { return { coreCount: 4, supportingCount: 3 }; }
  if (level >= 2) { return { coreCount: 3, supportingCount: 3 }; }
  return base;
};

module.exports = { getAdaptiveLevel, applyAdaptiveLevel };
