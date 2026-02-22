'use strict';

// ─── Task 48: Reflection Worker Processor Tests ───────────────────────────────

jest.mock('../../../services/ai/ai.orchestrator');
jest.mock('../../../services/ai/memory.short');
jest.mock('../../../services/reflection/quality.service');
jest.mock('../../../models/JournalEntry');
jest.mock('../../../models/DailyExecutionLog');
jest.mock('../../../jobs/queues');

const { callLLM }               = require('../../../services/ai/ai.orchestrator');
const { buildMemoryContext }     = require('../../../services/ai/memory.short');
const { validateAIQualityScore } = require('../../../services/reflection/quality.service');
const JournalEntry               = require('../../../models/JournalEntry');
const DailyExecutionLog          = require('../../../models/DailyExecutionLog');
const { enqueueAlignment }       = require('../../../jobs/queues');

const { processor } = require('../../../jobs/workers/reflection.worker');

const userId   = '507f1f77bcf86cd799439011';
const entryId  = '507f1f77bcf86cd799439022';
const date     = '2024-01-15T00:00:00.000Z';

const makeEntry = (overrides = {}) => ({
  _id:            entryId,
  userId,
  date:           new Date(date),
  reflectionText: 'Great day of work and reflection on my progress.',
  baselineScore:  75,
  ...overrides,
});

const makeLog = () => ({
  coreCompletionPct:    80,
  supportCompletionPct: 60,
  identityHabitDone:    true,
  deepWorkMinutes:      90,
  averageEffort:        8,
});

const makeAIResponse = () => ({
  aiFeedback:     'You showed strong commitment today.',
  tone:           'encouraging',
  qualityScore:   85,
  alignmentDelta: 3,
  flags: {
    hasAccountability: true,
    hasExcuses:        false,
    hasGrowthMindset:  true,
    specificity:       8,
  },
});

const makeJob = (overrides = {}) => ({
  id:   'job-reflect-1',
  data: { journalEntryId: entryId, userId, date, ...overrides },
});

beforeEach(() => {
  jest.clearAllMocks();

  JournalEntry.findById.mockResolvedValue(makeEntry());
  JournalEntry.findByIdAndUpdate.mockResolvedValue({ ...makeEntry(), processingStatus: 'completed' });
  DailyExecutionLog.findOne.mockResolvedValue(makeLog());
  buildMemoryContext.mockResolvedValue({
    identityDeclaration: 'I am becoming a disciplined founder.',
    riskSummary:         'Tends to procrastinate.',
    last7Days:           [{ alignmentScore: 70 }, { alignmentScore: 65 }],
  });
  callLLM.mockResolvedValue(makeAIResponse());
  validateAIQualityScore.mockReturnValue(85);
  enqueueAlignment.mockResolvedValue({ id: 'align-job' });
});

describe('reflection.worker — processor', () => {
  it('fetches journal entry and execution log', async () => {
    await processor(makeJob());
    expect(JournalEntry.findById).toHaveBeenCalledWith(entryId);
    expect(DailyExecutionLog.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ userId }),
    );
  });

  it('calls buildMemoryContext for AI context', async () => {
    await processor(makeJob());
    expect(buildMemoryContext).toHaveBeenCalledWith(userId);
  });

  it('calls callLLM with reflection model and prompt', async () => {
    await processor(makeJob());
    expect(callLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        model:        expect.stringContaining('gpt'),
        systemPrompt: expect.any(String),
        userPrompt:   expect.any(String),
      }),
    );
  });

  it('validates AI quality score against baseline', async () => {
    await processor(makeJob());
    expect(validateAIQualityScore).toHaveBeenCalledWith(85, 75);
  });

  it('updates journal entry with AI results and processingStatus: completed', async () => {
    await processor(makeJob());
    expect(JournalEntry.findByIdAndUpdate).toHaveBeenCalledWith(
      entryId,
      {
        $set: expect.objectContaining({
          aiFeedback:             'You showed strong commitment today.',
          aiTone:                 'encouraging',
          reflectionQualityScore: 85,
          alignmentDelta:         3,
          processingStatus:       'completed',
          processedAt:            expect.any(Date),
          analysisFlags:          expect.any(Object),
        }),
      },
      { new: true },
    );
  });

  it('re-enqueues alignment after reflection is processed', async () => {
    await processor(makeJob());
    expect(enqueueAlignment).toHaveBeenCalledWith(
      expect.objectContaining({ userId, trigger: 'reflection_done' }),
    );
  });

  it('sets processingStatus: failed on error (does not rethrow)', async () => {
    callLLM.mockRejectedValue(new Error('OpenAI timeout'));
    await expect(processor(makeJob())).resolves.not.toThrow();
    expect(JournalEntry.findByIdAndUpdate).toHaveBeenCalledWith(
      entryId,
      { $set: expect.objectContaining({ processingStatus: 'failed' }) },
      { new: true },
    );
  });

  it('skips processing if journal entry not found', async () => {
    JournalEntry.findById.mockResolvedValue(null);
    await processor(makeJob());
    expect(callLLM).not.toHaveBeenCalled();
  });
});
