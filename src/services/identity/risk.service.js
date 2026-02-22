'use strict';

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

/**
 * calcRiskProfile — pure math, no I/O
 * @param {number[]} answers — exactly 6 integers 1–5
 * @returns {{ stabilityScore, procrastinationIndex, driftProbability, rawAnswers }}
 */
const calcRiskProfile = (answers) => {
  // stabilityScore: driven by resilience/commitment answers (indices 1, 4, 5)
  const stabilityRaw = 100 - ((answers[1] + answers[4] + answers[5]) / 3) * 20;
  const stabilityScore = clamp(stabilityRaw, 0, 100);

  // procrastinationIndex: driven by avoidance/delay answers (indices 0, 2)
  const procrastinationRaw = ((answers[0] + answers[2]) / 2) * 20;
  const procrastinationIndex = clamp(procrastinationRaw, 0, 100);

  // driftProbability: composite across 4 risk-relevant answers (indices 0, 1, 2, 5)
  const driftRaw = ((answers[0] + answers[1] + answers[2] + answers[5]) / 4) / 5;
  const driftProbability = clamp(driftRaw, 0, 1);

  return { stabilityScore, procrastinationIndex, driftProbability, rawAnswers: answers };
};

module.exports = { calcRiskProfile };
