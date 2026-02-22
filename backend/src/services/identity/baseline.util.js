'use strict';

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

/**
 * calcBaselineScore — pure math, no I/O
 * Formula: base = 50 + (energyLevel-5)*2 - executionGapSeverity*2 - driftProbability*10
 * @param {{ energyLevel: number, executionGapSeverity: number, driftProbability: number }}
 * @returns {{ baselineScore: number }}
 */
const calcBaselineScore = ({ energyLevel, executionGapSeverity, driftProbability }) => {
  const raw = 50
    + (energyLevel - 5) * 2
    - executionGapSeverity * 2
    - driftProbability * 10;

  return { baselineScore: clamp(raw, 0, 100) };
};

module.exports = { calcBaselineScore };
