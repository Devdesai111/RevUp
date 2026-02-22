'use strict';

// ─── Task 40: score.service ───────────────────────────────────────────────────
describe('score.service — calculateRawScore', () => {
  const { calculateRawScore } = require('../../../services/alignment/score.service');

  const perfectExec = {
    coreTasksTotal: 3, coreTasksDone: 3,
    supportTasksTotal: 2, supportTasksDone: 2,
    habitDone: true,
    averageEffort: 10,
    isMissedDay: false,
  };

  it('perfect execution + perfect effort + perfect reflection = 100', () => {
    const { rawScore } = calculateRawScore(perfectExec, 100);
    expect(rawScore).toBe(100);
  });

  it('all zeros returns 0', () => {
    const zeroExec = {
      coreTasksTotal: 3, coreTasksDone: 0,
      supportTasksTotal: 2, supportTasksDone: 0,
      habitDone: false,
      averageEffort: 1,
      isMissedDay: false,
    };
    const { rawScore } = calculateRawScore(zeroExec, 0);
    expect(rawScore).toBe(0);
  });

  it('isMissedDay zeroes effort contribution', () => {
    const exec = { ...perfectExec, isMissedDay: true };
    // Without effort: core(50) + support(20) + habit(15) + effort(0) + refl(0) = 85
    const { rawScore, components } = calculateRawScore(exec, 0);
    expect(components.effortNormalized).toBe(0);
    expect(rawScore).toBe(85);
  });

  it('50% core, 100% support, habit done, effort 5, no reflection ≈ 56.11', () => {
    const exec = { ...perfectExec, coreTasksDone: 1, averageEffort: 5 };
    const { rawScore, components } = calculateRawScore(exec, 0);
    expect(rawScore).toBeCloseTo(56.11, 1);
    expect(components.coreCompletion).toBeCloseTo(33.33, 1);
  });

  it('score cannot exceed 100', () => {
    const { rawScore } = calculateRawScore(perfectExec, 100);
    expect(rawScore).toBeLessThanOrEqual(100);
  });

  it('score cannot be negative', () => {
    const badExec = {
      coreTasksTotal: 3, coreTasksDone: 0,
      supportTasksTotal: 2, supportTasksDone: 0,
      habitDone: false, averageEffort: 1, isMissedDay: false,
    };
    const { rawScore } = calculateRawScore(badExec, 0);
    expect(rawScore).toBeGreaterThanOrEqual(0);
  });

  it('returns all components in result', () => {
    const { components } = calculateRawScore(perfectExec, 50);
    expect(components).toHaveProperty('coreCompletion');
    expect(components).toHaveProperty('supportCompletion');
    expect(components).toHaveProperty('habitCompletion');
    expect(components).toHaveProperty('effortNormalized');
    expect(components).toHaveProperty('reflectionQuality');
  });
});

// ─── Task 41: streak.service ──────────────────────────────────────────────────
describe('streak.service', () => {
  const {
    calculateStreak,
    applyMultiplier,
    calculateMissedDayScore,
  } = require('../../../services/alignment/streak.service');

  it('no previous metrics → streakCount = 0, multiplier = 1.0', () => {
    const { streakCount, multiplier } = calculateStreak(70, []);
    expect(streakCount).toBe(0);
    expect(multiplier).toBe(1.0);
  });

  it('prev score ≥ 50 → increments streak', () => {
    const prev = [{ alignmentScore: 65, streakCount: 2 }];
    const { streakCount } = calculateStreak(70, prev);
    expect(streakCount).toBe(3);
  });

  it('prev score < 50 → streak resets to 0', () => {
    const prev = [{ alignmentScore: 40, streakCount: 5 }];
    const { streakCount } = calculateStreak(80, prev);
    expect(streakCount).toBe(0);
  });

  it('streak > 7 → multiplier 1.10', () => {
    const prev = [{ alignmentScore: 70, streakCount: 8 }];
    const { multiplier } = calculateStreak(75, prev);
    expect(multiplier).toBe(1.10);
  });

  it('streak > 3 → multiplier 1.05', () => {
    const prev = [{ alignmentScore: 70, streakCount: 4 }];
    const { multiplier } = calculateStreak(75, prev);
    expect(multiplier).toBe(1.05);
  });

  it('applyMultiplier caps at 100', () => {
    expect(applyMultiplier(95, 1.10)).toBe(100);
  });

  it('applyMultiplier applies correctly below cap', () => {
    expect(applyMultiplier(50, 1.05)).toBeCloseTo(52.5, 1);
  });

  it('calculateMissedDayScore returns 0 for no history', () => {
    expect(calculateMissedDayScore([])).toBe(0);
  });

  it('calculateMissedDayScore penalizes last score by 10%', () => {
    const prev = [{ alignmentScore: 80 }];
    expect(calculateMissedDayScore(prev)).toBe(72); // 80 - 8 = 72
  });
});

// ─── Task 42: drift.service ───────────────────────────────────────────────────
describe('drift.service', () => {
  const {
    calculateDrift,
    determineStateLevel,
  } = require('../../../services/alignment/drift.service');

  it('no previous metrics → sevenDayAverage = todayScore, drift = 0', () => {
    const { driftIndex, sevenDayAverage } = calculateDrift(60, []);
    expect(sevenDayAverage).toBe(60);
    expect(driftIndex).toBe(0);
  });

  it('trending up → positive drift', () => {
    const prev = [
      { alignmentScore: 50 }, { alignmentScore: 50 }, { alignmentScore: 50 },
      { alignmentScore: 50 }, { alignmentScore: 50 }, { alignmentScore: 50 },
    ];
    const { driftIndex } = calculateDrift(80, prev);
    expect(driftIndex).toBeGreaterThan(0);
  });

  it('drift is clamped between -1 and 1', () => {
    const prev = [{ alignmentScore: 100 }, { alignmentScore: 100 }, { alignmentScore: 100 },
                  { alignmentScore: 100 }, { alignmentScore: 100 }, { alignmentScore: 100 }];
    const { driftIndex } = calculateDrift(0, prev);
    expect(driftIndex).toBeGreaterThanOrEqual(-1);
    expect(driftIndex).toBeLessThanOrEqual(1);
  });

  it('sevenDayAvg > 75 and drift >= 0 and 2 prev days at level 3 → state 3', () => {
    const prev = [{ stateLevel: 3 }, { stateLevel: 3 }];
    const level = determineStateLevel(80, 0.1, prev);
    expect(level).toBe(3);
  });

  it('sevenDayAvg < 45 → state 1 (Diminished)', () => {
    const level = determineStateLevel(30, 0.0, []);
    expect(level).toBe(1);
  });

  it('default stable state 2', () => {
    const level = determineStateLevel(60, 0.0, []);
    expect(level).toBe(2);
  });

  it('sustained negative drift for 3 days → state 1', () => {
    const prev = [
      { stateLevel: 2, driftIndex: -0.5 },
      { stateLevel: 2, driftIndex: -0.5 },
    ];
    const level = determineStateLevel(60, -0.5, prev);
    expect(level).toBe(1);
  });
});

// ─── Task 43: pattern.service ─────────────────────────────────────────────────
describe('pattern.service — detectPatterns', () => {
  const { detectPatterns } = require('../../../services/alignment/pattern.service');

  it('no data → no patterns', () => {
    const flags = detectPatterns([], []);
    expect(flags).toEqual([]);
  });

  it('EFFORT_INFLATION: effort ≥ 8 but completion < 50% for 3 days', () => {
    const logs = Array(7).fill(null).map((_, i) => ({
      averageEffort: i < 3 ? 9 : 4,
      coreCompletionPct: i < 3 ? 30 : 90,
    }));
    const flags = detectPatterns([], logs);
    expect(flags).toContain('EFFORT_INFLATION');
  });

  it('OVERCOMMITMENT: < 40% core completion for 5 of 7 days', () => {
    const logs = Array(7).fill(null).map((_, i) => ({
      averageEffort: 5,
      coreCompletionPct: i < 5 ? 30 : 80,
    }));
    const flags = detectPatterns([], logs);
    expect(flags).toContain('OVERCOMMITMENT');
  });

  it('STREAK_BREAK: streak went from > 7 to 0', () => {
    const metrics = [
      { streakCount: 0, alignmentScore: 40, driftIndex: 0 },
      { streakCount: 8, alignmentScore: 75, driftIndex: 0.1 },
      { streakCount: 7, alignmentScore: 78, driftIndex: 0.1 },
    ];
    const flags = detectPatterns(metrics, []);
    expect(flags).toContain('STREAK_BREAK');
  });
});
