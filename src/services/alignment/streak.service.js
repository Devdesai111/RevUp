'use strict';

// ─── Task 41: Streak Math ─────────────────────────────────────────────────────
// Pure deterministic math — zero AI/LLM calls.

const { ALIGNMENT } = require('../../config/constants');

/**
 * Calculate today's streak count and multiplier.
 *
 * A streak continues when the previous day's alignmentScore >= STREAK_BREAK_SCORE (50).
 * If no previous metrics, streak starts fresh (count = 0, multiplier = 1.0).
 *
 * @param {number}            rawScore         - Today's raw score (unused in streak calc, kept for API consistency)
 * @param {AlignmentMetric[]} previousMetrics  - Sorted newest-first
 * @returns {{ streakCount: number, multiplier: number }}
 */
const calculateStreak = (rawScore, previousMetrics = []) => {
  const yesterday  = previousMetrics[0];
  const prevStreak = yesterday ? yesterday.streakCount   : 0;
  const prevScore  = yesterday ? yesterday.alignmentScore : 0;

  let streakCount;
  if (yesterday && prevScore >= ALIGNMENT.STREAK_BREAK_SCORE) {
    streakCount = prevStreak + 1;
  } else {
    streakCount = 0;  // No history or streak broken — reset
  }

  let multiplier = 1.0;
  if (streakCount > ALIGNMENT.STREAK_THRESHOLD_HIGH) {
    multiplier = ALIGNMENT.MULTIPLIER_HIGH;   // 1.10
  } else if (streakCount > ALIGNMENT.STREAK_THRESHOLD_LOW) {
    multiplier = ALIGNMENT.MULTIPLIER_LOW;    // 1.05
  }

  return { streakCount, multiplier };
};

/**
 * Apply streak multiplier and cap result at 100.
 *
 * @param {number} rawScore
 * @param {number} multiplier
 * @returns {number}
 */
const applyMultiplier = (rawScore, multiplier) =>
  Math.min(100, Math.round(rawScore * multiplier * 100) / 100);

/**
 * Calculate score for a missed day: 10% deduction from the last known score.
 * Returns 0 if there is no history.
 *
 * @param {AlignmentMetric[]} previousMetrics - Sorted newest-first
 * @returns {number}
 */
const calculateMissedDayScore = (previousMetrics = []) => {
  if (previousMetrics.length === 0) {return 0;}
  const lastScore = previousMetrics[0].alignmentScore;
  const penalty   = lastScore * ALIGNMENT.MISSED_DAY_PENALTY;  // 10%
  return Math.max(0, Math.round(lastScore - penalty));
};

module.exports = { calculateStreak, applyMultiplier, calculateMissedDayScore };
