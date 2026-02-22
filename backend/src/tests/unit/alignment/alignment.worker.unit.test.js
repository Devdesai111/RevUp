'use strict';

// ─── Task 44: alignment.worker processor unit tests ───────────────────────────
// recalc.service is mocked here to isolate the worker processor logic.
// This file is intentionally separate from recalc.unit.test.js to avoid
// jest.mock hoisting contaminating the recalc service tests.

jest.mock('../../../services/alignment/recalc.service');

const { recalcDailyAlignment } = require('../../../services/alignment/recalc.service');
const { processor }            = require('../../../jobs/workers/alignment.worker');

const userId = '507f1f77bcf86cd799439011';
const date   = '2024-01-15T00:00:00.000Z';

beforeEach(() => jest.clearAllMocks());

describe('alignment.worker — processor', () => {
  it('calls recalcDailyAlignment with userId and date from job data', async () => {
    const metric = { _id: 'metric-abc' };
    recalcDailyAlignment.mockResolvedValue(metric);

    const job    = { id: 'job-1', data: { userId, date } };
    const result = await processor(job);

    expect(recalcDailyAlignment).toHaveBeenCalledWith(userId, date);
    expect(result).toEqual({ metricId: 'metric-abc' });
  });

  it('returns metricId undefined if recalc returns null (lock skipped)', async () => {
    recalcDailyAlignment.mockResolvedValue(null);

    const job    = { id: 'job-2', data: { userId, date } };
    const result = await processor(job);

    expect(result).toEqual({ metricId: undefined });
  });

  it('propagates errors so BullMQ can retry the job', async () => {
    recalcDailyAlignment.mockRejectedValue(new Error('scoring failed'));

    const job = { id: 'job-3', data: { userId, date } };
    await expect(processor(job)).rejects.toThrow('scoring failed');
  });
});
