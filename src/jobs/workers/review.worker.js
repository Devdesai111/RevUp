'use strict';

// ─── Task 49: Weekly Review Aggregator Worker ─────────────────────────────────
// Runs every Sunday. Aggregates 7-day data → AI summary → saves WeeklyReview.

const { QUEUES }                = require('../../config/constants');
const env                       = require('../../config/env');
const logger                    = require('../../utils/logger');
const { callLLM }               = require('../../services/ai/ai.orchestrator');
const { buildMemoryContext }    = require('../../services/ai/memory.short');
const { buildWeeklyReviewPrompt } = require('../../services/ai/prompts/review.prompt');

const AlignmentMetric = require('../../models/AlignmentMetric');
const JournalEntry    = require('../../models/JournalEntry');
const WeeklyReview    = require('../../models/WeeklyReview');

// ─── Aggregation helpers ──────────────────────────────────────────────────────
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const aggregateWeekData = (metrics, logs) => {
  if (!metrics.length) {return null;}

  const scores        = metrics.map((m) => m.alignmentScore);
  const averageScore  = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);

  const bestMetric    = metrics.reduce((a, b) => (a.alignmentScore >= b.alignmentScore ? a : b));
  const worstMetric   = metrics.reduce((a, b) => (a.alignmentScore <= b.alignmentScore ? a : b));

  const bestDayScore  = bestMetric.alignmentScore;
  const bestDayName   = DAY_NAMES[new Date(bestMetric.date).getDay()];
  const worstDayScore = worstMetric.alignmentScore;
  const worstDayName  = DAY_NAMES[new Date(worstMetric.date).getDay()];

  const totalDeepWorkMins     = logs.reduce((s, l) => s + (l.deepWorkMinutes || 0), 0);
  const habitDays             = logs.filter((l) => l.identityHabitDone).length;
  const habitConsistencyPct   = logs.length > 0 ? Math.round((habitDays / logs.length) * 100) : 0;

  // Collect pattern flags seen this week
  const patterns = [...new Set(metrics.flatMap((m) => m.patternFlags || []))];

  // Brief journal summary (first 100 chars of each entry)
  const journalSummary = logs
    .filter((l) => l.reflectionText)
    .map((l) => l.reflectionText.slice(0, 80))
    .join(' | ')
    .slice(0, 300) || 'No journal entries this week';

  return {
    averageScore,
    bestDayScore,
    bestDayName,
    worstDayScore,
    worstDayName,
    totalDeepWorkMins,
    habitConsistencyPct,
    patterns,
    journalSummary,
  };
};

// ─── Processor ────────────────────────────────────────────────────────────────

/**
 * Process a weekly review job for a specific user.
 * If data is missing, no-ops gracefully.
 *
 * @param {{ id: string, data: { userId: string, weekStart: string } }} job
 */
const processor = async (job) => {
  const { userId, weekStart } = job.data;
  logger.info({ jobId: job.id, userId, weekStart }, 'Review job started');

  try {
    // Fetch 7-day metrics and logs
    const metrics = await AlignmentMetric
      .find({ userId })
      .sort({ date: -1 })
      .limit(7)
      .lean();

    const logs = await JournalEntry
      .find({ userId })
      .sort({ date: -1 })
      .limit(7)
      .lean();

    if (!metrics.length) {
      logger.info({ userId }, 'No metrics for review — skipping');
      return;
    }

    const weekData = aggregateWeekData(metrics, logs);
    const memory   = await buildMemoryContext(userId);

    const { system: systemPrompt, user: userPrompt } = buildWeeklyReviewPrompt(weekData, memory);

    const aiResponse = await callLLM({
      model:        env.OPENAI_MODEL_PLANNING,
      systemPrompt,
      userPrompt,
      maxTokens:    500,
    });

    // Compute week bounds
    const weekStartDate = new Date(metrics[metrics.length - 1].date);
    const weekEndDate   = new Date(metrics[0].date);

    await WeeklyReview.findOneAndUpdate(
      { userId, weekStartDate },
      {
        $set: {
          weekEndDate,
          averageAlignmentScore: weekData.averageScore,
          bestDay:               weekStartDate,
          bestDayScore:          weekData.bestDayScore,
          weakestDay:            weekEndDate,
          weakestDayScore:       weekData.worstDayScore,
          totalDeepWorkMins:     weekData.totalDeepWorkMins,
          habitConsistencyPct:   weekData.habitConsistencyPct,
          patternsSeen:          weekData.patterns,
          progressCard:          aiResponse.progressCard,
          behavioralInsight:     aiResponse.behavioralInsight,
          driftTrend:            aiResponse.driftTrend,
          generatedAt:           new Date(),
        },
      },
      { upsert: true, new: true },
    );

    logger.info({ userId }, 'Weekly review generated');
  } catch (err) {
    logger.error({ jobId: job.id, err: err.message }, 'Review job failed');
    // Do not rethrow — BullMQ will retry
  }
};

// ─── Worker factory ───────────────────────────────────────────────────────────

const createReviewWorker = () => {
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'test') {return null;}

  /* istanbul ignore next */
  const { Worker } = require('bullmq');
  /* istanbul ignore next */
  const redis      = require('../../config/redis');

  /* istanbul ignore next */
  const worker = new Worker(QUEUES.REVIEW, processor, {
    connection:  redis,
    concurrency: 2,
  });

  /* istanbul ignore next */
  worker.on('completed', (job) =>
    logger.info({ jobId: job.id }, 'Review job completed'),
  );
  /* istanbul ignore next */
  worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, err: err.message }, 'Review job failed'),
  );

  /* istanbul ignore next */
  return worker;
};

module.exports = { createReviewWorker, processor, aggregateWeekData };
