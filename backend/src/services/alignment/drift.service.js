'use strict';

// ─── Task 42: Drift & State Level Math ───────────────────────────────────────
// Pure deterministic math — zero AI/LLM calls.

const { ALIGNMENT, AVATAR_LEVELS } = require('../../config/constants');

/**
 * Calculate 7-day moving average and drift index.
 *
 * Drift = (todayScore - sevenDayAverage) / sevenDayAverage, clamped to [-1.0, +1.0].
 * Positive drift = trending up; negative = drifting down.
 *
 * @param {number}            todayScore       - Final alignment score (after multiplier)
 * @param {AlignmentMetric[]} previousMetrics  - Up to 6 most recent, sorted newest-first
 * @returns {{ driftIndex: number, sevenDayAverage: number }}
 */
const calculateDrift = (todayScore, previousMetrics = []) => {
  // Build rolling window: today + up to 6 previous days = 7 days max
  const window = [todayScore, ...previousMetrics.slice(0, 6).map((m) => m.alignmentScore)];
  const sevenDayAverage = window.reduce((sum, s) => sum + s, 0) / window.length;

  // Drift formula: (today - avg) / avg  — 0 if no divisor
  const rawDrift = sevenDayAverage === 0
    ? 0
    : (todayScore - sevenDayAverage) / sevenDayAverage;

  // Clamp to [-1.0, +1.0] and round to 3 decimal places
  const driftIndex = Math.min(1.0, Math.max(-1.0, Math.round(rawDrift * 1000) / 1000));

  return {
    driftIndex,
    sevenDayAverage: Math.round(sevenDayAverage * 100) / 100,
  };
};

/**
 * Map alignment metrics to avatar state level (1, 2, or 3).
 *
 * State drops IMMEDIATELY.
 * State rises only after 2 consecutive qualifying days.
 *
 * Level 1 — Diminished: 7-day avg < 45 OR sustained danger drift (< -0.4 for 3 days)
 * Level 2 — Stable:     Default
 * Level 3 — Aligned:    7-day avg > 75 AND drift ≥ 0 AND last 2 days also at level 3
 *
 * @param {number}            sevenDayAverage
 * @param {number}            driftIndex
 * @param {AlignmentMetric[]} previousMetrics - Sorted newest-first
 * @returns {1|2|3}
 */
const determineStateLevel = (sevenDayAverage, driftIndex, previousMetrics = []) => {
  // Check for sustained danger drift: today + last 2 days all below danger threshold
  const recentDrift   = [driftIndex, ...previousMetrics.slice(0, 2).map((m) => m.driftIndex)];
  const sustainedDanger = recentDrift.length >= 3 && recentDrift.every((d) => d < ALIGNMENT.DRIFT_DANGER);

  if (sevenDayAverage < ALIGNMENT.STATE_STABLE_MIN || sustainedDanger) {
    return AVATAR_LEVELS.DIMINISHED;  // 1
  }

  if (sevenDayAverage > ALIGNMENT.STATE_ALIGNED_MIN && driftIndex >= 0) {
    // Require 2 previous consecutive days already at Aligned level to confirm upgrade
    const prevLevels = previousMetrics.slice(0, 2).map((m) => m.stateLevel);
    if (prevLevels.length >= 2 && prevLevels.every((l) => l >= AVATAR_LEVELS.ALIGNED)) {
      return AVATAR_LEVELS.ALIGNED;   // 3
    }
    return AVATAR_LEVELS.STABLE;      // 2 — approaching aligned, not yet confirmed
  }

  return AVATAR_LEVELS.STABLE;        // 2
};

module.exports = { calculateDrift, determineStateLevel };
