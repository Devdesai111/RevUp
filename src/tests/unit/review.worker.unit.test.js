'use strict';

// ─── Task 49: Review Worker Processor Tests ───────────────────────────────────

jest.mock('../../services/ai/ai.orchestrator');
jest.mock('../../services/ai/memory.short');
jest.mock('../../models/AlignmentMetric');
jest.mock('../../models/JournalEntry');
jest.mock('../../models/WeeklyReview');
jest.mock('../../models/User');

const { callLLM }           = require('../../services/ai/ai.orchestrator');
const { buildMemoryContext } = require('../../services/ai/memory.short');
const AlignmentMetric        = require('../../models/AlignmentMetric');
const JournalEntry           = require('../../models/JournalEntry');
const WeeklyReview           = require('../../models/WeeklyReview');
const User                   = require('../../models/User');

const { processor } = require('../../jobs/workers/review.worker');

const userId = '507f1f77bcf86cd799439011';

const makeMetrics = () => [
  { date: new Date('2024-01-15'), alignmentScore: 80, streakCount: 5 },
  { date: new Date('2024-01-14'), alignmentScore: 70, streakCount: 4 },
  { date: new Date('2024-01-13'), alignmentScore: 60, streakCount: 3 },
  { date: new Date('2024-01-12'), alignmentScore: 90, streakCount: 2 },
  { date: new Date('2024-01-11'), alignmentScore: 50, streakCount: 1 },
  { date: new Date('2024-01-10'), alignmentScore: 75, streakCount: 0 },
  { date: new Date('2024-01-09'), alignmentScore: 65, streakCount: 6 },
];

const makeUsers = () => [
  { _id: userId, timezone: 'UTC' },
];

const makeJob = () => ({
  id:   'job-review-1',
  data: { userId, weekStart: '2024-01-09' },
});

beforeEach(() => {
  jest.clearAllMocks();

  User.find.mockReturnValue({ lean: () => Promise.resolve(makeUsers()) });
  AlignmentMetric.find.mockReturnValue({ sort: () => ({ limit: () => ({ lean: () => Promise.resolve(makeMetrics()) }) }) });
  JournalEntry.find.mockReturnValue({ sort: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }) });

  buildMemoryContext.mockResolvedValue({
    identityDeclaration: 'I am becoming a disciplined founder.',
    riskSummary:         'Low drift risk.',
    last7Days:           makeMetrics(),
  });

  callLLM.mockResolvedValue({
    progressCard:       'Strong week with consistent execution.',
    behavioralInsight:  'Effort spikes midweek.',
    driftTrend:         'improving',
    recommendation:     'Focus on habit consistency.',
  });

  WeeklyReview.findOneAndUpdate.mockResolvedValue({ _id: 'review-123' });
});

describe('review.worker — processor', () => {
  it('fetches 7-day metrics for the user', async () => {
    await processor(makeJob());
    expect(AlignmentMetric.find).toHaveBeenCalledWith(
      expect.objectContaining({ userId }),
    );
  });

  it('calls callLLM with non-empty stats in the prompt', async () => {
    await processor(makeJob());
    const callArgs = callLLM.mock.calls[0][0];
    expect(callArgs.userPrompt).toContain('Week Avg Score');
    expect(callArgs.userPrompt).toContain('Best Day');
    expect(callArgs.systemPrompt).toContain('progressCard');
  });

  it('saves WeeklyReview document with AI output', async () => {
    await processor(makeJob());
    expect(WeeklyReview.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ userId }),
      {
        $set: expect.objectContaining({
          progressCard:       'Strong week with consistent execution.',
          behavioralInsight:  'Effort spikes midweek.',
          driftTrend:         'improving',
          generatedAt:        expect.any(Date),
        }),
      },
      { upsert: true, new: true },
    );
  });

  it('correctly computes averageScore from metrics', async () => {
    await processor(makeJob());
    const callArgs  = callLLM.mock.calls[0][0];
    const metrics   = makeMetrics();
    const expectedAvg = Math.round(
      metrics.reduce((s, m) => s + m.alignmentScore, 0) / metrics.length,
    );
    expect(callArgs.userPrompt).toContain(String(expectedAvg));
  });
});
