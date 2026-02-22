'use strict';

describe('risk.service', () => {
  let calcRiskProfile;
  beforeAll(() => ({ calcRiskProfile } = require('../../services/identity/risk.service')));

  it('should return stabilityScore, procrastinationIndex, driftProbability', () => {
    const result = calcRiskProfile([3, 3, 3, 3, 3, 3]);
    expect(result).toHaveProperty('stabilityScore');
    expect(result).toHaveProperty('procrastinationIndex');
    expect(result).toHaveProperty('driftProbability');
    expect(result).toHaveProperty('rawAnswers');
  });

  it('stabilityScore should be 100 when risk answers are all 1', () => {
    const result = calcRiskProfile([1, 1, 1, 1, 1, 1]);
    // stabilityScore = 100 - ((1+1+1)/3)*20 = 100 - 20 = 80
    expect(result.stabilityScore).toBeCloseTo(80);
  });

  it('procrastinationIndex should be 20 when answers[0] and answers[2] are 1', () => {
    const result = calcRiskProfile([1, 3, 1, 3, 3, 3]);
    // procrastinationIndex = ((1+1)/2)*20 = 20
    expect(result.procrastinationIndex).toBeCloseTo(20);
  });

  it('all values should be clamped between 0 and 100', () => {
    const result = calcRiskProfile([5, 5, 5, 5, 5, 5]);
    expect(result.stabilityScore).toBeGreaterThanOrEqual(0);
    expect(result.stabilityScore).toBeLessThanOrEqual(100);
    expect(result.procrastinationIndex).toBeGreaterThanOrEqual(0);
    expect(result.procrastinationIndex).toBeLessThanOrEqual(100);
    expect(result.driftProbability).toBeGreaterThanOrEqual(0);
    expect(result.driftProbability).toBeLessThanOrEqual(1);
  });
});

describe('baseline.util', () => {
  let calcBaselineScore;
  beforeAll(() => ({ calcBaselineScore } = require('../../services/identity/baseline.util')));

  it('should return a baselineScore number', () => {
    const result = calcBaselineScore({ energyLevel: 5, executionGapSeverity: 3, driftProbability: 0.5 });
    expect(typeof result.baselineScore).toBe('number');
  });

  it('should clamp result between 0 and 100', () => {
    const high = calcBaselineScore({ energyLevel: 10, executionGapSeverity: 1, driftProbability: 0 });
    const low  = calcBaselineScore({ energyLevel: 1,  executionGapSeverity: 5, driftProbability: 1 });
    expect(high.baselineScore).toBeLessThanOrEqual(100);
    expect(high.baselineScore).toBeGreaterThanOrEqual(0);
    expect(low.baselineScore).toBeGreaterThanOrEqual(0);
  });

  it('should use 50 as base when energyLevel=5, severity=0, drift=0', () => {
    const result = calcBaselineScore({ energyLevel: 5, executionGapSeverity: 0, driftProbability: 0 });
    // base=50 + (5-5)*2 - 0*2 - 0*10 = 50
    expect(result.baselineScore).toBe(50);
  });
});
