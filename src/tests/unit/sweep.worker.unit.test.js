'use strict';

// ─── Task 50: Midnight Sweep Worker Tests ────────────────────────────────────

jest.mock('../../models/User');
jest.mock('../../models/DailyExecutionLog');
jest.mock('../../jobs/queues');

const User              = require('../../models/User');
const DailyExecutionLog = require('../../models/DailyExecutionLog');
const { enqueueAlignment } = require('../../jobs/queues');
const redis             = require('../../config/redis');

const { processor } = require('../../jobs/workers/sweep.worker');

const userId = '507f1f77bcf86cd799439011';

const makeJob = () => ({ id: 'sweep-job-1', data: {} });

beforeEach(async () => {
  jest.clearAllMocks();
  enqueueAlignment.mockResolvedValue({ id: 'align-job' });

  // Clear any sweep keys from previous tests
  const keys = await redis.keys('sweep:*');
  await Promise.all(keys.map((k) => redis.del(k)));
});

describe('sweep.worker — processor', () => {
  it('skips users who already have a log for yesterday', async () => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    User.find.mockReturnValue({
      lean: () => Promise.resolve([{ _id: userId, timezone: 'UTC' }]),
    });
    // Log exists for yesterday → should NOT penalize
    DailyExecutionLog.findOne.mockResolvedValue({ userId, date: yesterday });
    DailyExecutionLog.findOneAndUpdate.mockResolvedValue({});

    await processor(makeJob());
    expect(DailyExecutionLog.findOneAndUpdate).not.toHaveBeenCalled();
    expect(enqueueAlignment).not.toHaveBeenCalled();
  });

  it('creates missed-day log for users with no log yesterday', async () => {
    User.find.mockReturnValue({
      lean: () => Promise.resolve([{ _id: userId, timezone: 'UTC' }]),
    });
    DailyExecutionLog.findOne.mockResolvedValue(null);  // No log
    DailyExecutionLog.findOneAndUpdate.mockResolvedValue({ _id: 'log-123' });

    await processor(makeJob());

    expect(DailyExecutionLog.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ userId }),
      expect.objectContaining({
        $set: expect.objectContaining({ isMissedDay: true }),
      }),
      { upsert: true, new: true },
    );
  });

  it('enqueues alignment after creating missed-day log', async () => {
    User.find.mockReturnValue({
      lean: () => Promise.resolve([{ _id: userId, timezone: 'UTC' }]),
    });
    DailyExecutionLog.findOne.mockResolvedValue(null);
    DailyExecutionLog.findOneAndUpdate.mockResolvedValue({ _id: 'log-123' });

    await processor(makeJob());
    expect(enqueueAlignment).toHaveBeenCalledWith(
      expect.objectContaining({ userId }),
    );
  });

  it('uses Redis sweep key to prevent double-penalizing', async () => {
    User.find.mockReturnValue({
      lean: () => Promise.resolve([{ _id: userId, timezone: 'UTC' }]),
    });
    DailyExecutionLog.findOne.mockResolvedValue(null);
    DailyExecutionLog.findOneAndUpdate.mockResolvedValue({ _id: 'log-123' });

    await processor(makeJob());
    await processor(makeJob());

    // Second sweep should not re-create or re-enqueue
    expect(DailyExecutionLog.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(enqueueAlignment).toHaveBeenCalledTimes(1);
  });

  it('handles empty user list gracefully', async () => {
    User.find.mockReturnValue({ lean: () => Promise.resolve([]) });
    await expect(processor(makeJob())).resolves.not.toThrow();
    expect(enqueueAlignment).not.toHaveBeenCalled();
  });
});
