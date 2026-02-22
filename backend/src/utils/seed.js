'use strict';

/**
 * Task 58: Production Database Seeder
 * Usage: npm run seed
 * Creates realistic 30-day test data for a demo user.
 */

const mongoose   = require('mongoose');
const bcrypt     = require('bcryptjs');
const env        = require('../config/env');

// Models
const User            = require('../models/User');
const IdentityProfile = require('../models/IdentityProfile');
const Plan            = require('../models/Plan');
const DailyExecutionLog = require('../models/DailyExecutionLog');
const AlignmentMetric   = require('../models/AlignmentMetric');
const JournalEntry      = require('../models/JournalEntry');
const WeeklyReview      = require('../models/WeeklyReview');

// Alignment math
const { calculateRawScore }               = require('../services/alignment/score.service');
const { calculateStreak, applyMultiplier } = require('../services/alignment/streak.service');
const { calculateDrift, determineStateLevel } = require('../services/alignment/drift.service');

const SEED_EMAIL    = 'test@revup.app';
const SEED_PASSWORD = 'Password123!';

const log = (msg) => process.stdout.write(`  ${msg}\n`);

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateDayTasks = (dayOfWeek) => {
  // Mon-Fri: higher completion; Sat-Sun: lower
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const coreTasks = [
    { taskName: 'Deep work session', isCore: true,  completed: isWeekday ? Math.random() > 0.2 : Math.random() > 0.5, effortScore: randomBetween(5, 10) },
    { taskName: 'Review goals',       isCore: true,  completed: isWeekday ? Math.random() > 0.3 : Math.random() > 0.6, effortScore: randomBetween(4, 9) },
    { taskName: 'Skill practice',     isCore: true,  completed: isWeekday ? Math.random() > 0.25: Math.random() > 0.55, effortScore: randomBetween(5, 10) },
    { taskName: 'Email responses',    isCore: false, completed: Math.random() > 0.3, effortScore: randomBetween(3, 7) },
    { taskName: 'Planning',           isCore: false, completed: Math.random() > 0.4, effortScore: randomBetween(4, 8) },
  ];

  const completedTasks = coreTasks.filter((t) => t.completed);
  const coreDone       = coreTasks.filter((t) => t.isCore && t.completed).length;
  const coreTotal      = coreTasks.filter((t) => t.isCore).length;
  const supportDone    = coreTasks.filter((t) => !t.isCore && t.completed).length;
  const supportTotal   = coreTasks.filter((t) => !t.isCore).length;
  const avgEffort      = completedTasks.length > 0
    ? completedTasks.reduce((s, t) => s + t.effortScore, 0) / completedTasks.length
    : 0;

  return {
    tasks:                coreTasks,
    coreCompletionPct:    coreTotal   > 0 ? Math.round((coreDone   / coreTotal)   * 100) : 0,
    supportCompletionPct: supportTotal > 0 ? Math.round((supportDone / supportTotal) * 100) : 0,
    averageEffort:        Math.round(avgEffort * 10) / 10,
  };
};

const run = async () => {
  await mongoose.connect(env.MONGO_URI);
  log('Connected to MongoDB');

  // ── User ────────────────────────────────────────────────────────────────────
  log('Creating user...');
  let user = await User.findOne({ email: SEED_EMAIL });
  if (!user) {
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
    user = await User.create({
      name:         'Test User',
      email:        SEED_EMAIL,
      passwordHash,
      authProvider: 'email',
      tier:         'premium',
      timezone:     'UTC',
    });
    log(`  Created user: ${SEED_EMAIL}`);
  } else {
    log(`  User exists: ${SEED_EMAIL}`);
  }

  const userId = user._id;

  // ── Identity Profile ────────────────────────────────────────────────────────
  log('Creating identity profile...');
  await IdentityProfile.findOneAndUpdate(
    { userId },
    {
      $set: {
        currentIdentity: {
          role:               'Software Engineer',
          energyLevel:        7,
          executionGap:       'Inconsistent follow-through on deep work',
          executionGapSeverity: 3,
          strengths:          ['Technical skills', 'Problem solving'],
          weaknesses:         ['Procrastination', 'Perfectionism'],
          frustrationPoint:   'Not reaching full potential',
        },
        futureIdentity: {
          desiredRole:         'Senior Engineering Manager',
          declarationSentence: 'I am becoming a disciplined engineering leader who executes with focus every day.',
          incomeRange:         '200k-250k',
          skillGoals:          ['Leadership', 'System design', 'Communication'],
          lifestyleVision:     'Leading high-impact teams while maintaining work-life balance',
        },
        riskProfile: {
          stabilityScore:        70,
          procrastinationIndex:  45,
          driftProbability:      0.25,
        },
        priorityPillars:    ['Career growth', 'Skill development', 'Health'],
        onboardingComplete: true,
        synthesisDone:      true,
      },
    },
    { upsert: true },
  );

  // ── Plan ─────────────────────────────────────────────────────────────────────
  log('Creating plan...');
  const planStart = new Date();
  planStart.setDate(planStart.getDate() - 30);
  planStart.setHours(0, 0, 0, 0);

  await Plan.findOneAndUpdate(
    { userId },
    {
      $set: {
        weekStartDate: planStart,
        coreActions:   [
          { title: 'Deep work session (2h)', weight: 3, isHabit: false },
          { title: 'Code review and learning', weight: 2, isHabit: false },
          { title: 'Leadership reading (30m)', weight: 2, isHabit: false },
        ],
        supportingActions: [
          { title: 'Email and communication', weight: 1 },
          { title: 'Planning and reflection', weight: 1 },
        ],
        identityHabit: 'Morning journaling and goal review',
        quarterTheme:  'Disciplined Ascent',
      },
    },
    { upsert: true },
  );

  // ── 30 Days of Execution Logs + Alignment Metrics ────────────────────────────
  log('Seeding 30 days of execution logs and alignment metrics...');
  const previousMetrics = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dayOfWeek   = date.getDay();
    const { tasks, coreCompletionPct, supportCompletionPct, averageEffort } = generateDayTasks(dayOfWeek);
    const habitDone   = Math.random() > 0.3;
    const deepWork    = randomBetween(30, 180);

    // Save execution log
    await DailyExecutionLog.findOneAndUpdate(
      { userId, date },
      {
        $set: {
          tasks,
          identityHabitDone:    habitDone,
          deepWorkMinutes:      deepWork,
          intentDeclared:       true,
          coreCompletionPct,
          supportCompletionPct,
          averageEffort,
          isMissedDay:          false,
        },
      },
      { upsert: true },
    );

    // Compute alignment score
    const coreDone    = tasks.filter((t) => t.isCore  && t.completed).length;
    const coreTotal   = tasks.filter((t) => t.isCore).length;
    const supportDone = tasks.filter((t) => !t.isCore && t.completed).length;
    const supportTotal = tasks.filter((t) => !t.isCore).length;

    const execSummary = {
      coreTasksTotal:    coreTotal,
      coreTasksDone:     coreDone,
      supportTasksTotal: supportTotal,
      supportTasksDone:  supportDone,
      habitDone,
      averageEffort,
      isMissedDay:       false,
    };

    const reflectionQuality = i < 10 ? randomBetween(50, 90) : 0;
    const { rawScore, components } = calculateRawScore(execSummary, reflectionQuality);
    const { streakCount, multiplier } = calculateStreak(rawScore, previousMetrics);
    const alignmentScore = applyMultiplier(rawScore, multiplier);
    const { driftIndex, sevenDayAverage } = calculateDrift(alignmentScore, previousMetrics);
    const stateLevel = determineStateLevel(sevenDayAverage, driftIndex, previousMetrics);

    const metric = await AlignmentMetric.findOneAndUpdate(
      { userId, date },
      {
        $set: {
          alignmentScore,
          rawScore,
          streakMultiplier: multiplier,
          driftIndex,
          sevenDayAverage,
          streakCount,
          stateLevel,
          components,
          patternFlags: [],
        },
      },
      { upsert: true, new: true },
    );

    previousMetrics.unshift(metric);
  }

  // ── Journal Entries (10 scattered) ──────────────────────────────────────────
  log('Creating 10 journal entries...');
  const journalDays = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29];
  for (const daysAgo of journalDays) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(0, 0, 0, 0);

    await JournalEntry.findOneAndUpdate(
      { userId, date },
      {
        $set: {
          reflectionText:         'Today I worked on my deep work habit and made progress on my leadership goals. I focused on being more intentional about my time and energy management. The practice of reviewing my goals each morning is starting to compound.',
          wordCount:              50,
          baselineScore:          75,
          reflectionQualityScore: 78,
          processingStatus:       'completed',
          processedAt:            date,
          aiFeedback:             'Strong self-awareness today. Keep building the consistency.',
          aiTone:                 'encouraging',
        },
      },
      { upsert: true },
    );
  }

  // ── Weekly Reviews (4 weeks) ─────────────────────────────────────────────────
  log('Creating 4 weekly reviews...');
  for (let week = 0; week < 4; week++) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (week + 1) * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    await WeeklyReview.findOneAndUpdate(
      { userId, weekStartDate: weekStart },
      {
        $set: {
          weekEndDate:           weekEnd,
          averageAlignmentScore: randomBetween(55, 82),
          bestDayScore:          randomBetween(75, 95),
          weakestDayScore:       randomBetween(30, 55),
          totalDeepWorkMins:     randomBetween(300, 700),
          habitConsistencyPct:   randomBetween(55, 90),
          taskCompletionPct:     randomBetween(50, 85),
          progressCard:          'A solid week of consistent execution. Your deep work habit is strengthening.',
          behavioralInsight:     'Midweek performance tends to be strongest — maintain this pattern.',
          driftTrend:            'improving',
          generatedAt:           weekEnd,
        },
      },
      { upsert: true },
    );
  }

  log('');
  log('✅ Seed complete!');
  log(`   User: ${SEED_EMAIL} / ${SEED_PASSWORD} (tier: premium)`);
  log('   30 execution logs + alignment metrics');
  log('   10 journal entries, 4 weekly reviews');
  log('');

  await mongoose.disconnect();
};

run().catch((err) => {
  process.stderr.write(`Seed error: ${err.message}\n`);
  process.exit(1);
});
