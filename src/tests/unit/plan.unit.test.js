'use strict';

// ─── Task 28: constraint.util ─────────────────────────────────────────────────
describe('constraint.util', () => {
  const { checkOvercommit } = require('../../utils/constraint.util');

  it('should return isOvercommitted=false when under limit', () => {
    const tasks = [
      { estimatedMins: 60 },
      { estimatedMins: 90 },
      { estimatedMins: 30 },
    ];
    const result = checkOvercommit(tasks, 4);
    expect(result.isOvercommitted).toBe(false);
    expect(result.totalHours).toBeCloseTo(3);
  });

  it('should return isOvercommitted=true when over limit', () => {
    const tasks = [
      { estimatedMins: 300 },
      { estimatedMins: 300 },
      { estimatedMins: 180 },
    ];
    const result = checkOvercommit(tasks, 8);
    expect(result.isOvercommitted).toBe(true);
    expect(result.excessHours).toBeGreaterThan(0);
  });

  it('should expose totalHours, availableHours, excessHours', () => {
    const tasks = [{ estimatedMins: 600 }, { estimatedMins: 600 }];
    const result = checkOvercommit(tasks, 8);
    expect(result).toHaveProperty('totalHours');
    expect(result).toHaveProperty('availableHours', 8);
    expect(result).toHaveProperty('excessHours');
  });
});

// ─── Task 30: month.service ───────────────────────────────────────────────────
describe('month.service', () => {
  const { extractMonthObjectives } = require('../../services/planning/month.service');

  const quarterPlan = {
    quarterStartDate: new Date(),
    macroObjectives: [
      {
        title: 'Obj 1',
        pillar: 'career',
        successMetric: 'Ship product',
        monthlyBreakdown: ['Focus M1', 'Focus M2', 'Focus M3'],
      },
      {
        title: 'Obj 2',
        pillar: 'health',
        successMetric: '5km run',
        monthlyBreakdown: ['Run M1', 'Run M2', 'Run M3'],
      },
    ],
  };

  it('should return month-index 0 objectives for day 1 of quarter', () => {
    const objectives = extractMonthObjectives(quarterPlan, 0);
    expect(objectives).toHaveLength(2);
    expect(objectives[0]).toBe('Focus M1');
    expect(objectives[1]).toBe('Run M1');
  });

  it('should cap objectives at 3', () => {
    const bigPlan = {
      quarterStartDate: new Date(),
      macroObjectives: Array.from({ length: 5 }, (_, i) => ({
        title: `Obj ${i}`,
        pillar: 'career',
        successMetric: 'metric',
        monthlyBreakdown: [`M1-${i}`, `M2-${i}`, `M3-${i}`],
      })),
    };
    const objectives = extractMonthObjectives(bigPlan, 0);
    expect(objectives.length).toBeLessThanOrEqual(3);
  });
});

// ─── Task 31: sprint.service ──────────────────────────────────────────────────
describe('sprint.service', () => {
  const { buildSprintTasks } = require('../../services/planning/sprint.service');

  it('should generate exactly 3 core + 2 supporting + 1 habit', () => {
    const tasks = buildSprintTasks({
      coreActions:       ['Task A', 'Task B', 'Task C'],
      supportingActions: ['Support A', 'Support B'],
      habitDescription:  'Morning journaling',
    });
    const core      = tasks.filter((t) => t.type === 'core');
    const support   = tasks.filter((t) => t.type === 'supporting');
    const habit     = tasks.filter((t) => t.type === 'habit');
    expect(core).toHaveLength(3);
    expect(support).toHaveLength(2);
    expect(habit).toHaveLength(1);
  });

  it('each task should have taskName, type, weight, isCore fields', () => {
    const tasks = buildSprintTasks({
      coreActions:       ['Task A', 'Task B', 'Task C'],
      supportingActions: ['Support A', 'Support B'],
      habitDescription:  'Evening review',
    });
    tasks.forEach((t) => {
      expect(t).toHaveProperty('taskName');
      expect(t).toHaveProperty('type');
      expect(t).toHaveProperty('weight');
      expect(t).toHaveProperty('isCore');
    });
  });
});

// ─── Task 32: adaptive.service ────────────────────────────────────────────────
describe('adaptive.service', () => {
  const { getAdaptiveLevel } = require('../../services/planning/adaptive.service');

  it('streak 0 → level 1', () => {
    expect(getAdaptiveLevel(0)).toBe(1);
  });

  it('streak 5 → level 1', () => {
    expect(getAdaptiveLevel(5)).toBe(1);
  });

  it('streak 15 → level 2', () => {
    expect(getAdaptiveLevel(15)).toBe(2);
  });

  it('streak 29 → level 3', () => {
    expect(getAdaptiveLevel(29)).toBe(3);
  });
});

// ─── Task 34: date.util ───────────────────────────────────────────────────────
describe('date.util', () => {
  const { getISOWeekKey, getWeekBounds, toLocalMidnightUTC } = require('../../utils/date.util');

  it('getISOWeekKey should return YYYY-WW format', () => {
    const key = getISOWeekKey(new Date('2024-01-08'));
    expect(key).toMatch(/^\d{4}-\d{2}$/);
  });

  it('toLocalMidnightUTC should return a Date object', () => {
    const result = toLocalMidnightUTC('2024-03-15', 'Asia/Kolkata');
    expect(result).toBeInstanceOf(Date);
  });

  it('getWeekBounds should return startUTC and endUTC', () => {
    const bounds = getWeekBounds('UTC');
    expect(bounds).toHaveProperty('startUTC');
    expect(bounds).toHaveProperty('endUTC');
    expect(bounds.endUTC > bounds.startUTC).toBe(true);
  });
});
