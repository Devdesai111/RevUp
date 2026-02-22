'use strict';

// ─── Task 35: exec.validator ──────────────────────────────────────────────────
describe('exec.validator', () => {
  const { logSchema, timerSchema, intentSchema } = require('../../validators/exec.validator');

  it('should reject deepWorkMinutes > 720', () => {
    const result = logSchema.safeParse({ body: { date: '2024-03-15', deepWorkMinutes: 721 } });
    expect(result.success).toBe(false);
  });

  it('should reject completed task with effortScore 0', () => {
    const result = logSchema.safeParse({
      body: {
        date: '2024-03-15',
        tasks: [{ taskId: 'abc123', taskName: 'T', weight: 3, isCore: true, completed: true, effortScore: 0 }],
      },
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid log', () => {
    const result = logSchema.safeParse({
      body: {
        date: '2024-03-15',
        tasks: [{ taskId: 'abc', taskName: 'T', weight: 3, isCore: true, completed: true, effortScore: 7 }],
        habitDone: true,
        deepWorkMinutes: 60,
      },
    });
    expect(result.success).toBe(true);
  });

  it('timerSchema should reject > 240 minutes', () => {
    const result = timerSchema.safeParse({ body: { minutes: 241 } });
    expect(result.success).toBe(false);
  });

  it('timerSchema should accept valid minutes', () => {
    const result = timerSchema.safeParse({ body: { minutes: 45 } });
    expect(result.success).toBe(true);
  });

  it('intentSchema should accept valid date', () => {
    const result = intentSchema.safeParse({ body: { date: '2024-03-15' } });
    expect(result.success).toBe(true);
  });
});

// ─── Task 36: exec.service ────────────────────────────────────────────────────
describe('exec.service', () => {
  jest.mock('../../models/DailyExecutionLog');
  const DailyExecutionLog = require('../../models/DailyExecutionLog');
  const { upsertLog, computeCompletions } = require('../../services/execution/exec.service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('computeCompletions should calculate coreCompletionPct correctly', () => {
    const tasks = [
      { isCore: true, completed: true,  effortScore: 8 },
      { isCore: true, completed: false, effortScore: 0 },
      { isCore: false, completed: true, effortScore: 6 },
    ];
    const result = computeCompletions(tasks);
    expect(result.coreCompletionPct).toBe(50);
    expect(result.supportCompletionPct).toBe(100);
    expect(result.averageEffort).toBeGreaterThan(0);
  });

  it('computeCompletions with no tasks returns 0s', () => {
    const result = computeCompletions([]);
    expect(result.coreCompletionPct).toBe(0);
    expect(result.supportCompletionPct).toBe(0);
    expect(result.averageEffort).toBe(0);
  });

  it('upsertLog should call findOneAndUpdate with upsert:true', async () => {
    const mockDoc = { userId: 'u1', date: new Date(), completedTasks: [] };
    DailyExecutionLog.findOneAndUpdate = jest.fn().mockResolvedValue(mockDoc);
    const result = await upsertLog('u1', new Date(), { tasks: [], habitDone: false });
    expect(DailyExecutionLog.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1' }),
      expect.any(Object),
      expect.objectContaining({ upsert: true }),
    );
    expect(result).toEqual(mockDoc);
  });
});

// ─── Task 37: timer.service ───────────────────────────────────────────────────
describe('timer.service', () => {
  jest.mock('../../models/DailyExecutionLog');
  const DailyExecutionLog = require('../../models/DailyExecutionLog');
  const { incrementTimer } = require('../../services/execution/timer.service');

  it('should call $inc with minutes', async () => {
    DailyExecutionLog.findOneAndUpdate = jest.fn().mockResolvedValue({
      deepWorkMinutes: 75,
    });
    const result = await incrementTimer('u1', new Date(), 45);
    expect(DailyExecutionLog.findOneAndUpdate).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ $inc: { deepWorkMinutes: 45 } }),
      expect.any(Object),
    );
    expect(result.deepWorkMinutes).toBe(75);
  });

  it('should throw if log does not exist', async () => {
    DailyExecutionLog.findOneAndUpdate = jest.fn().mockResolvedValue(null);
    await expect(incrementTimer('u1', new Date(), 30)).rejects.toThrow();
  });
});
