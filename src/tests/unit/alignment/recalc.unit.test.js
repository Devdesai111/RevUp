'use strict';

// ─── Task 44 Unit Tests: lock.util + recalc.service ──────────────────────────
// NOTE: alignment.worker is tested in alignment.worker.unit.test.js separately.
// Splitting avoids jest.mock hoisting conflicts.

// ── Mock models BEFORE requiring the service ──────────────────────────────────
jest.mock('../../../models/DailyExecutionLog');
jest.mock('../../../models/AlignmentMetric');
jest.mock('../../../models/JournalEntry');

// ── Mock alignment math services ──────────────────────────────────────────────
jest.mock('../../../services/alignment/score.service');
jest.mock('../../../services/alignment/streak.service');
jest.mock('../../../services/alignment/drift.service');
jest.mock('../../../services/alignment/pattern.service');

const redis      = require('../../../config/redis');
const REDIS_KEYS = require('../../../config/redis-keys');

const DailyExecutionLog = require('../../../models/DailyExecutionLog');
const AlignmentMetric   = require('../../../models/AlignmentMetric');
const JournalEntry      = require('../../../models/JournalEntry');

const { calculateRawScore }                   = require('../../../services/alignment/score.service');
const { calculateStreak, applyMultiplier }    = require('../../../services/alignment/streak.service');
const { calculateDrift, determineStateLevel } = require('../../../services/alignment/drift.service');
const { detectPatterns }                      = require('../../../services/alignment/pattern.service');

const { acquireLock, releaseLock }  = require('../../../utils/lock.util');
const { recalcDailyAlignment }      = require('../../../services/alignment/recalc.service');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const userId = '507f1f77bcf86cd799439011';
const date   = new Date('2024-01-15T00:00:00.000Z');

const makeLog = (overrides = {}) => ({
  userId,
  date,
  tasks: [
    { isCore: true,  completed: true,  effortScore: 8, taskName: 'Core 1' },
    { isCore: true,  completed: false, effortScore: 0, taskName: 'Core 2' },
    { isCore: false, completed: true,  effortScore: 7, taskName: 'Support 1' },
  ],
  identityHabitDone: true,
  averageEffort: 7.5,
  isMissedDay: false,
  coreCompletionPct:    50,
  supportCompletionPct: 100,
  ...overrides,
});

const makeMetric = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439022',
  userId,
  date,
  alignmentScore: 75,
  streakCount:    3,
  stateLevel:     2,
  driftIndex:     0.1,
  ...overrides,
});

// Chainable query builder stub (for find().sort().limit().lean())
const makeChain = (resolvedValue = []) => ({
  sort:  function () { return this; },
  limit: function () { return this; },
  lean:  () => Promise.resolve(resolvedValue),
});

// ─── Reset mocks + locks between tests ───────────────────────────────────────
beforeEach(async () => {
  jest.clearAllMocks();
  // Release any leftover lock from a previous test
  await redis.del(REDIS_KEYS.alignmentLock(userId));
});

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 1: lock.util
// ═════════════════════════════════════════════════════════════════════════════
describe('lock.util', () => {
  const lockKey = 'test:lock:util:unit';

  beforeEach(async () => {
    await redis.del(lockKey);
  });

  it('acquireLock — returns true when lock is free', async () => {
    const result = await acquireLock(lockKey, 30);
    expect(result).toBe(true);
  });

  it('acquireLock — returns false when lock is already held', async () => {
    await acquireLock(lockKey, 30);
    const second = await acquireLock(lockKey, 30);
    expect(second).toBe(false);
  });

  it('releaseLock — frees lock so next acquireLock succeeds', async () => {
    await acquireLock(lockKey, 30);
    await releaseLock(lockKey);
    const result = await acquireLock(lockKey, 30);
    expect(result).toBe(true);
  });

  it('acquireLock — calls redis.set with correct NX args', async () => {
    const spy = jest.spyOn(redis, 'set');
    await acquireLock(lockKey, 45);
    expect(spy).toHaveBeenCalledWith(lockKey, '1', 'EX', 45, 'NX');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 2: recalc.service
// ═════════════════════════════════════════════════════════════════════════════
describe('recalc.service — recalcDailyAlignment', () => {
  beforeEach(() => {
    // Default: log exists, no previous metrics, no journal
    DailyExecutionLog.findOne.mockResolvedValue(makeLog());
    DailyExecutionLog.find.mockReturnValue(makeChain([]));

    AlignmentMetric.find.mockReturnValue(makeChain([]));
    AlignmentMetric.findOneAndUpdate.mockResolvedValue(makeMetric({ alignmentScore: 73.5 }));

    JournalEntry.findOne.mockResolvedValue(null);

    // Default scoring service returns
    calculateRawScore.mockReturnValue({ rawScore: 70, components: {} });
    calculateStreak.mockReturnValue({ streakCount: 4, multiplier: 1.05 });
    applyMultiplier.mockReturnValue(73.5);
    calculateDrift.mockReturnValue({ driftIndex: 0.05, sevenDayAverage: 68 });
    determineStateLevel.mockReturnValue(2);
    detectPatterns.mockReturnValue([]);
  });

  it('returns null and skips scoring when log is not found', async () => {
    DailyExecutionLog.findOne.mockResolvedValue(null);
    const result = await recalcDailyAlignment(userId, date);
    expect(result).toBeNull();
    expect(calculateRawScore).not.toHaveBeenCalled();
  });

  it('returns null when lock is already held (concurrent recalc)', async () => {
    await acquireLock(REDIS_KEYS.alignmentLock(userId), 30);
    const result = await recalcDailyAlignment(userId, date);
    expect(result).toBeNull();
    expect(DailyExecutionLog.findOne).not.toHaveBeenCalled();
  });

  it('calls all scoring services in correct order', async () => {
    const callOrder = [];
    calculateRawScore.mockImplementation(() => { callOrder.push('rawScore'); return { rawScore: 70, components: {} }; });
    calculateStreak.mockImplementation(() => { callOrder.push('streak'); return { streakCount: 1, multiplier: 1.0 }; });
    applyMultiplier.mockImplementation(() => { callOrder.push('apply'); return 70; });
    calculateDrift.mockImplementation(() => { callOrder.push('drift'); return { driftIndex: 0, sevenDayAverage: 70 }; });
    determineStateLevel.mockImplementation(() => { callOrder.push('state'); return 2; });
    detectPatterns.mockImplementation(() => { callOrder.push('patterns'); return []; });

    await recalcDailyAlignment(userId, date);
    expect(callOrder).toEqual(['rawScore', 'streak', 'apply', 'drift', 'state', 'patterns']);
  });

  it('uses reflectionQualityScore from JournalEntry when present', async () => {
    JournalEntry.findOne.mockResolvedValue({ reflectionQualityScore: 80 });
    await recalcDailyAlignment(userId, date);
    expect(calculateRawScore).toHaveBeenCalledWith(expect.any(Object), 80);
  });

  it('uses reflectionQuality = 0 when JournalEntry is missing', async () => {
    JournalEntry.findOne.mockResolvedValue(null);
    await recalcDailyAlignment(userId, date);
    expect(calculateRawScore).toHaveBeenCalledWith(expect.any(Object), 0);
  });

  it('upserts AlignmentMetric with all computed fields', async () => {
    calculateRawScore.mockReturnValue({ rawScore: 72, components: { coreCompletion: 50 } });
    calculateStreak.mockReturnValue({ streakCount: 5, multiplier: 1.05 });
    applyMultiplier.mockReturnValue(75.6);
    calculateDrift.mockReturnValue({ driftIndex: 0.1, sevenDayAverage: 71 });
    determineStateLevel.mockReturnValue(3);
    detectPatterns.mockReturnValue(['EFFORT_INFLATION']);

    await recalcDailyAlignment(userId, date);

    expect(AlignmentMetric.findOneAndUpdate).toHaveBeenCalledWith(
      { userId, date },
      {
        $set: expect.objectContaining({
          alignmentScore:   75.6,
          rawScore:         72,
          streakMultiplier: 1.05,
          driftIndex:       0.1,
          sevenDayAverage:  71,
          streakCount:      5,
          stateLevel:       3,
          patternFlags:     ['EFFORT_INFLATION'],
          components:       expect.any(Object),
        }),
      },
      { upsert: true, new: true },
    );
  });

  it('invalidates avatar and dashboard caches after upsert', async () => {
    const delSpy = jest.spyOn(redis, 'del');
    await recalcDailyAlignment(userId, date);
    expect(delSpy).toHaveBeenCalledWith(REDIS_KEYS.avatarStateCache(userId));
    expect(delSpy).toHaveBeenCalledWith(REDIS_KEYS.dashboardCache(userId));
  });

  it('releases lock after successful recalc', async () => {
    await recalcDailyAlignment(userId, date);
    const result = await acquireLock(REDIS_KEYS.alignmentLock(userId), 30);
    expect(result).toBe(true);
  });

  it('releases lock even when an error is thrown', async () => {
    DailyExecutionLog.findOne.mockRejectedValue(new Error('DB connection failed'));

    await expect(recalcDailyAlignment(userId, date)).rejects.toThrow('DB connection failed');

    // Lock must be freed despite the error
    const result = await acquireLock(REDIS_KEYS.alignmentLock(userId), 30);
    expect(result).toBe(true);
  });

  it('builds correct execSummary from log tasks', async () => {
    DailyExecutionLog.findOne.mockResolvedValue(makeLog({
      tasks: [
        { isCore: true,  completed: true,  effortScore: 9, taskName: 'A' },
        { isCore: true,  completed: false, effortScore: 0, taskName: 'B' },
        { isCore: false, completed: true,  effortScore: 6, taskName: 'C' },
        { isCore: false, completed: false, effortScore: 0, taskName: 'D' },
      ],
    }));

    await recalcDailyAlignment(userId, date);

    expect(calculateRawScore).toHaveBeenCalledWith(
      expect.objectContaining({
        coreTasksTotal:    2,
        coreTasksDone:     1,
        supportTasksTotal: 2,
        supportTasksDone:  1,
      }),
      expect.any(Number),
    );
  });
});
