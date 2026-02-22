'use strict';

// ─── BullMQ Queue names ───────────────────────────────────────────────────────
const QUEUES = {
  ALIGNMENT:  'alignment',
  REFLECTION: 'reflection',
  REVIEW:     'review',
  SWEEP:      'sweep',
  MORNING:    'morning',
  EVENING:    'evening',
};

// ─── BullMQ Job names ─────────────────────────────────────────────────────────
const JOBS = {
  CALCULATE_ALIGNMENT: 'calculateAlignment',
  PROCESS_REFLECTION:  'processReflection',
  GENERATE_REVIEW:     'generateWeeklyReview',
  MIDNIGHT_SWEEP:      'midnightSweep',
  MORNING_BRIEF:       'morningBrief',
  EVENING_PROMPT:      'eveningPrompt',
};

// ─── Subscription tiers ───────────────────────────────────────────────────────
const TIERS = {
  FREE:    'free',
  PREMIUM: 'premium',
};

// ─── Auth providers ───────────────────────────────────────────────────────────
const AUTH_PROVIDERS = {
  LOCAL:  'local',
  GOOGLE: 'google',
  APPLE:  'apple',
};

// ─── Avatar state levels ──────────────────────────────────────────────────────
const AVATAR_LEVELS = {
  DIMINISHED: 1,
  STABLE:     2,
  ALIGNED:    3,
};

// ─── Alignment scoring thresholds ────────────────────────────────────────────
const ALIGNMENT = {
  // State transition thresholds
  DIMINISHED_THRESHOLD:     45,     // 7-day avg below this → Diminished
  ALIGNED_THRESHOLD:        75,     // 7-day avg above this → approaching Aligned
  DRIFT_DIMINISHED_CUTOFF:  -0.4,   // Sustained drift below this → Diminished
  DRIFT_DAYS_TO_DIMINISH:   3,
  ALIGNED_CONSECUTIVE_DAYS: 2,

  // Canonical aliases used by alignment services
  STATE_STABLE_MIN:  45,    // Same as DIMINISHED_THRESHOLD
  STATE_ALIGNED_MIN: 75,    // Same as ALIGNED_THRESHOLD
  DRIFT_DANGER:      -0.4,  // Same as DRIFT_DIMINISHED_CUTOFF

  // Streak thresholds and multipliers
  STREAK_BREAK_SCORE:    50,    // Score below this breaks the streak (previous day check)
  STREAK_THRESHOLD_HIGH: 7,     // Streak > 7 → 1.10 multiplier
  STREAK_THRESHOLD_LOW:  3,     // Streak > 3 → 1.05 multiplier
  MULTIPLIER_HIGH:       1.10,
  MULTIPLIER_LOW:        1.05,

  // Legacy aliases (kept for backward compatibility)
  STREAK_LONG_DAYS:  7,
  STREAK_LONG_MULT:  1.10,
  STREAK_SHORT_DAYS: 3,
  STREAK_SHORT_MULT: 1.05,
  STREAK_NONE_MULT:  1.00,

  // Missed day penalty
  MISSED_DAY_PENALTY: 0.10,  // 10% deduction from last score

  // Score weights (must sum to 1.0)
  WEIGHT_CORE:       0.50,
  WEIGHT_SUPPORT:    0.20,
  WEIGHT_HABIT:      0.15,
  WEIGHT_EFFORT:     0.10,
  WEIGHT_REFLECTION: 0.05,
};

// ─── Task weights ─────────────────────────────────────────────────────────────
const TASK_WEIGHTS = {
  CORE:       3,
  SUPPORTING: 2,
  HABIT:      1,
};

// ─── Score weights (alias for clarity) ───────────────────────────────────────
const SCORE_WEIGHTS = {
  CORE:       ALIGNMENT.WEIGHT_CORE,
  SUPPORT:    ALIGNMENT.WEIGHT_SUPPORT,
  HABIT:      ALIGNMENT.WEIGHT_HABIT,
  EFFORT:     ALIGNMENT.WEIGHT_EFFORT,
  REFLECTION: ALIGNMENT.WEIGHT_REFLECTION,
};

// ─── Reflection quality bands ─────────────────────────────────────────────────
const REFLECTION_QUALITY = {
  EXCELLENT: { min: 80, max: 100, label: 'Excellent' },
  GOOD:      { min: 60, max: 79,  label: 'Good' },
  FAIR:      { min: 40, max: 59,  label: 'Fair' },
  POOR:      { min: 20, max: 39,  label: 'Poor' },
  MINIMAL:   { min: 0,  max: 19,  label: 'Minimal' },
};

// ─── Behavioral pattern detection thresholds ──────────────────────────────────
const PATTERNS = {
  MIDWEEK_DRIFT: {
    KEY:            'MIDWEEK_DRIFT',
    WEEKS_REQUIRED: 3,   // Drift must occur in 3 of last 4 weeks
    DROP_THRESHOLD: 15,  // Wednesday ≥ 15 points below Monday
  },
  EFFORT_INFLATION: {
    KEY:            'EFFORT_INFLATION',
    EFFORT_MIN:     8,   // averageEffort >= 8
    COMPLETION_MAX: 50,  // coreCompletionPct < 50%
    DAYS_REQUIRED:  3,   // Occurs in 3 of last 7 days
  },
  OVERCOMMIT: {
    KEY:            'OVERCOMMITMENT',
    COMPLETION_MAX: 40,  // coreCompletionPct < 40%
    DAYS_REQUIRED:  5,   // Occurs in 5 of last 7 days
  },
  STREAK_BREAK: {
    KEY: 'STREAK_BREAK',
  },
};

// ─── Free tier limits ─────────────────────────────────────────────────────────
const FREE_LIMITS = {
  DAILY_AI_CALLS:      3,
  AI_CALLS_PER_WEEK:   3,   // 4th AI call in a week → 403 (Task 53)
  SPRINT_REROLLS_WEEK: 1,
  VOICE_ENTRIES_MONTH: 5,
};

// ─── Pagination defaults ──────────────────────────────────────────────────────
const PAGINATION = {
  DEFAULT_PAGE:  1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT:     100,
};

// ─── Plan limits ──────────────────────────────────────────────────────────────
const PLAN_LIMITS = {
  CORE_ACTIONS_PER_SPRINT:       3,
  SUPPORTING_ACTIONS_PER_SPRINT: 2,
  MACRO_OBJECTIVES_PER_QUARTER:  3,
  SPRINT_REROLLS_MAX:            3,
};

// ─── Notification types ───────────────────────────────────────────────────────
const NOTIFICATION_TYPES = {
  MORNING_BRIEF:    'morning_brief',
  EVENING_PROMPT:   'evening_prompt',
  DRIFT_ALERT:      'drift_alert',
  STREAK_BROKEN:    'streak_broken',
  STREAK_MILESTONE: 'streak_milestone',
  WEEKLY_REVIEW:    'weekly_review',
};

module.exports = {
  QUEUES,
  JOBS,
  TIERS,
  AUTH_PROVIDERS,
  AVATAR_LEVELS,
  ALIGNMENT,
  TASK_WEIGHTS,
  SCORE_WEIGHTS,
  REFLECTION_QUALITY,
  PATTERNS,
  FREE_LIMITS,
  PAGINATION,
  PLAN_LIMITS,
  NOTIFICATION_TYPES,
};
