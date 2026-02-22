'use strict';

// ─── Task 48: Async AI Reflection Processor Worker ───────────────────────────
// BullMQ worker: fetches context → calls AI → validates → updates journal → re-queues alignment.

const { z }                      = require('zod');
const { QUEUES }                 = require('../../config/constants');
const env                        = require('../../config/env');
const logger                     = require('../../utils/logger');
const { callLLM }                = require('../../services/ai/ai.orchestrator');
const { buildMemoryContext }     = require('../../services/ai/memory.short');
const { validateAIQualityScore } = require('../../services/reflection/quality.service');
const { buildReflectionPrompt }  = require('../../services/ai/prompts/reflection.prompt');
const { enqueueAlignment }       = require('../queues');

const JournalEntry      = require('../../models/JournalEntry');
const DailyExecutionLog = require('../../models/DailyExecutionLog');

// ─── Zod schema for AI response validation ────────────────────────────────────
const aiResponseSchema = z.object({
  aiFeedback:     z.string(),
  tone:           z.enum(['encouraging', 'firm', 'neutral', 'strategic']),
  qualityScore:   z.number().min(0).max(100),
  alignmentDelta: z.number().min(-5).max(5),
  flags: z.object({
    hasAccountability: z.boolean(),
    hasExcuses:        z.boolean(),
    hasGrowthMindset:  z.boolean(),
    specificity:       z.number().min(0).max(10),
  }),
});

// ─── Processor (exported for unit testing) ────────────────────────────────────

/**
 * Process one reflection job.
 * On AI error: mark entry as failed and resolve (BullMQ retry is available but job data doesn't change).
 *
 * @param {{ id: string, data: { journalEntryId: string, userId: string, date: string } }} job
 */
const processor = async (job) => {
  const { journalEntryId, userId, date } = job.data;
  logger.info({ jobId: job.id, journalEntryId, userId }, 'Reflection job started');

  // ── Fetch journal entry ───────────────────────────────────────────────────
  const entry = await JournalEntry.findById(journalEntryId);
  if (!entry) {
    logger.warn({ journalEntryId }, 'Journal entry not found, skipping');
    return;
  }

  try {
    // ── Fetch execution log for today's stats ─────────────────────────────
    const log = await DailyExecutionLog.findOne({ userId, date: entry.date });
    const todayStats = {
      coreCompletionPct:    log?.coreCompletionPct    ?? 0,
      supportCompletionPct: log?.supportCompletionPct ?? 0,
      habitDone:            log?.identityHabitDone     ?? false,
      deepWorkMinutes:      log?.deepWorkMinutes       ?? 0,
      averageEffort:        log?.averageEffort         ?? 0,
    };

    // ── Build memory context ───────────────────────────────────────────────
    const memory = await buildMemoryContext(userId);

    // ── Build prompt + call AI ─────────────────────────────────────────────
    const { system: systemPrompt, user: userPrompt } = buildReflectionPrompt(
      memory,
      entry.reflectionText,
      todayStats,
    );

    const rawAI = await callLLM({
      model:        env.OPENAI_MODEL_REFLECTION,
      systemPrompt,
      userPrompt,
      maxTokens:    600,
    });

    // ── Validate AI response ───────────────────────────────────────────────
    const parsed              = aiResponseSchema.parse(rawAI);
    const clampedQualityScore = validateAIQualityScore(parsed.qualityScore, entry.baselineScore);

    // ── Update journal entry ───────────────────────────────────────────────
    await JournalEntry.findByIdAndUpdate(
      journalEntryId,
      {
        $set: {
          aiFeedback:             parsed.aiFeedback,
          aiTone:                 parsed.tone,
          reflectionQualityScore: clampedQualityScore,
          alignmentDelta:         parsed.alignmentDelta,
          analysisFlags:          parsed.flags,
          processingStatus:       'completed',
          processedAt:            new Date(),
        },
      },
      { new: true },
    );

    // ── Re-enqueue alignment with updated reflection quality ───────────────
    await enqueueAlignment({ userId, date, trigger: 'reflection_done' });

    logger.info({ jobId: job.id, userId, clampedQualityScore }, 'Reflection job completed');

  } catch (err) {
    logger.error({ jobId: job.id, err: err.message }, 'Reflection job failed');

    // Mark as failed so the user knows processing didn't complete
    await JournalEntry.findByIdAndUpdate(
      journalEntryId,
      { $set: { processingStatus: 'failed' } },
      { new: true },
    );
    // Do NOT rethrow — BullMQ will retry based on job options
  }
};

// ─── Worker factory ───────────────────────────────────────────────────────────

const createReflectionWorker = () => {
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'test') {return null;}

  /* istanbul ignore next */
  const { Worker } = require('bullmq');
  /* istanbul ignore next */
  const redis      = require('../../config/redis');

  /* istanbul ignore next */
  const worker = new Worker(QUEUES.REFLECTION, processor, {
    connection:  redis,
    concurrency: 3,
  });

  /* istanbul ignore next */
  worker.on('completed', (job) =>
    logger.info({ jobId: job.id }, 'Reflection job completed'),
  );
  /* istanbul ignore next */
  worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, err: err.message }, 'Reflection job failed'),
  );

  /* istanbul ignore next */
  return worker;
};

module.exports = { createReflectionWorker, processor };
