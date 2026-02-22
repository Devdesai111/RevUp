'use strict';

// ─── Task 40: Alignment Score Math ───────────────────────────────────────────
// Pure deterministic math — zero AI/LLM calls.
// Formula weights must sum to 1.0:
//   Core 50% | Support 20% | Habit 15% | Effort 10% | Reflection 5%

/**
 * Calculate raw daily alignment score (0-100) BEFORE streak multiplier.
 *
 * @param {object} exec
 * @param {number} exec.coreTasksTotal
 * @param {number} exec.coreTasksDone
 * @param {number} exec.supportTasksTotal
 * @param {number} exec.supportTasksDone
 * @param {boolean} exec.habitDone
 * @param {number}  exec.averageEffort    - 1-10 scale
 * @param {boolean} exec.isMissedDay      - If true, zero out effort contribution
 * @param {number}  reflectionQuality     - 0-100
 * @returns {{ rawScore: number, components: object }}
 */
const calculateRawScore = (exec, reflectionQuality = 0) => {
  // ── Core Task Completion: 50% weight ───────────────────────────────────────
  const coreCompletion = exec.coreTasksTotal > 0
    ? (exec.coreTasksDone / exec.coreTasksTotal) * 100
    : 0;

  // ── Supporting Task Completion: 20% weight ─────────────────────────────────
  const supportCompletion = exec.supportTasksTotal > 0
    ? (exec.supportTasksDone / exec.supportTasksTotal) * 100
    : 0;

  // ── Habit Completion: 15% weight ───────────────────────────────────────────
  const habitCompletion = exec.habitDone ? 100 : 0;

  // ── Effort Normalized: 10% weight ─────────────────────────────────────────
  // Effort is 1-10; normalize to 0-100. Zeroed out on missed days.
  const effortNormalized = exec.isMissedDay
    ? 0
    : Math.max(0, ((exec.averageEffort - 1) / 9) * 100);

  // ── Weighted Formula ───────────────────────────────────────────────────────
  const rawScore =
    (coreCompletion    * 0.50) +   // max 50 pts
    (supportCompletion * 0.20) +   // max 20 pts
    (habitCompletion   * 0.15) +   // max 15 pts
    (effortNormalized  * 0.10) +   // max 10 pts
    (reflectionQuality * 0.05);    // max  5 pts

  return {
    rawScore: Math.min(100, Math.max(0, Math.round(rawScore * 100) / 100)),
    components: {
      coreCompletion,
      supportCompletion,
      habitCompletion,
      effortNormalized,
      reflectionQuality,
    },
  };
};

module.exports = { calculateRawScore };
