# 🚀 REVUP BACKEND — MASTER EXECUTION PLAN
> **Version:** 1.0 | **Stack:** Node.js · Express · MongoDB · Redis · BullMQ · Zod  
> **Strategy:** Backend-First · Strict TDD · Deterministic Scoring · AI-Assisted Planning  
> **For:** Claude Code (AI Coding Agent) — Read this entire document before writing a single line of code.

---

## 📋 TABLE OF CONTENTS

1. [AI Agent Rules (Read First)](#1-ai-agent-rules-read-first)
2. [Product Overview](#2-product-overview)
3. [Environment Variables](#3-environment-variables-env-canonical-list)
4. [Global Constants & Enums](#4-global-constants--enums)
5. [Standard Response Format](#5-standard-api-response-format)
6. [Custom Error Class](#6-custom-error-class)
7. [Redis Key Naming Convention](#7-redis-key-naming-convention)
8. [BullMQ Queue Contracts](#8-bullmq-queue-contracts--job-payload-schemas)
9. [Database Models & Schemas](#9-database-models--schemas)
10. [Inter-Service Payload Contracts](#10-inter-service-payload-contracts)
11. [Alignment Scoring Engine — The Math](#11-alignment-scoring-engine--the-exact-math)
12. [Avatar State Config](#12-avatar-state-config-complete)
13. [Reflection Quality Scoring](#13-reflection-quality-scoring-algorithm)
14. [Pattern Detection Algorithms](#14-pattern-detection-algorithms)
15. [AI Prompt Templates](#15-ai-prompt-templates)
16. [Complete API Endpoint Specification](#16-complete-api-endpoint-specification)
17. [Folder Structure](#17-folder-structure-complete)
18. [Jest & Test Setup](#18-jest--test-setup)
19. [Docker Compose](#19-docker-compose-local-dev)
20. [Package.json with Exact Versions](#20-packagejson-with-exact-versions)
21. [Phase-by-Phase Task Plan (60 Tasks)](#21-phase-by-phase-task-plan-60-tasks)
22. [Validation Milestones](#22-validation-milestones)

---

## 1. AI AGENT RULES (READ FIRST)

> These rules are absolute. Never violate them.

```
RULE 1 — TECH STACK (Non-negotiable)
  Runtime:    Node.js 18+
  Framework:  Express 4.x
  Database:   MongoDB via Mongoose 8.x
  Cache:      Redis via ioredis 5.x
  Queue:      BullMQ 4.x
  Validation: Zod 3.x (ONLY — no Joi, no express-validator)
  Testing:    Jest + Supertest
  Logger:     Pino

RULE 2 — ARCHITECTURE (Non-negotiable)
  - Controllers handle HTTP ONLY (parse req, call service, send res)
  - Services handle ALL business logic
  - Models handle DB schema ONLY — no business logic in models
  - 1 File = 1 Responsibility — never merge services together
  - Never call services from other services directly — use events or queues for cross-domain

RULE 3 — ALIGNMENT ENGINE IS PURE MATH (Critical)
  - ZERO AI/LLM calls inside Phase 7 (Alignment Scoring)
  - score.service.js, streak.service.js, drift.service.js = pure deterministic functions
  - No async operations in the core math functions — they receive data, return numbers

RULE 4 — TDD (Test-Driven Development)
  - Write the FAILING test first, THEN write the implementation to make it pass
  - Unit tests for all service functions
  - Integration/E2E tests using Supertest for all routes
  - Never skip tests to ship faster

RULE 5 — ERROR HANDLING
  - ALL async functions wrapped in try/catch
  - ALWAYS call next(err) — never res.status(500).json() directly in controllers
  - Use AppError class (defined in Section 6) for all operational errors
  - Global error middleware handles all thrown errors

RULE 6 — VALIDATION
  - Zod schemas ALWAYS validated in middleware BEFORE controllers are called
  - validate(schema) middleware defined in src/middlewares/validate.mid.js
  - Never validate manually inside controllers

RULE 7 — PRODUCTION CODE ONLY
  - No TODO comments in implementation files
  - No pseudo-code — write working code
  - No console.log — use logger (Pino)
  - All environment variables accessed via src/config/env.js (centralized)

RULE 8 — RESPONSE FORMAT
  - ALL responses use the standard format defined in Section 5
  - Use sendSuccess(), sendError(), sendPaginated() helpers
  - Never construct raw response objects in controllers

RULE 9 — AI CALLS ARE ASYNC-ONLY (except onboarding synthesis)
  - After user submits reflection → API returns 202, BullMQ processes AI in background
  - ONLY EXCEPTION: POST /identity/synthesize (initial onboarding) blocks for AI response
  - All other AI calls go through BullMQ queues

RULE 10 — CONSTANTS ARE IMPORTED, NEVER HARD-CODED
  - Queue names, Redis key patterns, enum values = imported from src/config/constants.js
  - Never write "alignment-queue" as a string literal — import QUEUES.ALIGNMENT
```

---

## 2. PRODUCT OVERVIEW

**RevUp** is a mobile-first Identity Alignment System for ambitious professionals.

**Core Loop:**
```
Identity → Plan → Execute → Reflect → Score → Avatar Update → Adjust Plan → Repeat
```

**What it does:**
1. Extracts user's current identity (onboarding interview — voice or text)
2. Defines their future identity (desired role, income, skills, lifestyle)
3. Converts that into a measurable 90-day execution roadmap
4. Tracks daily task completion and behavioral alignment
5. Scores alignment daily (0–100) using deterministic math — no AI in scoring
6. Evolves a visual avatar based on alignment score
7. Creates AI-powered dialogue between present self and future self

**Two Surfaces:**
- **Mobile App (React Native):** Daily ritual, task completion, reflection, avatar
- **Web Dashboard (React):** 90-day roadmap, analytics, journal archive, behavioral patterns

**Subscription Tiers:**
- **Free:** Basic onboarding (text only), 1 identity track, 3 AI reflections/week, basic avatar
- **Premium:** Voice AI, unlimited AI reflection, advanced analytics, full avatar evolution, PDF export

---

## 3. ENVIRONMENT VARIABLES — `.env` CANONICAL LIST

> Create `.env.example` with ALL of these. Every variable must be documented.  
> Access all env vars through `src/config/env.js` — never `process.env.X` directly in service files.

```bash
# ═══════════════════════════════════════════
# SERVER
# ═══════════════════════════════════════════
PORT=3000
NODE_ENV=development                          # development | production | test

# ═══════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════
MONGO_URI=mongodb://localhost:27017/revup
MONGO_URI_TEST=mongodb://localhost:27017/revup_test
MONGO_MAX_POOL_SIZE=100

# ═══════════════════════════════════════════
# REDIS
# ═══════════════════════════════════════════
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=revup:                       # Prefix all Redis keys with this

# ═══════════════════════════════════════════
# JWT AUTH
# ═══════════════════════════════════════════
JWT_ACCESS_SECRET=your_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ═══════════════════════════════════════════
# OPENAI
# ═══════════════════════════════════════════
OPENAI_API_KEY=sk-...
OPENAI_MODEL_SYNTHESIS=gpt-4o               # Used ONLY for initial identity synthesis (high quality)
OPENAI_MODEL_REFLECTION=gpt-4o-mini         # Used for daily reflection analysis (cost-efficient)
OPENAI_MODEL_PLANNING=gpt-4o-mini           # Used for 90-day plan generation
OPENAI_MODEL_TTS=tts-1                      # Text-to-speech model
OPENAI_MODEL_STT=whisper-1                  # Speech-to-text model
OPENAI_MAX_RETRIES=3
OPENAI_TIMEOUT_MS=30000

# ═══════════════════════════════════════════
# AWS S3 (for voice audio files)
# ═══════════════════════════════════════════
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_S3_BUCKET=revup-voice-audio
AWS_S3_URL_EXPIRY=3600                       # Signed URL expiry in seconds

# ═══════════════════════════════════════════
# EMAIL (Resend)
# ═══════════════════════════════════════════
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@revup.app
EMAIL_SUPPORT=support@revup.app

# ═══════════════════════════════════════════
# PAYMENTS
# ═══════════════════════════════════════════
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=

# ═══════════════════════════════════════════
# PUSH NOTIFICATIONS (Firebase)
# ═══════════════════════════════════════════
FCM_SERVER_KEY=
FCM_PROJECT_ID=

# ═══════════════════════════════════════════
# FRONTEND URLS (for CORS + emails)
# ═══════════════════════════════════════════
FRONTEND_WEB_URL=http://localhost:3001
FRONTEND_APP_URL=exp://localhost:19000
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# ═══════════════════════════════════════════
# RATE LIMITS
# ═══════════════════════════════════════════
RATE_LIMIT_GLOBAL_MAX=100                    # requests per window
RATE_LIMIT_GLOBAL_WINDOW_MS=60000           # 1 minute
RATE_LIMIT_AUTH_MAX=5                        # auth route requests per window
RATE_LIMIT_AUTH_WINDOW_MS=600000            # 10 minutes
RATE_LIMIT_AI_FREE_DAILY=3                  # AI calls per week for free users

# ═══════════════════════════════════════════
# FEATURE FLAGS
# ═══════════════════════════════════════════
FEATURE_VOICE_ONBOARDING=true               # Enable voice onboarding mode
FEATURE_TTS_RESPONSE=true                   # Enable TTS AI voice responses
```

### `src/config/env.js` — Centralized Config (Write This First)

```javascript
const z = require('zod');

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().min(1),
  MONGO_URI_TEST: z.string().optional(),
  MONGO_MAX_POOL_SIZE: z.string().default('100').transform(Number),
  REDIS_URL: z.string().min(1),
  REDIS_KEY_PREFIX: z.string().default('revup:'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL_SYNTHESIS: z.string().default('gpt-4o'),
  OPENAI_MODEL_REFLECTION: z.string().default('gpt-4o-mini'),
  OPENAI_MODEL_PLANNING: z.string().default('gpt-4o-mini'),
  OPENAI_MODEL_TTS: z.string().default('tts-1'),
  OPENAI_MODEL_STT: z.string().default('whisper-1'),
  OPENAI_MAX_RETRIES: z.string().default('3').transform(Number),
  OPENAI_TIMEOUT_MS: z.string().default('30000').transform(Number),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_URL_EXPIRY: z.string().default('3600').transform(Number),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@revup.app'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  FCM_SERVER_KEY: z.string().optional(),
  FRONTEND_WEB_URL: z.string().default('http://localhost:3001'),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3001'),
  RATE_LIMIT_GLOBAL_MAX: z.string().default('100').transform(Number),
  RATE_LIMIT_GLOBAL_WINDOW_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_AUTH_MAX: z.string().default('5').transform(Number),
  RATE_LIMIT_AUTH_WINDOW_MS: z.string().default('600000').transform(Number),
  RATE_LIMIT_AI_FREE_DAILY: z.string().default('3').transform(Number),
  FEATURE_VOICE_ONBOARDING: z.string().default('true').transform(v => v === 'true'),
  FEATURE_TTS_RESPONSE: z.string().default('false').transform(v => v === 'true'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

module.exports = parsed.data;
```

---

## 4. GLOBAL CONSTANTS & ENUMS

> **File:** `src/config/constants.js`  
> Import from this file everywhere. Never use string literals for these values.

```javascript
// src/config/constants.js

// ─── BullMQ Queue Names ───────────────────────────────────────────────────
const QUEUES = {
  ALIGNMENT:  'revup:alignment-recalc',
  REFLECTION: 'revup:reflection-processor',
  REVIEW:     'revup:weekly-review',
  SWEEP:      'revup:midnight-sweep',
  MORNING:    'revup:morning-reminder',
  EVENING:    'revup:evening-reminder',
};

// ─── BullMQ Job Names ─────────────────────────────────────────────────────
const JOBS = {
  RECALCULATE:        'recalculate',
  PROCESS_REFLECTION: 'process-reflection',
  WEEKLY_REVIEW:      'weekly-review',
  SWEEP_USERS:        'sweep-users',
  SEND_MORNING:       'send-morning',
  SEND_EVENING:       'send-evening',
};

// ─── Subscription Tiers ───────────────────────────────────────────────────
const TIERS = {
  FREE:    'free',
  PREMIUM: 'premium',
};

// ─── Auth Providers ───────────────────────────────────────────────────────
const AUTH_PROVIDERS = {
  LOCAL:  'local',
  GOOGLE: 'google',
  APPLE:  'apple',
};

// ─── Avatar State Levels ──────────────────────────────────────────────────
const AVATAR_LEVELS = {
  DIMINISHED: 1,
  STABLE:     2,
  ALIGNED:    3,
};

// ─── Alignment Thresholds ─────────────────────────────────────────────────
const ALIGNMENT = {
  SCORE_MIN:           0,
  SCORE_MAX:           100,
  STREAK_THRESHOLD_LOW: 3,    // streak > 3 → 1.05x multiplier
  STREAK_THRESHOLD_HIGH: 7,   // streak > 7 → 1.10x multiplier
  MULTIPLIER_LOW:      1.05,
  MULTIPLIER_HIGH:     1.10,
  STREAK_BREAK_SCORE:  50,    // score below this breaks streak
  MISSED_DAY_PENALTY:  0.10,  // 10% deducted from 7-day average
  DRIFT_DANGER:        -0.4,  // drift below this → drop to state level 1
  STATE_ALIGNED_MIN:   75,    // 7-day avg > 75 AND drift > 0 → state 3
  STATE_STABLE_MIN:    45,    // 7-day avg 45–75 → state 2
  // state < 45 OR drift < -0.4 for 3 days → state 1
};

// ─── Task Weights ─────────────────────────────────────────────────────────
const TASK_WEIGHTS = {
  CORE:     3,
  SUPPORT:  1,
  HABIT:    1.5,
};

// ─── Score Formula Weights ────────────────────────────────────────────────
const SCORE_WEIGHTS = {
  CORE_COMPLETION:    0.50,   // 50 points max
  SUPPORT_COMPLETION: 0.20,   // 20 points max
  HABIT_COMPLETION:   0.15,   // 15 points max
  EFFORT_NORMALIZED:  0.10,   // 10 points max  (effort 1–10 mapped to 0–100)
  REFLECTION_QUALITY: 0.05,   //  5 points max
  // TOTAL MAX:        1.00   = 100 points
};

// ─── Reflection Quality Baselines ─────────────────────────────────────────
const REFLECTION_QUALITY = {
  VERY_SHORT:  { maxWords: 50,  score: 20 },
  SHORT:       { maxWords: 100, score: 40 },
  MEDIUM:      { maxWords: 200, score: 60 },
  GOOD:        { maxWords: 300, score: 75 },
  EXCELLENT:   { maxWords: Infinity, score: 85 },
  // AI then adjusts this baseline score up or down
};

// ─── Pattern Detection Thresholds ─────────────────────────────────────────
const PATTERNS = {
  MIDWEEK_DRIFT: {
    DROP_THRESHOLD:    15,    // Wednesday score must be 15+ points lower than Monday
    WEEKS_REQUIRED:    3,     // Must happen 3 consecutive weeks to flag
    CLEAR_AFTER_GOOD:  2,     // 2 good Wednesdays clears the flag
  },
  EFFORT_INFLATION: {
    EFFORT_MIN:        8,     // Effort rated >= 8
    COMPLETION_MAX:    50,    // But task completion < 50%
    DAYS_REQUIRED:    3,     // Must happen 3 of the last 7 days
  },
  OVERCOMMIT: {
    COMPLETION_MAX:    40,    // Average completion < 40%
    DAYS_REQUIRED:    5,     // Out of last 7 days
  },
};

// ─── Free Tier Limits ─────────────────────────────────────────────────────
const FREE_LIMITS = {
  AI_CALLS_PER_WEEK:  3,
  IDENTITY_TRACKS:    1,
  SPRINT_REROLLS:     1,
};

// ─── Pagination ───────────────────────────────────────────────────────────
const PAGINATION = {
  DEFAULT_PAGE:   1,
  DEFAULT_LIMIT:  20,
  MAX_LIMIT:      100,
};

// ─── Plan Limits ──────────────────────────────────────────────────────────
const PLAN_LIMITS = {
  MAX_CORE_ACTIONS:       3,
  MAX_SUPPORT_ACTIONS:    2,
  MAX_PRIORITY_PILLARS:   3,
  MAX_SPRINT_REROLLS:     3,  // per week
  ADAPTIVE_STREAK_UNLOCK: 14, // streak days before adaptive difficulty increases
};

// ─── Notification Types ───────────────────────────────────────────────────
const NOTIFICATION_TYPES = {
  MORNING_REMINDER:  'morning_reminder',
  EVENING_REMINDER:  'evening_reminder',
  DRIFT_ALERT:       'drift_alert',
  STREAK_MILESTONE:  'streak_milestone',
  WEEKLY_REVIEW:     'weekly_review',
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
```

---

## 5. STANDARD API RESPONSE FORMAT

> **File:** `src/utils/response.util.js`  
> ALL controllers must use these helpers. Never write raw `res.json()` calls.

```javascript
// src/utils/response.util.js

/**
 * Success response
 * { success: true, data: {}, message: "optional" }
 */
const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Created response (201)
 */
const sendCreated = (res, data = {}, message = 'Created') => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Accepted (async processing) response (202)
 */
const sendAccepted = (res, message = 'Processing', jobId = null) => {
  return res.status(202).json({
    success: true,
    message,
    data: { jobId },
  });
};

/**
 * Error response
 * { success: false, message: "Human readable", code: "ERROR_CODE", errors: [] }
 */
const sendError = (res, message = 'An error occurred', statusCode = 500, code = 'INTERNAL_ERROR', errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
    errors,
  });
};

/**
 * Paginated list response
 * { success: true, data: [], pagination: { page, limit, total, totalPages } }
 */
const sendPaginated = (res, data = [], total = 0, page = 1, limit = 20) => {
  return res.status(200).json({
    success: true,
    message: 'Success',
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

module.exports = { sendSuccess, sendCreated, sendAccepted, sendError, sendPaginated };
```

---

## 6. CUSTOM ERROR CLASS

> **File:** `src/utils/AppError.js`  
> Use this for ALL operational errors thrown in services.

```javascript
// src/utils/AppError.js

class AppError extends Error {
  /**
   * @param {string} message   - Human-readable message (sent to client)
   * @param {number} statusCode - HTTP status code
   * @param {string} code      - Machine-readable error code (e.g. 'USER_EXISTS')
   * @param {Array}  errors    - Optional array of validation errors
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;   // Distinguishes known errors from programming bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Pre-defined Error Factories ──────────────────────────────────────────

const Errors = {
  // Auth
  USER_EXISTS:          (msg = 'Email already registered') =>
    new AppError(msg, 409, 'USER_EXISTS'),
  INVALID_CREDENTIALS:  (msg = 'Invalid email or password') =>
    new AppError(msg, 401, 'INVALID_CREDENTIALS'),
  UNAUTHORIZED:         (msg = 'Authentication required') =>
    new AppError(msg, 401, 'UNAUTHORIZED'),
  FORBIDDEN:            (msg = 'Access denied') =>
    new AppError(msg, 403, 'FORBIDDEN'),
  TOKEN_EXPIRED:        (msg = 'Token has expired') =>
    new AppError(msg, 401, 'TOKEN_EXPIRED'),
  INVALID_TOKEN:        (msg = 'Invalid token') =>
    new AppError(msg, 401, 'INVALID_TOKEN'),

  // Resources
  NOT_FOUND:            (resource = 'Resource') =>
    new AppError(`${resource} not found`, 404, 'NOT_FOUND'),
  IDENTITY_NOT_FOUND:   () =>
    new AppError('Identity profile not found. Complete onboarding first.', 404, 'IDENTITY_NOT_FOUND'),
  PLAN_NOT_FOUND:       () =>
    new AppError('No active plan found. Generate your 90-day plan first.', 404, 'PLAN_NOT_FOUND'),

  // Validation
  VALIDATION_ERROR:     (errors = []) =>
    new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors),
  OVERCOMMIT:           (msg = 'Tasks exceed available daily hours') =>
    new AppError(msg, 400, 'OVERCOMMIT'),

  // Rate limiting
  RATE_LIMIT_EXCEEDED:  (msg = 'Too many requests') =>
    new AppError(msg, 429, 'RATE_LIMIT_EXCEEDED'),
  AI_LIMIT_EXCEEDED:    (msg = 'Weekly AI interaction limit reached. Upgrade to Premium for unlimited access.') =>
    new AppError(msg, 403, 'AI_LIMIT_EXCEEDED'),

  // Subscription
  PREMIUM_REQUIRED:     (feature = 'This feature') =>
    new AppError(`${feature} requires a Premium subscription`, 403, 'PREMIUM_REQUIRED'),

  // Processing
  AI_UNAVAILABLE:       (msg = 'AI service temporarily unavailable') =>
    new AppError(msg, 503, 'AI_UNAVAILABLE'),
  AUDIO_TOO_LARGE:      (msg = 'Audio file exceeds 25MB limit') =>
    new AppError(msg, 400, 'AUDIO_TOO_LARGE'),
  INVALID_AUDIO_FORMAT: (msg = 'Unsupported audio format. Use mp3, mp4, m4a, wav, or webm') =>
    new AppError(msg, 400, 'INVALID_AUDIO_FORMAT'),
};

module.exports = { AppError, Errors };
```

### Global Error Handler Middleware

```javascript
// src/middlewares/error.mid.js

const env = require('../config/env');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';
  let code       = err.code       || 'INTERNAL_ERROR';
  let errors     = err.errors     || [];

  // Log all errors
  logger.error({
    err,
    req: { method: req.method, url: req.url, userId: req.user?._id },
  }, `[${code}] ${message}`);

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Hide stack trace in production
  const response = {
    success: false,
    message,
    code,
    errors,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  };

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
```

---

## 7. REDIS KEY NAMING CONVENTION

> **File:** `src/config/redis-keys.js`  
> Use these factory functions everywhere. Never write raw Redis key strings.

```javascript
// src/config/redis-keys.js
// All keys are prefixed with env.REDIS_KEY_PREFIX (default: "revup:")

const keys = {
  // ─── Auth & Session ────────────────────────────────────────────────────
  refreshToken:       (userId)         => `auth:refresh:${userId}`,
  passwordReset:      (email)          => `auth:reset:${email}`,
  sessionVersion:     (userId)         => `auth:version:${userId}`,    // for logout-all

  // ─── Caching ────────────────────────────────────────────────────────────
  identityCache:      (userId)         => `cache:identity:${userId}`,
  planCache:          (userId, week)   => `cache:plan:${userId}:${week}`,
  avatarStateCache:   (userId)         => `cache:avatar:${userId}`,
  dashboardCache:     (userId)         => `cache:dashboard:${userId}`,

  // ─── Rate Limiting ──────────────────────────────────────────────────────
  aiUsageWeekly:      (userId, weekKey)=> `limit:ai:${userId}:${weekKey}`,   // weekKey = YYYY-WW
  sprintRerolls:      (userId, weekKey)=> `limit:reroll:${userId}:${weekKey}`,

  // ─── Alignment Engine ───────────────────────────────────────────────────
  alignmentLock:      (userId)         => `lock:alignment:${userId}`,
  midnightSwept:      (userId, date)   => `sweep:${userId}:${date}`,         // date = YYYY-MM-DD

  // ─── Notification State ─────────────────────────────────────────────────
  lastDriftAlert:     (userId)         => `notif:drift:${userId}`,           // TTL = 7 days
  fcmToken:           (userId)         => `fcm:token:${userId}`,
};

module.exports = keys;

// Usage example:
// const REDIS_KEYS = require('../config/redis-keys');
// await redis.set(REDIS_KEYS.identityCache(userId), JSON.stringify(profile), 'EX', 3600);
```

**TTL Reference:**

| Key Pattern | TTL |
|---|---|
| `auth:refresh:{userId}` | 7 days (604800s) |
| `auth:reset:{email}` | 1 hour (3600s) |
| `cache:identity:{userId}` | 1 hour (3600s) — invalidate on POST |
| `cache:plan:{userId}:{week}` | 7 days — invalidate on sprint edit |
| `cache:avatar:{userId}` | 30 minutes (1800s) |
| `lock:alignment:{userId}` | 30 seconds (auto-expires) |
| `limit:ai:{userId}:{weekKey}` | Until end of week (calculated) |
| `notif:drift:{userId}` | 7 days (prevent repeat alerts) |
| `sweep:{userId}:{date}` | 48 hours |

---

## 8. BULLMQ QUEUE CONTRACTS & JOB PAYLOAD SCHEMAS

> **File:** `src/jobs/queues.js`  
> Every queue and every job payload is typed here. Never add jobs without defining the payload.

```javascript
// src/jobs/queues.js

const { Queue } = require('bullmq');
const { QUEUES, JOBS } = require('../config/constants');
const redis = require('../config/redis');

// ─── Queue Instances ──────────────────────────────────────────────────────
const alignmentQueue  = new Queue(QUEUES.ALIGNMENT,  { connection: redis });
const reflectionQueue = new Queue(QUEUES.REFLECTION, { connection: redis });
const reviewQueue     = new Queue(QUEUES.REVIEW,     { connection: redis });
const sweepQueue      = new Queue(QUEUES.SWEEP,      { connection: redis });

// ─── Default Job Options ──────────────────────────────────────────────────
const defaultJobOpts = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { count: 100 },
  removeOnFail:     { count: 50  },
};

// ─── Job Payload Schemas (JSDoc for IDE support) ──────────────────────────

/**
 * @typedef AlignmentJobPayload
 * @property {string} userId    - MongoDB ObjectId string
 * @property {string} date      - ISO date string (UTC midnight), e.g. "2025-01-15T00:00:00.000Z"
 * @property {string} [trigger] - What triggered this recalc: "task_complete" | "reflection_done" | "sweep"
 */

/**
 * @typedef ReflectionJobPayload
 * @property {string} journalEntryId  - MongoDB ObjectId of the JournalEntry
 * @property {string} userId          - MongoDB ObjectId string
 * @property {string} date            - ISO date string of the reflection
 */

/**
 * @typedef WeeklyReviewJobPayload
 * @property {string} userId    - MongoDB ObjectId string
 * @property {string} weekStart - ISO date string of week start (Monday midnight UTC)
 */

/**
 * @typedef SweepJobPayload
 * @property {string} date      - ISO date string being swept (yesterday's date)
 */

// ─── Queue Helper Functions ────────────────────────────────────────────────

/** @param {AlignmentJobPayload} payload */
const enqueueAlignment = (payload) =>
  alignmentQueue.add(JOBS.RECALCULATE, payload, defaultJobOpts);

/** @param {ReflectionJobPayload} payload */
const enqueueReflection = (payload) =>
  reflectionQueue.add(JOBS.PROCESS_REFLECTION, payload, defaultJobOpts);

/** @param {WeeklyReviewJobPayload} payload */
const enqueueWeeklyReview = (payload) =>
  reviewQueue.add(JOBS.WEEKLY_REVIEW, payload, defaultJobOpts);

// Repeatable weekly review job (runs every Sunday at 23:00 UTC)
const scheduleWeeklyReviews = () =>
  reviewQueue.add(
    JOBS.WEEKLY_REVIEW,
    {},
    { ...defaultJobOpts, repeat: { cron: '0 23 * * 0' } }
  );

// Repeatable midnight sweep (runs every hour to catch all timezones)
const scheduleMidnightSweep = () =>
  sweepQueue.add(
    JOBS.SWEEP_USERS,
    {},
    { ...defaultJobOpts, repeat: { cron: '5 * * * *' } } // :05 every hour
  );

module.exports = {
  alignmentQueue,
  reflectionQueue,
  reviewQueue,
  sweepQueue,
  enqueueAlignment,
  enqueueReflection,
  enqueueWeeklyReview,
  scheduleWeeklyReviews,
  scheduleMidnightSweep,
};
```

---

## 9. DATABASE MODELS & SCHEMAS

> All Mongoose models with complete field definitions, validations, indexes, and JSDoc.

### 9.1 User Model — `src/models/User.js`

```javascript
const mongoose = require('mongoose');
const { TIERS, AUTH_PROVIDERS } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    passwordHash: {
      type: String,
      select: false,          // Never returned by default
      required: function () { return this.authProvider === 'local'; },
    },
    authProvider: {
      type: String,
      enum: Object.values(AUTH_PROVIDERS),
      default: AUTH_PROVIDERS.LOCAL,
    },
    subscriptionTier: {
      type: String,
      enum: Object.values(TIERS),
      default: TIERS.FREE,
    },
    timezone: {
      type: String,
      default: 'UTC',
      // Examples: "Asia/Kolkata", "America/New_York", "Europe/London"
    },
    notificationPreferences: {
      morning: { type: Boolean, default: true },
      evening: { type: Boolean, default: true },
      drift:   { type: Boolean, default: true },
      streak:  { type: Boolean, default: true },
    },
    fcmToken: {
      type: String,
      default: null,
    },
    isActive:  { type: Boolean, default: true  },
    isAdmin:   { type: Boolean, default: false },
    // For logout-all functionality
    tokenVersion: { type: Number, default: 0 },
    // Stripe customer reference
    stripeCustomerId: { type: String, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,        // Adds createdAt, updatedAt automatically
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ subscriptionTier: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);
```

### 9.2 IdentityProfile Model — `src/models/IdentityProfile.js`

```javascript
const mongoose = require('mongoose');

const identityProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // ─── Current State ────────────────────────────────────────────────────
    currentIdentity: {
      role:             { type: String, trim: true },
      energyLevel:      { type: Number, min: 1, max: 10 },   // 1=depleted, 10=peak
      executionGap:     { type: String, enum: ['focus', 'consistency', 'motivation', 'clarity', 'time'] },
      executionGapSeverity: { type: Number, min: 1, max: 5 }, // 1=minor, 5=severe
      strengths:        [{ type: String, trim: true }],       // max 5 items
      weaknesses:       [{ type: String, trim: true }],       // max 5 items
      frustrationPoint: { type: String, trim: true },
      disciplineBreakPattern: { type: String, trim: true },
    },
    // ─── Future State ─────────────────────────────────────────────────────
    futureIdentity: {
      desiredRole:          { type: String, trim: true },
      incomeRange:          { type: String },                 // e.g. "₹50L-1Cr"
      skillGoals:           [{ type: String, trim: true }],  // max 5 items
      healthTarget:         { type: Number, min: 1, max: 10 },
      confidenceTarget:     { type: Number, min: 1, max: 10 },
      lifestyleVision:      { type: String, trim: true },
      declarationSentence:  { type: String, maxlength: 300 },
    },
    // ─── AI-Generated Blueprint ───────────────────────────────────────────
    blueprint: {
      behavioralRiskProfile:  { type: String },              // AI-generated paragraph
      quarterlyDirection:     { type: String },              // AI-generated paragraph
      keyInsight:             { type: String },              // AI-generated 1-liner
      synthesizedAt:          { type: Date },
    },
    // ─── Time Constraints ─────────────────────────────────────────────────
    timeConstraints: {
      availableHoursPerDay: { type: Number, min: 0.5, max: 16 },
      workHoursStart:       { type: String },                // "09:00"
      workHoursEnd:         { type: String },                // "18:00"
      sleepHours:           { type: Number, min: 4, max: 12 },
      focusWindowStart:     { type: String },                // "06:00"
      focusWindowEnd:       { type: String },                // "08:00"
      fixedCommitments:     [{ type: String }],
    },
    // ─── Risk Profile (calculated from 6-question assessment) ─────────────
    riskProfile: {
      stabilityScore:      { type: Number, min: 0, max: 100 },
      procrastinationIndex:{ type: Number, min: 0, max: 100 },
      driftProbability:    { type: Number, min: 0, max: 1 },
      rawAnswers:          [{ type: Number, min: 1, max: 5 }], // 6 answers stored
    },
    // ─── Priority Focus ───────────────────────────────────────────────────
    priorityPillars: {
      type:     [{ type: String }],
      validate: { validator: v => v.length <= 3, message: 'Maximum 3 priority pillars' },
    },
    // ─── Avatar Preferences ───────────────────────────────────────────────
    avatarPreferences: {
      genderPresentation: { type: String, enum: ['masculine', 'feminine', 'neutral'] },
      skinTone:           { type: String },                  // hex or preset name
      clothingStyle:      { type: String, enum: ['professional', 'casual', 'athletic', 'minimal'] },
      environmentTheme:   { type: String, enum: ['office', 'outdoor', 'minimal', 'luxury'] },
    },
    // ─── Onboarding State ─────────────────────────────────────────────────
    onboardingSteps: {
      currentIdentityDone: { type: Boolean, default: false },
      futureIdentityDone:  { type: Boolean, default: false },
      constraintsDone:     { type: Boolean, default: false },
      riskAssessmentDone:  { type: Boolean, default: false },
      pillarsSelected:     { type: Boolean, default: false },
      synthesized:         { type: Boolean, default: false },
      avatarCreated:       { type: Boolean, default: false },
    },
    // ─── Baseline Score ───────────────────────────────────────────────────
    baselineAlignmentScore: { type: Number, min: 0, max: 100, default: 50 },
  },
  { timestamps: true }
);

identityProfileSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('IdentityProfile', identityProfileSchema);
```

### 9.3 Plan Model — `src/models/Plan.js`

```javascript
const mongoose = require('mongoose');
const { PLAN_LIMITS } = require('../config/constants');

const taskSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true, maxlength: 200 },
  description:   { type: String, trim: true, maxlength: 500 },
  weight:        { type: Number, required: true },             // 3=core, 1=support, 1.5=habit
  estimatedMins: { type: Number, min: 5, max: 480 },          // up to 8 hours
  completed:     { type: Boolean, default: false },
  isCore:        { type: Boolean, default: false },
  isHabit:       { type: Boolean, default: false },
}, { _id: true });

const weeklySprintSchema = new mongoose.Schema({
  weekStartDate:    { type: Date, required: true },            // Monday midnight UTC
  weekEndDate:      { type: Date, required: true },            // Sunday 23:59 UTC
  coreActions:      {
    type: [taskSchema],
    validate: { validator: v => v.length <= PLAN_LIMITS.MAX_CORE_ACTIONS, message: 'Max 3 core actions' },
  },
  supportingActions:{
    type: [taskSchema],
    validate: { validator: v => v.length <= PLAN_LIMITS.MAX_SUPPORT_ACTIONS, message: 'Max 2 supporting actions' },
  },
  identityHabit:    taskSchema,
  extraTasks:       [taskSchema],                             // User-added, weight=0 (non-scoring)
  rerollCount:      { type: Number, default: 0, max: 3 },
  generatedByAI:    { type: Boolean, default: true },
  adaptiveLevel:    { type: Number, default: 1, min: 1, max: 5 },
}, { _id: true });

const planSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // ─── Quarter Plan ─────────────────────────────────────────────────────
    quarterTheme:     { type: String, trim: true },
    quarterStartDate: { type: Date },
    quarterEndDate:   { type: Date },
    macroObjectives:  {
      type:     [{ type: String, trim: true }],
      validate: { validator: v => v.length <= 3, message: 'Max 3 macro objectives' },
    },
    successMetrics:   [{ type: String, trim: true }],
    // ─── Monthly Plan ─────────────────────────────────────────────────────
    monthlyPlans: [{
      month:         { type: Date },                          // First day of the month
      objectives:    {
        type:     [{ type: String, trim: true }],
        validate: { validator: v => v.length <= 3, message: 'Max 3 monthly objectives' },
      },
      measurableTargets: [{ type: String }],
    }],
    // ─── Weekly Sprints ───────────────────────────────────────────────────
    weeklySprints:    [weeklySprintSchema],
    // ─── Metadata ─────────────────────────────────────────────────────────
    isActive:   { type: Boolean, default: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

planSchema.index({ userId: 1 });
planSchema.index({ userId: 1, isActive: 1 });
planSchema.index({ 'weeklySprints.weekStartDate': -1 });

module.exports = mongoose.model('Plan', planSchema);
```

### 9.4 DailyExecutionLog Model — `src/models/DailyExecutionLog.js`

```javascript
const mongoose = require('mongoose');

const completedTaskSchema = new mongoose.Schema({
  taskId:        { type: mongoose.Schema.Types.ObjectId },    // ref to Plan sprint task
  taskName:      { type: String, required: true },
  weight:        { type: Number, required: true },
  isCore:        { type: Boolean, default: false },
  isHabit:       { type: Boolean, default: false },
  completed:     { type: Boolean, default: false },
  effortScore:   { type: Number, min: 1, max: 10 },          // User-rated effort
  completedAt:   { type: Date },
}, { _id: false });

const dailyExecutionLogSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:      { type: Date, required: true },               // Normalized: UTC midnight of LOCAL day
    // ─── Task Completion ──────────────────────────────────────────────────
    tasks:              [completedTaskSchema],
    identityHabitDone:  { type: Boolean, default: false },
    deepWorkMinutes:    { type: Number, default: 0, min: 0 },
    // ─── Intent (Morning Ritual) ──────────────────────────────────────────
    intentDeclared:     { type: Boolean, default: false },
    intentDeclaredAt:   { type: Date },
    voiceCommitmentUrl: { type: String },                    // S3 URL of morning voice commit
    // ─── Computed Fields (filled by Execution Service) ────────────────────
    coreCompletionPct:    { type: Number, min: 0, max: 100, default: 0 },
    supportCompletionPct: { type: Number, min: 0, max: 100, default: 0 },
    averageEffort:        { type: Number, min: 0, max: 10 },
    isMissedDay:          { type: Boolean, default: false },  // true = app ghosted (auto-penalized)
  },
  { timestamps: true }
);

// Compound unique — one log per user per UTC day
dailyExecutionLogSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyExecutionLogSchema.index({ userId: 1, date: -1 });
dailyExecutionLogSchema.index({ date: -1 });                 // For sweep job to find all users for a date

module.exports = mongoose.model('DailyExecutionLog', dailyExecutionLogSchema);
```

### 9.5 AlignmentMetric Model — `src/models/AlignmentMetric.js`

```javascript
const mongoose = require('mongoose');

const alignmentMetricSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:      { type: Date, required: true },               // UTC midnight of LOCAL day (same as DailyExecutionLog)
    // ─── Core Scores ──────────────────────────────────────────────────────
    alignmentScore:  { type: Number, min: 0, max: 100, required: true },
    rawScore:        { type: Number, min: 0, max: 100 },    // Before streak multiplier
    streakMultiplier:{ type: Number, default: 1 },
    // ─── Drift ────────────────────────────────────────────────────────────
    driftIndex:       { type: Number, min: -1, max: 1, default: 0 },
    sevenDayAverage:  { type: Number, min: 0, max: 100 },
    // ─── Streak ───────────────────────────────────────────────────────────
    streakCount:     { type: Number, default: 0 },
    // ─── Avatar State ─────────────────────────────────────────────────────
    stateLevel:      { type: Number, enum: [1, 2, 3], default: 2 },
    // ─── Pattern Flags ────────────────────────────────────────────────────
    patternFlags:    [{ type: String }],                     // e.g. ["MIDWEEK_DRIFT", "EFFORT_INFLATION"]
    // ─── Score Components (for debugging/analytics) ───────────────────────
    components: {
      coreCompletion:    { type: Number },
      supportCompletion: { type: Number },
      habitCompletion:   { type: Number },
      effortNormalized:  { type: Number },
      reflectionQuality: { type: Number },
    },
  },
  { timestamps: true }
);

alignmentMetricSchema.index({ userId: 1, date: 1 }, { unique: true });
alignmentMetricSchema.index({ userId: 1, date: -1 });
alignmentMetricSchema.index({ alignmentScore: -1 });

module.exports = mongoose.model('AlignmentMetric', alignmentMetricSchema);
```

### 9.6 JournalEntry Model — `src/models/JournalEntry.js`

```javascript
const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:      { type: Date, required: true },
    // ─── User Input ───────────────────────────────────────────────────────
    reflectionText:  { type: String, trim: true, minlength: 10, maxlength: 5000 },
    voiceUrl:        { type: String },                       // S3 URL if voice reflection
    inputMode:       { type: String, enum: ['text', 'voice'], default: 'text' },
    wordCount:       { type: Number, default: 0 },
    // ─── AI Processing Output ─────────────────────────────────────────────
    aiFeedback:      { type: String },                       // AI-generated response
    aiTone:          { type: String, enum: ['encouraging', 'firm', 'neutral', 'strategic'] },
    aiAudioUrl:      { type: String },                       // S3 URL of TTS response (premium)
    // ─── Scoring ──────────────────────────────────────────────────────────
    reflectionQualityScore: { type: Number, min: 0, max: 100, default: 0 },
    baselineScore:          { type: Number, min: 0, max: 100 },   // Before AI adjustment
    alignmentDelta:         { type: Number, default: 0 },          // Score change after reflection
    // ─── AI Analysis Flags ────────────────────────────────────────────────
    analysisFlags: {
      hasAccountability:   { type: Boolean },
      hasExcuses:          { type: Boolean },
      hasGrowthMindset:    { type: Boolean },
      specificity:         { type: Number, min: 0, max: 10 },
    },
    // ─── Metadata ─────────────────────────────────────────────────────────
    tags:           [{ type: String, enum: ['win', 'failure', 'insight', 'focus', 'energy', 'gratitude'] }],
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

journalEntrySchema.index({ userId: 1, date: -1 });
journalEntrySchema.index({ tags: 1 });
journalEntrySchema.index({ userId: 1, processingStatus: 1 });
// Full-text search index for search feature
journalEntrySchema.index({ reflectionText: 'text' });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
```

### 9.7 WeeklyReview Model — `src/models/WeeklyReview.js`

```javascript
const mongoose = require('mongoose');

const weeklyReviewSchema = new mongoose.Schema(
  {
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekStartDate: { type: Date, required: true },
    weekEndDate:   { type: Date, required: true },
    // ─── Aggregated Metrics ───────────────────────────────────────────────
    averageAlignmentScore: { type: Number },
    bestDay:               { type: Date },
    bestDayScore:          { type: Number },
    weakestDay:            { type: Date },
    weakestDayScore:       { type: Number },
    totalDeepWorkMins:     { type: Number, default: 0 },
    habitConsistencyPct:   { type: Number },
    taskCompletionPct:     { type: Number },
    // ─── AI Summary ───────────────────────────────────────────────────────
    progressCard:          { type: String },                 // AI-generated paragraph
    behavioralInsight:     { type: String },                 // AI-generated insight
    driftTrend:            { type: String, enum: ['improving', 'stable', 'declining'] },
    patternsSeen:          [{ type: String }],
    // ─── State ────────────────────────────────────────────────────────────
    generatedAt:   { type: Date },
  },
  { timestamps: true }
);

weeklyReviewSchema.index({ userId: 1, weekStartDate: -1 });

module.exports = mongoose.model('WeeklyReview', weeklyReviewSchema);
```

---

## 10. INTER-SERVICE PAYLOAD CONTRACTS

> These are the exact data shapes passed between services. Use JSDoc in all service files.

```javascript
// src/types/contracts.js
// (JSDoc only — not runtime code. Import these types in service files for IDE support)

/**
 * @typedef {Object} AlignmentInput
 * @property {string}           userId
 * @property {string}           date           - UTC midnight ISO string
 * @property {DailyExecSummary} executionLog
 * @property {MetricHistory[]}  previousMetrics - Last 7 AlignmentMetric documents
 * @property {number}           reflectionQuality - 0-100 (0 if no reflection yet)
 */

/**
 * @typedef {Object} DailyExecSummary
 * @property {number} coreTasksTotal
 * @property {number} coreTasksDone
 * @property {number} supportTasksTotal
 * @property {number} supportTasksDone
 * @property {boolean} habitDone
 * @property {number} averageEffort        - 1-10
 * @property {boolean} isMissedDay
 */

/**
 * @typedef {Object} AlignmentOutput
 * @property {number}   rawScore           - Before streak multiplier
 * @property {number}   alignmentScore     - Final score (0-100), after multiplier, capped
 * @property {number}   streakMultiplier   - 1.0, 1.05, or 1.10
 * @property {number}   streakCount        - Consecutive days score > 50
 * @property {number}   driftIndex         - -1.0 to 1.0
 * @property {number}   sevenDayAverage    - Rolling average
 * @property {number}   stateLevel         - 1, 2, or 3
 * @property {string[]} patternFlags       - Detected behavioral patterns
 * @property {ScoreComponents} components
 */

/**
 * @typedef {Object} ScoreComponents
 * @property {number} coreCompletion      - 0-100%
 * @property {number} supportCompletion   - 0-100%
 * @property {number} habitCompletion     - 0 or 100
 * @property {number} effortNormalized    - 0-100 (effort 1-10 mapped)
 * @property {number} reflectionQuality   - 0-100
 */

/**
 * @typedef {Object} AIReflectionResult
 * @property {string} aiFeedback          - The AI response text shown to user
 * @property {string} tone                - "encouraging" | "firm" | "neutral" | "strategic"
 * @property {number} qualityScore        - 0-100 (AI-adjusted from baseline)
 * @property {number} alignmentDelta      - Suggested score delta (-5 to +5)
 * @property {AnalysisFlags} flags
 */

/**
 * @typedef {Object} AnalysisFlags
 * @property {boolean} hasAccountability
 * @property {boolean} hasExcuses
 * @property {boolean} hasGrowthMindset
 * @property {number}  specificity        - 0-10
 */

/**
 * @typedef {Object} ShortTermMemory
 * @property {string} identityDeclaration
 * @property {string} riskSummary
 * @property {MetricSnapshot[]} last7Days  - Compact metric objects
 * @property {string} currentWeekFocus     - Week's theme/objectives
 */
```

---

## 11. ALIGNMENT SCORING ENGINE — THE EXACT MATH

> **CRITICAL:** This section defines the one true algorithm. Implement exactly as written.  
> File: `src/services/alignment/score.service.js`

### Step 1 — Calculate Raw Score

```javascript
/**
 * Calculate raw daily alignment score (0-100) BEFORE streak multiplier.
 * 
 * @param {DailyExecSummary} exec
 * @param {number} reflectionQuality - 0-100
 * @returns {number} rawScore (0-100, may need capping)
 */
function calculateRawScore(exec, reflectionQuality = 0) {
  // ── Core Task Completion: 50% weight ───────────────────────────────────
  const coreCompletion    = exec.coreTasksTotal > 0
    ? (exec.coreTasksDone / exec.coreTasksTotal) * 100
    : 0;  // If no core tasks exist, 0 (shouldn't happen — always 3 core tasks)

  // ── Supporting Task Completion: 20% weight ─────────────────────────────
  const supportCompletion = exec.supportTasksTotal > 0
    ? (exec.supportTasksDone / exec.supportTasksTotal) * 100
    : 0;

  // ── Habit Completion: 15% weight ───────────────────────────────────────
  const habitCompletion   = exec.habitDone ? 100 : 0;

  // ── Effort Normalized: 10% weight ─────────────────────────────────────
  // Effort is 1-10, normalize to 0-100
  const effortNormalized  = exec.isMissedDay
    ? 0
    : Math.max(0, ((exec.averageEffort - 1) / 9) * 100);

  // ── Reflection Quality: 5% weight ─────────────────────────────────────
  // Passed in from journal service (baseline or AI-updated)

  // ── Weighted Formula ───────────────────────────────────────────────────
  const rawScore =
    (coreCompletion    * 0.50) +   // max 50 pts
    (supportCompletion * 0.20) +   // max 20 pts
    (habitCompletion   * 0.15) +   // max 15 pts
    (effortNormalized  * 0.10) +   // max 10 pts
    (reflectionQuality * 0.05);    // max  5 pts
    // ─────────────────────────────────────
    // TOTAL MAX:               100 pts ✓

  return {
    rawScore: Math.min(100, Math.max(0, Math.round(rawScore * 100) / 100)),
    components: { coreCompletion, supportCompletion, habitCompletion, effortNormalized, reflectionQuality }
  };
}
```

### Step 2 — Apply Streak Multiplier

```javascript
/**
 * Determine streak count and multiplier.
 * 
 * @param {number} rawScore - Today's raw score
 * @param {AlignmentMetric[]} previousMetrics - Sorted newest-first
 * @returns {{ streakCount: number, multiplier: number }}
 */
function calculateStreak(rawScore, previousMetrics = []) {
  const yesterday = previousMetrics[0];
  const prevStreak = yesterday ? yesterday.streakCount : 0;
  const prevScore  = yesterday ? yesterday.alignmentScore : 0;

  let streakCount;
  if (prevScore >= ALIGNMENT.STREAK_BREAK_SCORE) {
    streakCount = prevStreak + 1;
  } else {
    streakCount = 0;   // Streak broken — reset
  }

  let multiplier = 1.0;
  if (streakCount > ALIGNMENT.STREAK_THRESHOLD_HIGH) {
    multiplier = ALIGNMENT.MULTIPLIER_HIGH;  // 1.10
  } else if (streakCount > ALIGNMENT.STREAK_THRESHOLD_LOW) {
    multiplier = ALIGNMENT.MULTIPLIER_LOW;   // 1.05
  }

  return { streakCount, multiplier };
}

/**
 * Apply multiplier and cap at 100.
 */
function applyMultiplier(rawScore, multiplier) {
  return Math.min(100, Math.round(rawScore * multiplier * 100) / 100);
}
```

### Step 3 — Calculate Drift Index

```javascript
/**
 * Calculate 7-day moving average and drift index.
 * 
 * @param {number} todayScore - Final alignment score (after multiplier)
 * @param {AlignmentMetric[]} previousMetrics - Up to 7 most recent, sorted newest-first
 * @returns {{ driftIndex: number, sevenDayAverage: number }}
 */
function calculateDrift(todayScore, previousMetrics = []) {
  // Build rolling window (last 7 days including today)
  const window = [todayScore, ...previousMetrics.slice(0, 6).map(m => m.alignmentScore)];
  const sevenDayAverage = window.reduce((sum, s) => sum + s, 0) / window.length;

  // Drift formula: (today - avg) / avg
  // Positive = trending up, negative = drifting down
  const driftIndex = sevenDayAverage === 0
    ? 0
    : (todayScore - sevenDayAverage) / sevenDayAverage;

  // Clamp to [-1.0, +1.0]
  const clampedDrift = Math.min(1.0, Math.max(-1.0, Math.round(driftIndex * 1000) / 1000));

  return { driftIndex: clampedDrift, sevenDayAverage: Math.round(sevenDayAverage * 100) / 100 };
}
```

### Step 4 — Determine Avatar State Level

```javascript
/**
 * Map alignment metrics to avatar state.
 * 
 * State 1 (DIMINISHED): 7-day avg < 45 OR drift < -0.4 for 3+ consecutive days
 * State 2 (STABLE):     Default — 7-day avg between 45 and 75
 * State 3 (ALIGNED):    7-day avg > 75 AND drift >= 0
 * 
 * NOTE: State changes DOWN immediately. State changes UP require 2+ days consistency.
 */
function determineStateLevel(sevenDayAverage, driftIndex, previousMetrics = []) {
  // Check for sustained danger drift (3+ consecutive days below danger threshold)
  const recentDrift = [driftIndex, ...previousMetrics.slice(0, 2).map(m => m.driftIndex)];
  const sustainedDanger = recentDrift.every(d => d < ALIGNMENT.DRIFT_DANGER);

  if (sevenDayAverage < ALIGNMENT.STATE_STABLE_MIN || sustainedDanger) {
    return AVATAR_LEVELS.DIMINISHED;  // 1
  }

  if (sevenDayAverage > ALIGNMENT.STATE_ALIGNED_MIN && driftIndex >= 0) {
    // Check consistency — require 2 previous days also at this level
    const prevLevels = previousMetrics.slice(0, 2).map(m => m.stateLevel);
    if (prevLevels.every(l => l >= AVATAR_LEVELS.ALIGNED)) {
      return AVATAR_LEVELS.ALIGNED;   // 3
    }
    return AVATAR_LEVELS.STABLE;      // 2 (approaching aligned)
  }

  return AVATAR_LEVELS.STABLE;        // 2
}
```

### Step 5 — Missed Day Penalty

```javascript
/**
 * Applied by the midnight sweep when a user doesn't log any data.
 * Creates a DailyExecutionLog with isMissedDay=true and calculates
 * score with 10% deduction applied to the 7-day average.
 * This is handled in the sweep job — NOT in the normal recalc flow.
 */
function calculateMissedDayScore(previousMetrics = []) {
  if (previousMetrics.length === 0) return 0;
  const lastScore = previousMetrics[0].alignmentScore;
  const penalty   = lastScore * ALIGNMENT.MISSED_DAY_PENALTY;  // 10% of last score
  return Math.max(0, Math.round(lastScore - penalty));
}
```

---

## 12. AVATAR STATE CONFIG (COMPLETE)

> **File:** `src/config/avatar-states.js`  
> The mobile app reads this JSON to render the avatar visual state.

```javascript
// src/config/avatar-states.js

const AVATAR_STATES = {
  1: {
    name:        'Diminished',
    description: 'You are drifting from your identity. Time to realign.',
    visual: {
      posture:        'slumped',
      lighting:       'dim',
      lightingColor:  '#4A4A6A',
      aura:           'none',
      auraIntensity:  0,
      environment:    'grey',
      environmentHue: '#2C2C3E',
      animation:      'static',
      breathingRate:  0,
      shadowIntensity: 0.8,
    },
    tone: 'firm',
    message: 'Your future self is waiting. Come back.',
  },
  2: {
    name:        'Stable',
    description: 'You are maintaining alignment. Keep building.',
    visual: {
      posture:        'neutral',
      lighting:       'warm',
      lightingColor:  '#E8C87A',
      aura:           'faint',
      auraIntensity:  0.3,
      auraColor:      '#A0A8FF',
      environment:    'normal',
      environmentHue: '#3A3A5E',
      animation:      'breathing',
      breathingRate:  0.5,
      shadowIntensity: 0.4,
    },
    tone: 'neutral',
    message: 'Consistency compounds. Stay the course.',
  },
  3: {
    name:        'Aligned',
    description: 'You are becoming who you said you would be.',
    visual: {
      posture:        'upright',
      lighting:       'bright',
      lightingColor:  '#FFD700',
      aura:           'glow',
      auraIntensity:  1.0,
      auraColor:      '#6B8EFF',
      environment:    'elevated',
      environmentHue: '#1A1A3E',
      animation:      'pulse',
      breathingRate:  1.0,
      shadowIntensity: 0.1,
    },
    tone: 'encouraging',
    message: 'This is who you are becoming. Don\'t stop.',
  },
};

module.exports = AVATAR_STATES;
```

---

## 13. REFLECTION QUALITY SCORING ALGORITHM

> **File:** `src/services/reflection/quality.service.js`

```javascript
const { REFLECTION_QUALITY } = require('../../config/constants');

/**
 * Calculate baseline reflection quality score BEFORE AI processing.
 * AI will receive this baseline and adjust it up or down by up to ±20 points.
 * 
 * Baseline bands (by word count):
 *   < 50 words   → 20  (too brief — just tapping done)
 *   50-100 words → 40  (minimal effort)
 *   100-200 words→ 60  (decent reflection)
 *   200-300 words→ 75  (good reflection)
 *   > 300 words  → 85  (thorough reflection)
 * 
 * Additional modifiers (applied to baseline):
 *   + 5 if submitted before 10PM local time (not last minute)
 *   - 5 if text is repetitive (same phrases copied from previous day)
 * 
 * @param {string} text
 * @param {Date}   submittedAt
 * @returns {{ baselineScore: number, wordCount: number }}
 */
function calculateBaselineQuality(text, submittedAt = new Date()) {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  let baselineScore;
  if      (wordCount < 50)  baselineScore = 20;
  else if (wordCount < 100) baselineScore = 40;
  else if (wordCount < 200) baselineScore = 60;
  else if (wordCount < 300) baselineScore = 75;
  else                      baselineScore = 85;

  // Time bonus: +5 if submitted before 10PM (22:00) local time
  const hour = submittedAt.getHours();
  if (hour < 22) baselineScore = Math.min(95, baselineScore + 5);

  return {
    baselineScore: Math.min(100, Math.max(0, baselineScore)),
    wordCount,
  };
}

/**
 * The AI will return a `qualityScore` (0-100).
 * We accept the AI score if it's within ±20 of the baseline.
 * Otherwise, we clamp it to prevent AI hallucinating extreme scores.
 */
function validateAIQualityScore(aiScore, baselineScore) {
  const min = Math.max(0,   baselineScore - 20);
  const max = Math.min(100, baselineScore + 20);
  return Math.min(max, Math.max(min, aiScore));
}

module.exports = { calculateBaselineQuality, validateAIQualityScore };
```

---

## 14. PATTERN DETECTION ALGORITHMS

> **File:** `src/services/alignment/pattern.service.js`

```javascript
const { PATTERNS } = require('../../config/constants');

/**
 * Run all pattern detectors. Returns array of active pattern flag strings.
 * 
 * @param {AlignmentMetric[]} last30Days - Metrics sorted newest-first
 * @param {DailyExecutionLog[]} last30Logs - Logs sorted newest-first
 * @returns {string[]} patternFlags
 */
function detectPatterns(last30Days, last30Logs) {
  const flags = [];

  if (detectMidweekDrift(last30Days))   flags.push('MIDWEEK_DRIFT');
  if (detectEffortInflation(last30Logs)) flags.push('EFFORT_INFLATION');
  if (detectOvercommitment(last30Logs))  flags.push('OVERCOMMITMENT');
  if (detectStreakBreak(last30Days))     flags.push('STREAK_BREAK');

  return flags;
}

/**
 * MIDWEEK DRIFT: Wednesday score is 15+ points lower than Monday,
 * AND this has happened in 3 of the last 4 weeks.
 */
function detectMidweekDrift(metrics) {
  // Group by week, find Mon/Wed pairs
  const weeklyPairs = [];
  for (let i = 0; i < metrics.length; i++) {
    const m = metrics[i];
    const dayOfWeek = new Date(m.date).getDay();  // 0=Sun, 1=Mon, 3=Wed
    if (dayOfWeek === 3) {  // Wednesday
      // Find the Monday of this week
      const monday = metrics.find(x => {
        const d = new Date(x.date);
        const sameWeek = Math.abs(d - new Date(m.date)) < 3 * 86400000;
        return d.getDay() === 1 && sameWeek;
      });
      if (monday) {
        weeklyPairs.push({
          monScore: monday.alignmentScore,
          wedScore: m.alignmentScore,
          drop: monday.alignmentScore - m.alignmentScore,
        });
      }
    }
    if (weeklyPairs.length >= 4) break;
  }

  if (weeklyPairs.length < PATTERNS.MIDWEEK_DRIFT.WEEKS_REQUIRED) return false;

  const drifting = weeklyPairs.filter(p => p.drop >= PATTERNS.MIDWEEK_DRIFT.DROP_THRESHOLD);
  return drifting.length >= PATTERNS.MIDWEEK_DRIFT.WEEKS_REQUIRED;
}

/**
 * EFFORT INFLATION: User rates effort >= 8 but completes < 50% of tasks,
 * in 3 of the last 7 days.
 */
function detectEffortInflation(logs) {
  const last7 = logs.slice(0, 7);
  const inflated = last7.filter(log =>
    log.averageEffort >= PATTERNS.EFFORT_INFLATION.EFFORT_MIN &&
    log.coreCompletionPct < PATTERNS.EFFORT_INFLATION.COMPLETION_MAX
  );
  return inflated.length >= PATTERNS.EFFORT_INFLATION.DAYS_REQUIRED;
}

/**
 * OVERCOMMITMENT: Average task completion < 40% for 5 of the last 7 days.
 */
function detectOvercommitment(logs) {
  const last7 = logs.slice(0, 7);
  const low = last7.filter(log => log.coreCompletionPct < PATTERNS.OVERCOMMIT.COMPLETION_MAX);
  return low.length >= PATTERNS.OVERCOMMIT.DAYS_REQUIRED;
}

/**
 * STREAK BREAK: Streak dropped from > 7 to 0 within the last 3 days.
 */
function detectStreakBreak(metrics) {
  const last3 = metrics.slice(0, 3);
  if (last3.length < 2) return false;
  const justBroke = last3[0].streakCount === 0 && last3[1].streakCount > 7;
  return justBroke;
}

module.exports = { detectPatterns };
```

---

## 15. AI PROMPT TEMPLATES

> **Critical:** These prompts must enforce JSON output. Use `response_format: { type: "json_object" }` in all OpenAI calls.

### 15.1 Identity Synthesis Prompt

```javascript
// src/services/ai/prompts/synthesis.prompt.js

const buildSynthesisPrompt = (identity) => ({
  system: `You are a behavioral identity coach. Your job is to analyze a person's current and future identity data and return a precise JSON object.

CRITICAL RULES:
- Respond ONLY with valid JSON. No markdown, no explanations outside the JSON.
- Be honest and direct — avoid generic motivational language.
- The behavioralRiskProfile should mention specific patterns from their weaknesses and risk answers.
- The quarterlyDirection should be actionable, not vague.

Required JSON structure:
{
  "behavioralRiskProfile": "string (2-3 sentences describing their main execution risks based on their data)",
  "quarterlyDirection": "string (2-3 sentences describing the most important focus for the next 90 days)",
  "keyInsight": "string (1 powerful sentence that captures their identity gap)",
  "suggestedDeclaration": "string (a first-person identity statement, e.g. 'I am becoming a founder who executes with discipline every day')"
}`,

  user: `Analyze this person's identity data and return the JSON object:

CURRENT IDENTITY:
- Role: ${identity.currentIdentity.role}
- Energy Level: ${identity.currentIdentity.energyLevel}/10
- Main Execution Gap: ${identity.currentIdentity.executionGap}
- Gap Severity: ${identity.currentIdentity.executionGapSeverity}/5
- Strengths: ${identity.currentIdentity.strengths?.join(', ')}
- Weaknesses: ${identity.currentIdentity.weaknesses?.join(', ')}
- Frustration: ${identity.currentIdentity.frustrationPoint}

FUTURE IDENTITY:
- Desired Role: ${identity.futureIdentity.desiredRole}
- Income Target: ${identity.futureIdentity.incomeRange}
- Skill Goals: ${identity.futureIdentity.skillGoals?.join(', ')}
- Lifestyle Vision: ${identity.futureIdentity.lifestyleVision}

RISK PROFILE:
- Stability Score: ${identity.riskProfile.stabilityScore}/100
- Procrastination Index: ${identity.riskProfile.procrastinationIndex}/100
- Drift Probability: ${Math.round(identity.riskProfile.driftProbability * 100)}%

PRIORITY FOCUS: ${identity.priorityPillars?.join(', ')}

Return the JSON analysis now.`,
});

module.exports = { buildSynthesisPrompt };
```

### 15.2 Evening Reflection Analysis Prompt

```javascript
// src/services/ai/prompts/reflection.prompt.js

const buildReflectionPrompt = (memory, reflectionText, todayStats) => ({
  system: `You are the user's future self — the person they are trying to become. You provide brutally honest, specific feedback on their daily reflection. You care about them enough to not sugarcoat.

TONE GUIDE:
- "encouraging" → If they had a strong day (completion > 70%) and showed self-awareness
- "firm" → If they made excuses or had low completion (< 40%) without acknowledging it
- "strategic" → If they completed tasks but reflection lacks depth or next steps
- "neutral" → For average days (40-70%) with decent self-awareness

CRITICAL RULES:
- Respond ONLY with valid JSON. No markdown.
- Reference their specific identity declaration in the feedback.
- If they made excuses, call it out directly but constructively.
- Keep aiFeedback to 3-5 sentences max.
- alignmentDelta range: -5 to +5 (add if reflection shows growth, subtract if pure excuse-making)

Required JSON:
{
  "aiFeedback": "string (3-5 sentences, second person, direct)",
  "tone": "encouraging | firm | strategic | neutral",
  "qualityScore": number (0-100, how much this reflection showed genuine self-awareness),
  "alignmentDelta": number (-5 to +5),
  "flags": {
    "hasAccountability": boolean,
    "hasExcuses": boolean,
    "hasGrowthMindset": boolean,
    "specificity": number (0-10)
  }
}`,

  user: `USER CONTEXT:
Identity Declaration: "${memory.identityDeclaration}"
Risk Profile Summary: ${memory.riskSummary}
Last 7 Days Avg Score: ${memory.last7Days.reduce((s, m) => s + m.alignmentScore, 0) / memory.last7Days.length}

TODAY'S PERFORMANCE:
Core Task Completion: ${todayStats.coreCompletionPct}%
Support Task Completion: ${todayStats.supportCompletionPct}%
Identity Habit: ${todayStats.habitDone ? 'Done' : 'Missed'}
Deep Work: ${todayStats.deepWorkMinutes} minutes
Effort Self-Rating: ${todayStats.averageEffort}/10

TODAY'S REFLECTION (written by user):
"${reflectionText}"

Analyze this reflection and return the JSON response now.`,
});

module.exports = { buildReflectionPrompt };
```

### 15.3 90-Day Plan Generation Prompt

```javascript
// src/services/ai/prompts/planning.prompt.js

const buildPlanningPrompt = (identity, constraints) => ({
  system: `You are a strategic planning assistant. Generate a focused 90-day plan based on identity data.

CRITICAL RULES:
- Respond ONLY with valid JSON.
- Maximum 3 macro objectives.
- Objectives must map DIRECTLY to the provided priority pillars.
- Be specific and measurable — not vague.
- The quarter theme should be a short, powerful phrase (5-8 words max).

Required JSON:
{
  "quarterTheme": "string (5-8 word inspiring theme)",
  "macroObjectives": [
    {
      "title": "string",
      "pillar": "string (which priority pillar this maps to)",
      "successMetric": "string (how they will know they achieved this)",
      "monthlyBreakdown": ["string (month 1 focus)", "string (month 2)", "string (month 3)"]
    }
  ]
}`,

  user: `Generate a 90-day plan for this person:

FUTURE IDENTITY: ${identity.futureIdentity.desiredRole}
DECLARATION: "${identity.futureIdentity.declarationSentence}"
PRIORITY PILLARS: ${identity.priorityPillars.join(', ')}
AVAILABLE HOURS/DAY: ${constraints.availableHoursPerDay}
CURRENT SKILLS TO BUILD: ${identity.futureIdentity.skillGoals?.join(', ')}
RISK PROFILE: Drift probability ${Math.round(identity.riskProfile.driftProbability * 100)}%

Return the JSON plan now.`,
});

module.exports = { buildPlanningPrompt };
```

### 15.4 Weekly Review Summary Prompt

```javascript
// src/services/ai/prompts/review.prompt.js

const buildWeeklyReviewPrompt = (weekData, memory) => ({
  system: `You generate weekly identity progress reports. Be honest, specific, and forward-looking.

Required JSON:
{
  "progressCard": "string (3-4 sentences summarizing the week — specific to their data)",
  "behavioralInsight": "string (1 key pattern observed this week)",
  "driftTrend": "improving | stable | declining",
  "recommendation": "string (1 specific action for next week)"
}`,

  user: `Weekly data for review:
Identity Declaration: "${memory.identityDeclaration}"
Week Avg Score: ${weekData.averageScore}
Best Day: ${weekData.bestDayScore} (${weekData.bestDayName})
Worst Day: ${weekData.worstDayScore} (${weekData.worstDayName})
Habit Consistency: ${weekData.habitConsistencyPct}%
Deep Work Total: ${weekData.totalDeepWorkMins} minutes
Patterns Detected: ${weekData.patterns.join(', ') || 'none'}
Journal Highlights: ${weekData.journalSummary}

Generate the weekly review JSON now.`,
});

module.exports = { buildWeeklyReviewPrompt };
```

---

## 16. COMPLETE API ENDPOINT SPECIFICATION

> All routes, methods, auth requirements, request/response shapes.

### Authentication Header
```
Authorization: Bearer <accessToken>
```

### Base URL
```
/api/v1
```

---

### 16.1 Auth Routes — `/api/v1/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | None | Register with email+password |
| POST | `/auth/login` | None | Login, get tokens |
| POST | `/auth/google` | None | OAuth via Google |
| POST | `/auth/apple` | None | OAuth via Apple |
| GET | `/auth/me` | Required | Get current user profile |
| PATCH | `/auth/me` | Required | Update timezone, notif prefs |
| POST | `/auth/refresh` | None (refresh token in body) | Get new access token |
| POST | `/auth/logout` | Required | Invalidate refresh token |
| POST | `/auth/logout-all` | Required | Invalidate all sessions |
| POST | `/auth/forgot` | None | Request password reset email |
| POST | `/auth/reset` | None | Apply new password |
| DELETE | `/auth/account` | Required | Delete account (GDPR) |

**POST /auth/register — Request Body:**
```json
{ "email": "user@example.com", "password": "min8chars" }
```
**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "email": "...", "subscriptionTier": "free" },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

### 16.2 Identity Routes — `/api/v1/identity`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/identity/me` | Required | Get full identity profile |
| GET | `/identity/status` | Required | Get onboarding completion % |
| POST | `/identity/current` | Required | Save current identity data |
| POST | `/identity/future` | Required | Save future identity data |
| POST | `/identity/constraints` | Required | Save time constraints |
| POST | `/identity/risk` | Required | Submit 6-question risk assessment |
| POST | `/identity/pillars` | Required | Select priority pillars (max 3) |
| POST | `/identity/synthesize` | Required | Trigger AI synthesis (BLOCKING) |
| POST | `/identity/avatar-base` | Required | Save avatar aesthetic preferences |
| PATCH | `/identity/declaration` | Required | Update identity declaration sentence |
| DELETE | `/identity/reset` | Premium | Reset and restart onboarding |
| POST | `/identity/voice` | Premium | Submit voice interview audio |

**POST /identity/risk — Request Body:**
```json
{
  "answers": [3, 2, 4, 1, 5, 3]
}
```
*(6 integers, each 1–5)*

**POST /identity/synthesize — Response 200:**
```json
{
  "success": true,
  "data": {
    "behavioralRiskProfile": "...",
    "quarterlyDirection": "...",
    "keyInsight": "...",
    "suggestedDeclaration": "...",
    "baselineAlignmentScore": 58
  }
}
```

---

### 16.3 Plan Routes — `/api/v1/plan`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/plan/quarter` | Required | Generate 90-day plan (AI) |
| POST | `/plan/month` | Required | Generate current month breakdown |
| POST | `/plan/sprint` | Required | Generate current week sprint |
| GET | `/plan/current` | Required | Get full current active plan |
| GET | `/plan/today` | Required | Get today's tasks (timezone-aware) |
| GET | `/plan/history` | Required | Get archived past plans (paginated) |
| GET | `/plan/stats` | Required | Sprint stats (total tasks, hours) |
| PATCH | `/plan/sprint` | Required | Edit sprint task names |
| POST | `/plan/sprint/reroll` | Required | Regenerate current sprint (max 3/week) |
| POST | `/plan/sprint/extra` | Required | Add manual non-scoring task |
| DELETE | `/plan/sprint/extra/:taskId` | Required | Remove manual task |

---

### 16.4 Execution Routes — `/api/v1/execute`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/execute/intent` | Required | Declare morning intent |
| POST | `/execute/log` | Required | Log task completions |
| PATCH | `/execute/log` | Required | Edit today's log |
| POST | `/execute/timer` | Required | Sync deep work minutes |
| POST | `/execute/commit-voice` | Premium | Upload morning voice commitment |
| GET | `/execute/today` | Required | Get today's execution log |

**POST /execute/log — Request Body:**
```json
{
  "date": "2025-01-15",
  "tasks": [
    { "taskId": "mongo-id", "taskName": "Write 1000 words", "weight": 3, "isCore": true, "completed": true, "effortScore": 8 },
    { "taskId": "mongo-id", "taskName": "Read 30 mins", "weight": 1, "isCore": false, "completed": false, "effortScore": 0 }
  ],
  "habitDone": true,
  "deepWorkMinutes": 90
}
```

---

### 16.5 Alignment Routes — `/api/v1/alignment`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/alignment/dashboard` | Required | Current score, drift, streak |
| GET | `/alignment/trend` | Required | 30-day score trend array |
| GET | `/alignment/patterns` | Required | Detected behavioral patterns |

**GET /alignment/dashboard — Response:**
```json
{
  "success": true,
  "data": {
    "currentScore": 72,
    "driftIndex": 0.05,
    "streakCount": 8,
    "stateLevel": 2,
    "sevenDayAverage": 68,
    "patternFlags": ["MIDWEEK_DRIFT"],
    "today": { "date": "2025-01-15", "logged": true }
  }
}
```

---

### 16.6 Avatar Routes — `/api/v1/avatar`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/avatar/state` | Required | Current avatar visual config |

**GET /avatar/state — Response:**
```json
{
  "success": true,
  "data": {
    "stateLevel": 2,
    "stateName": "Stable",
    "visual": {
      "posture": "neutral",
      "lighting": "warm",
      "lightingColor": "#E8C87A",
      "aura": "faint",
      "auraIntensity": 0.3,
      "animation": "breathing"
    },
    "tone": "neutral",
    "message": "Consistency compounds. Stay the course."
  }
}
```

---

### 16.7 Reflection Routes — `/api/v1/reflect`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/reflect/evening` | Required | Submit evening reflection (→ 202) |
| POST | `/reflect/voice` | Premium | Submit voice reflection audio (→ 202) |
| GET | `/reflect/history` | Required | Paginated journal entries |
| GET | `/reflect/search` | Required | Search journal by text |
| GET | `/reflect/weekly-card` | Required | Latest weekly progress card |
| GET | `/reflect/audio/:journalId` | Premium | Get TTS audio response URL |
| GET | `/reflect/export/pdf` | Premium | Download monthly PDF report |

**POST /reflect/evening — Request Body:**
```json
{ "date": "2025-01-15", "text": "Today I..." }
```
**Response 202:**
```json
{
  "success": true,
  "message": "Reflection received. Processing in background.",
  "data": { "jobId": "bull-job-id" }
}
```

---

### 16.8 Analytics Routes — `/api/v1/analytics`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/analytics/web-dashboard` | Required | Full web dashboard data |
| GET | `/analytics/heatmap` | Required | Day-of-week execution heatmap |
| GET | `/analytics/completion-graph` | Required | Weekly completion % graph |

---

### 16.9 Voice Routes — `/api/v1/voice`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/voice/transcribe` | Required | Upload audio, get transcript |

**POST /voice/transcribe — Content-Type: multipart/form-data**
```
Field: audio (file) — supported: mp3, mp4, m4a, wav, webm, max 25MB
```

---

### 16.10 Settings Routes — `/api/v1/settings`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/settings/notifications` | Required | Update notification preferences |
| PATCH | `/settings/fcm-token` | Required | Update Firebase push token |
| GET | `/settings/subscription` | Required | Get subscription status |

---

### 16.11 Webhook Routes — `/api/v1/webhooks`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/webhooks/stripe` | Stripe Signature | Stripe billing events |
| POST | `/webhooks/razorpay` | Razorpay Signature | Razorpay billing events |

---

### 16.12 Admin Routes — `/api/v1/admin` *(admin only)*

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/admin/calibrate/:userId` | Admin | Force alignment recalculation |
| GET | `/admin/users` | Admin | List users with filters |
| GET | `/admin/metrics` | Admin | Platform-wide usage stats |

---

### 16.13 Health Route

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/health` | None | `{ status: "ok", mongo: "connected", redis: "connected" }` |

---

## 17. FOLDER STRUCTURE (COMPLETE)

```
/revup-backend
├── .env
├── .env.example
├── .env.test
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── package.json
├── package-lock.json
├── jest.config.js
├── Dockerfile
├── .dockerignore
├── docker-compose.yml
├── docker-compose.prod.yml
├── .github/
│   └── workflows/
│       └── deploy.yml
└── src/
    ├── app.js                         # Express app bootstrap (no server.listen here)
    ├── server.js                      # Starts server, connects DB/Redis
    ├── config/
    │   ├── env.js                     # Centralized env validation (Section 3)
    │   ├── db.js                      # Mongoose connection
    │   ├── redis.js                   # ioredis client
    │   ├── constants.js               # All enums and thresholds (Section 4)
    │   ├── redis-keys.js              # Redis key factory functions (Section 7)
    │   └── avatar-states.js           # Full avatar config (Section 12)
    ├── models/
    │   ├── User.js
    │   ├── IdentityProfile.js
    │   ├── Plan.js
    │   ├── DailyExecutionLog.js
    │   ├── AlignmentMetric.js
    │   ├── JournalEntry.js
    │   └── WeeklyReview.js
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── identity.controller.js
    │   ├── plan.controller.js
    │   ├── exec.controller.js
    │   ├── alignment.controller.js
    │   ├── avatar.controller.js
    │   ├── reflect.controller.js
    │   ├── analytics.controller.js
    │   ├── voice.controller.js
    │   ├── settings.controller.js
    │   ├── webhook.controller.js
    │   └── admin.controller.js
    ├── routes/
    │   ├── index.js                   # Mounts all routes
    │   ├── auth.routes.js
    │   ├── identity.routes.js
    │   ├── plan.routes.js
    │   ├── exec.routes.js
    │   ├── alignment.routes.js
    │   ├── avatar.routes.js
    │   ├── reflect.routes.js
    │   ├── analytics.routes.js
    │   ├── voice.routes.js
    │   ├── settings.routes.js
    │   ├── webhook.routes.js
    │   └── admin.routes.js
    ├── middlewares/
    │   ├── auth.mid.js                # requireAuth — JWT verify
    │   ├── role.mid.js                # requireRole(['premium'])
    │   ├── validate.mid.js            # validate(zodSchema)
    │   ├── rateLimit.mid.js           # Global + auth rate limits
    │   ├── limit.tier.mid.js          # AI usage limit for free users
    │   ├── upload.mid.js              # Multer for audio files
    │   ├── error.mid.js               # Global error handler
    │   └── feature.mid.js             # Feature flag checks
    ├── validators/
    │   ├── auth.validator.js
    │   ├── identity.validator.js
    │   ├── plan.validator.js
    │   ├── exec.validator.js
    │   └── reflect.validator.js
    ├── services/
    │   ├── auth/
    │   │   ├── auth.service.js
    │   │   ├── oauth.service.js
    │   │   └── reset.service.js
    │   ├── identity/
    │   │   ├── identity.service.js
    │   │   ├── risk.service.js        # Pure math — risk scoring
    │   │   ├── baseline.util.js       # Pure math — baseline score
    │   │   └── synthesis.service.js   # Calls AI orchestrator
    │   ├── planning/
    │   │   ├── quarter.service.js
    │   │   ├── month.service.js
    │   │   ├── sprint.service.js
    │   │   └── adaptive.service.js
    │   ├── execution/
    │   │   ├── exec.service.js
    │   │   └── timer.service.js
    │   ├── alignment/
    │   │   ├── score.service.js       # Pure math — NO AI
    │   │   ├── streak.service.js      # Pure math — NO AI
    │   │   ├── drift.service.js       # Pure math — NO AI
    │   │   ├── pattern.service.js     # Pure math — NO AI
    │   │   └── recalc.service.js      # Orchestrates math flow
    │   ├── reflection/
    │   │   ├── journal.service.js
    │   │   └── quality.service.js     # Baseline reflection scoring
    │   ├── avatar/
    │   │   └── avatar.service.js      # Maps stateLevel to config
    │   ├── analytics/
    │   │   └── dashboard.service.js   # MongoDB aggregations
    │   ├── ai/
    │   │   ├── ai.orchestrator.js     # OpenAI wrapper
    │   │   ├── memory.short.js        # Fetches compressed user context
    │   │   └── prompts/
    │   │       ├── synthesis.prompt.js
    │   │       ├── reflection.prompt.js
    │   │       ├── planning.prompt.js
    │   │       └── review.prompt.js
    │   ├── voice/
    │   │   ├── stt.service.js         # Whisper STT
    │   │   └── tts.service.js         # OpenAI TTS + S3 upload
    │   ├── email/
    │   │   ├── email.service.js
    │   │   └── templates/
    │   │       ├── reset.html
    │   │       └── welcome.html
    │   └── notifications/
    │       └── fcm.service.js
    ├── jobs/
    │   ├── queues.js                  # Queue instances + enqueue helpers
    │   └── workers/
    │       ├── alignment.worker.js
    │       ├── reflection.worker.js
    │       ├── review.worker.js
    │       └── sweep.worker.js
    ├── utils/
    │   ├── AppError.js                # Custom error class (Section 6)
    │   ├── response.util.js           # Response helpers (Section 5)
    │   ├── logger.js                  # Pino logger
    │   ├── hash.util.js               # Bcrypt helpers
    │   ├── jwt.util.js                # JWT sign/verify
    │   ├── date.util.js               # Timezone normalization
    │   ├── lock.util.js               # Redis SETNX lock
    │   ├── constraint.util.js         # Overcommit validation
    │   ├── weight.util.js             # Task weight calculations
    │   └── seed.js                    # Database seeder (npm run seed)
    ├── docs/
    │   └── swagger.yaml               # OpenAPI spec
    └── tests/
        ├── setup.js                   # Global test setup
        ├── helpers/
        │   ├── db.helper.js           # In-memory MongoDB connect/disconnect
        │   ├── auth.helper.js         # Create test user + token
        │   └── factories/
        │       ├── user.factory.js
        │       ├── identity.factory.js
        │       ├── plan.factory.js
        │       └── metric.factory.js
        ├── unit/
        │   ├── auth/
        │   ├── identity/
        │   ├── alignment/
        │   │   ├── score.service.test.js
        │   │   ├── streak.service.test.js
        │   │   ├── drift.service.test.js
        │   │   └── pattern.service.test.js
        │   └── reflection/
        └── e2e/
            ├── auth.e2e.test.js
            ├── identity.e2e.test.js
            ├── plan.e2e.test.js
            ├── execute.e2e.test.js
            ├── alignment.e2e.test.js
            └── reflect.e2e.test.js
```

---

## 18. JEST & TEST SETUP

### `jest.config.js`

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  globalSetup:    './src/tests/setup.js',
  globalTeardown: './src/tests/teardown.js',
  setupFilesAfterFramework: ['./src/tests/helpers/db.helper.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js', '!src/tests/**', '!src/docs/**'],
  coverageThreshold: {
    global: { branches: 70, functions: 80, lines: 80, statements: 80 },
  },
  testTimeout: 15000,
  // ─── Module name mapping for mocking external services ─────────────────
  moduleNameMapper: {
    // Automatically use mock in tests — override in specific tests if needed
  },
};
```

### `src/tests/setup.js`

```javascript
// src/tests/setup.js
// Runs once before all test suites

const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

module.exports = async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();

  // Set test environment variables
  process.env.NODE_ENV            = 'test';
  process.env.JWT_ACCESS_SECRET   = 'test-access-secret-min-32-characters-long';
  process.env.JWT_REFRESH_SECRET  = 'test-refresh-secret-min-32-characters-long';
  process.env.REDIS_URL           = 'redis://localhost:6379';
  process.env.OPENAI_API_KEY      = 'test-key';  // Mocked — never hits real API

  global.__MONGO_SERVER__ = mongoServer;
};
```

### `src/tests/teardown.js`

```javascript
module.exports = async () => {
  if (global.__MONGO_SERVER__) {
    await global.__MONGO_SERVER__.stop();
  }
};
```

### `src/tests/helpers/db.helper.js`

```javascript
const mongoose = require('mongoose');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterEach(async () => {
  // Clean all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
```

### Mock OpenAI in Tests

```javascript
// src/tests/__mocks__/openai.js
// This file is auto-used by Jest when services import 'openai'

const mockCreate = jest.fn().mockResolvedValue({
  choices: [{
    message: {
      content: JSON.stringify({
        behavioralRiskProfile: 'Test risk profile',
        quarterlyDirection: 'Test direction',
        keyInsight: 'Test insight',
        suggestedDeclaration: 'I am becoming a test user.',
      }),
    },
  }],
});

module.exports = jest.fn().mockImplementation(() => ({
  chat: { completions: { create: mockCreate } },
  audio: {
    transcriptions: { create: jest.fn().mockResolvedValue({ text: 'Test transcript' }) },
    speech: { create: jest.fn().mockResolvedValue(Buffer.from('audio')) },
  },
}));
```

### Example Unit Test — Score Service

```javascript
// src/tests/unit/alignment/score.service.test.js

const { calculateRawScore } = require('../../../services/alignment/score.service');

describe('Alignment Score Service', () => {
  const perfectExec = {
    coreTasksTotal: 3, coreTasksDone: 3,
    supportTasksTotal: 2, supportTasksDone: 2,
    habitDone: true,
    averageEffort: 10,
    isMissedDay: false,
  };

  test('perfect execution + perfect effort + perfect reflection = 100', () => {
    const { rawScore } = calculateRawScore(perfectExec, 100);
    expect(rawScore).toBe(100);
  });

  test('zero completion = base score from reflection only', () => {
    const zeroExec = { ...perfectExec, coreTasksDone: 0, supportTasksDone: 2, habitDone: false, averageEffort: 5, isMissedDay: true };
    const { rawScore } = calculateRawScore(zeroExec, 0);
    expect(rawScore).toBe(0);  // All zero since isMissedDay zeroes effort too
  });

  test('50% core, 100% support, habit done, effort 5, no reflection', () => {
    const exec = { ...perfectExec, coreTasksDone: 1, averageEffort: 5 };
    const { rawScore, components } = calculateRawScore(exec, 0);
    // core:  (1/3)*100 * 0.50 = 16.67
    // supp:  100 * 0.20       = 20
    // habit: 100 * 0.15       = 15
    // effort:(4/9)*100 * 0.10 = 4.44
    // refl:  0 * 0.05         = 0
    // total: ~56.11
    expect(rawScore).toBeCloseTo(56.11, 1);
    expect(components.coreCompletion).toBeCloseTo(33.33, 1);
  });

  test('score cannot exceed 100', () => {
    const { rawScore } = calculateRawScore(perfectExec, 100);
    expect(rawScore).toBeLessThanOrEqual(100);
  });

  test('score cannot be negative', () => {
    const badExec = { coreTasksTotal: 3, coreTasksDone: 0, supportTasksTotal: 2, supportTasksDone: 0, habitDone: false, averageEffort: 1, isMissedDay: false };
    const { rawScore } = calculateRawScore(badExec, 0);
    expect(rawScore).toBeGreaterThanOrEqual(0);
  });
});
```

---

## 19. DOCKER COMPOSE (LOCAL DEV)

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  mongo:
    image: mongo:7.0
    container_name: revup-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=revup
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/revup --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.2-alpine
    container_name: revup-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Uncomment to run app in Docker locally
  # api:
  #   build: .
  #   container_name: revup-api
  #   restart: unless-stopped
  #   ports:
  #     - "3000:3000"
  #   env_file: .env
  #   depends_on:
  #     mongo:
  #       condition: service_healthy
  #     redis:
  #       condition: service_healthy

volumes:
  mongo_data:
  redis_data:
```

### `Dockerfile` (Production)

```dockerfile
# ─── Stage 1: Dependencies ─────────────────────────────────────────────────
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# ─── Stage 2: Production Image ─────────────────────────────────────────────
FROM node:18-alpine AS runner
WORKDIR /app

# Security: Run as non-root user
RUN addgroup -S revup && adduser -S revup -G revup

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

RUN chown -R revup:revup /app
USER revup

EXPOSE 3000
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "src/server.js"]
```

### `.dockerignore`

```
node_modules
.env
.env.test
coverage
.git
*.log
docker-compose*.yml
.github
src/tests
```

---

## 20. PACKAGE.JSON WITH EXACT VERSIONS

```json
{
  "name": "revup-backend",
  "version": "1.0.0",
  "description": "RevUp Identity Alignment System — Backend API",
  "main": "src/server.js",
  "scripts": {
    "start":     "node src/server.js",
    "dev":       "nodemon src/server.js",
    "test":      "jest --runInBand --forceExit",
    "test:unit": "jest --testPathPattern=unit --runInBand",
    "test:e2e":  "jest --testPathPattern=e2e --runInBand --forceExit",
    "test:cov":  "jest --coverage --runInBand --forceExit",
    "seed":      "node src/utils/seed.js",
    "lint":      "eslint src --ext .js",
    "lint:fix":  "eslint src --ext .js --fix"
  },
  "dependencies": {
    "@aws-sdk/client-s3":         "^3.525.0",
    "@aws-sdk/s3-request-presigner": "^3.525.0",
    "bcrypt":                     "^5.1.1",
    "bullmq":                     "^5.1.6",
    "cors":                       "^2.8.5",
    "dotenv":                     "^16.4.1",
    "express":                    "^4.18.2",
    "express-rate-limit":         "^7.1.5",
    "helmet":                     "^7.1.0",
    "ioredis":                    "^5.3.2",
    "jsonwebtoken":               "^9.0.2",
    "mongoose":                   "^8.1.1",
    "multer":                     "^1.4.5-lts.1",
    "openai":                     "^4.26.0",
    "pino":                       "^8.18.0",
    "pino-http":                  "^9.0.0",
    "rate-limit-redis":           "^4.2.0",
    "resend":                     "^3.2.0",
    "stripe":                     "^14.17.0",
    "swagger-ui-express":         "^5.0.0",
    "zod":                        "^3.22.4"
  },
  "devDependencies": {
    "@types/jest":                "^29.5.11",
    "eslint":                     "^8.57.0",
    "jest":                       "^29.7.0",
    "mongodb-memory-server":      "^9.1.6",
    "nodemon":                    "^3.0.3",
    "prettier":                   "^3.2.4",
    "supertest":                  "^6.3.4"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## 21. PHASE-BY-PHASE TASK PLAN (60 TASKS)

> Execute strictly in order. Do not begin a task if its dependencies are incomplete.  
> Each task includes: goal, files, implementation notes, and acceptance test.

---

### 🟢 PHASE 1: CORE INFRASTRUCTURE (Tasks 1–5)

**Task 1: Initialize Express App & Server Skeleton**
- **Depends On:** None
- **Files:** `src/app.js`, `src/server.js`, `package.json`, `.env.example`, `.gitignore`
- **Goal:** Create Express app factory, separate server entry point, load env via config/env.js
- **Implementation Notes:**
  - `src/app.js` exports the configured Express app (NOT calling `.listen()`)
  - `src/server.js` imports app, calls `mongoose.connect()`, `redis.connect()`, then `app.listen()`
  - Mount only the health route in this task: `GET /api/v1/health`
  - Health route checks `mongoose.connection.readyState === 1` and Redis PING
- **Test:** `npm run dev` starts on PORT. GET /api/v1/health returns `{ status: "ok" }`

**Task 2: Global Error Handler & Pino Logger**
- **Depends On:** Task 1
- **Files:** `src/utils/logger.js`, `src/utils/AppError.js`, `src/utils/response.util.js`, `src/middlewares/error.mid.js`, `src/app.js`
- **Goal:** Structured JSON logging via Pino. Centralized error handler. Standard response helpers.
- **Implementation Notes:**
  - Logger should include: `requestId`, `userId`, `method`, `url`, `statusCode`, `responseTime`
  - Error handler: operational errors use `err.statusCode`, programming bugs get 500
  - Apply `pino-http` as request logger middleware in `app.js`
  - Implement AppError class and Errors factories exactly as defined in Section 6
  - Implement all helpers from Section 5 (sendSuccess, sendError, sendCreated, sendAccepted, sendPaginated)
- **Test:** Create a test route that throws `new AppError('test', 400, 'TEST')` — returns formatted JSON

**Task 3: MongoDB Connection with Graceful Shutdown**
- **Depends On:** Task 1, Task 2
- **Files:** `src/config/db.js`, `src/server.js`
- **Goal:** Mongoose connection with retry logic, connection pool, graceful SIGTERM handling
- **Implementation Notes:**
  - `maxPoolSize: 100`, `serverSelectionTimeoutMS: 5000`, `socketTimeoutMS: 45000`
  - On connection error → log and retry after 5 seconds (max 5 retries, then exit)
  - `process.on('SIGTERM', gracefulShutdown)` closes DB then exits
  - Use `MONGO_URI_TEST` when `NODE_ENV === 'test'`
- **Test:** Server logs "MongoDB Connected". Kill signal triggers graceful shutdown log.

**Task 4: Redis Client Setup**
- **Depends On:** Task 1, Task 2
- **Files:** `src/config/redis.js`, `src/config/redis-keys.js`, `src/server.js`
- **Goal:** ioredis client with reconnect logic, exported as singleton
- **Implementation Notes:**
  - Prefix all keys with `env.REDIS_KEY_PREFIX` automatically using `keyPrefix` ioredis option
  - Implement `redis-keys.js` exactly as defined in Section 7
  - Log `Redis connected` on ready, log reconnection attempts
  - Export single `redis` instance — never create new instances elsewhere
- **Test:** `redis.ping()` returns `'PONG'`. Key prefix is applied automatically.

**Task 5: Global Middlewares (CORS, Helmet, Rate Limiter)**
- **Depends On:** Task 1, Task 4
- **Files:** `src/middlewares/rateLimit.mid.js`, `src/app.js`
- **Goal:** Security headers, CORS whitelist, Redis-backed rate limiting
- **Implementation Notes:**
  - CORS: Allow only `env.CORS_ALLOWED_ORIGINS` (split by comma). Allow Authorization header.
  - Helmet: All defaults enabled. `contentSecurityPolicy: false` (API, not web server).
  - Rate limit global: `RATE_LIMIT_GLOBAL_MAX` per `RATE_LIMIT_GLOBAL_WINDOW_MS`, store in Redis
  - Rate limit auth routes (applied per-route in auth router): `RATE_LIMIT_AUTH_MAX` per window
  - Use `rate-limit-redis` store: `new RedisStore({ client: redis, prefix: 'rl:' })`
- **Test:** 101st request from same IP returns HTTP 429. X-Powered-By header absent.

---

### 🟡 PHASE 2: DATABASE MODELS & VALIDATION (Tasks 6–12)

**Task 6: User Model**
- **Depends On:** Task 3
- **Files:** `src/models/User.js`
- **Goal:** Full Mongoose schema as defined in Section 9.1
- **Test:** Save user with duplicate email throws 11000 error. Default tier is 'free'.

**Task 7: IdentityProfile Model**
- **Depends On:** Task 6
- **Files:** `src/models/IdentityProfile.js`
- **Goal:** Full schema as in Section 9.2, including all nested objects and onboarding step tracking
- **Test:** `userId` unique index rejects duplicate. More than 3 `priorityPillars` rejected.

**Task 8: Plan Model**
- **Depends On:** Task 6
- **Files:** `src/models/Plan.js`
- **Goal:** Full schema as in Section 9.3, including nested task and sprint schemas
- **Test:** Sprint with 4 core actions rejected by validator.

**Task 9: DailyExecutionLog Model**
- **Depends On:** Task 6
- **Files:** `src/models/DailyExecutionLog.js`
- **Goal:** Full schema as in Section 9.4
- **Test:** Compound unique index on `{ userId, date }` prevents duplicate logs.

**Task 10: AlignmentMetric Model**
- **Depends On:** Task 6
- **Files:** `src/models/AlignmentMetric.js`
- **Goal:** Full schema as in Section 9.5, including components breakdown field
- **Test:** `stateLevel` must be 1, 2, or 3 — other values rejected.

**Task 11: JournalEntry + WeeklyReview Models**
- **Depends On:** Task 6
- **Files:** `src/models/JournalEntry.js`, `src/models/WeeklyReview.js`
- **Goal:** Full schemas as in Sections 9.6 and 9.7. Full-text index on `reflectionText`.
- **Test:** Text search index exists. `processingStatus` defaults to 'pending'.

**Task 12: Zod Validation Middleware**
- **Depends On:** None (no DB dependency)
- **Files:** `src/middlewares/validate.mid.js`, `src/config/constants.js`
- **Goal:** Generic `validate(schema)` middleware. Implement `constants.js` in full (Section 4).
- **Implementation Notes:**
  - Validate `req.body`, `req.query`, `req.params` against separate schemas
  - On failure: call `next(Errors.VALIDATION_ERROR(formattedErrors))`
  - Format Zod errors as `[{ field: "email", message: "Invalid email" }]`
  - Also implement `src/config/env.js` in this task (Section 3)
- **Test:** Route with `validate(schema)` returns 400 for invalid body before reaching controller.

---

### 🟠 PHASE 3: AUTHENTICATION SYSTEM (Tasks 13–19)

**Task 13: Auth Utilities**
- **Depends On:** None
- **Files:** `src/utils/hash.util.js`, `src/utils/jwt.util.js`
- **Goal:** bcrypt helpers, JWT sign/verify with token version check
- **Implementation Notes:**
  - `hashPassword(plain)`: 10 salt rounds
  - `comparePassword(plain, hash)`: returns boolean
  - `generateAccessToken(user)`: payload `{ sub: userId, tier: subscriptionTier, version: tokenVersion }`, expires `JWT_ACCESS_EXPIRY`
  - `generateRefreshToken(user)`: payload `{ sub: userId, version: tokenVersion }`, expires `JWT_REFRESH_EXPIRY`
  - `verifyToken(token, secret)`: throws `AppError` on invalid/expired
- **Test (Unit):** Hash matches original. Expired token throws `TOKEN_EXPIRED`. Tampered token throws `INVALID_TOKEN`.

**Task 14: Auth Validators**
- **Depends On:** Task 12
- **Files:** `src/validators/auth.validator.js`
- **Goal:** Zod schemas for register, login, forgot, reset
- **Implementation Notes:**
  - Register: `email` (valid email, lowercase trim), `password` (min 8 chars)
  - Login: same fields
  - ForgotPassword: `email` only
  - ResetPassword: `token` (string), `newPassword` (min 8 chars)
- **Test (Unit):** Short password rejected. Invalid email rejected.

**Task 15: Auth Service Logic**
- **Depends On:** Task 6, Task 13
- **Files:** `src/services/auth/auth.service.js`
- **Goal:** `registerUser()`, `loginUser()`, `refreshTokens()`
- **Implementation Notes:**
  - `registerUser(email, password)`: Check email exists → throw `Errors.USER_EXISTS()`. Hash password. Create user. Return `{ user, accessToken, refreshToken }`. Store refresh token hash in Redis: `REDIS_KEYS.refreshToken(userId)` with TTL 7d.
  - `loginUser(email, password)`: Fetch user (include passwordHash with `.select('+passwordHash')`). Compare. Check `user.isActive`. Update `lastLoginAt`. Return tokens.
  - `refreshTokens(refreshToken)`: Verify token. Fetch user. Check `tokenVersion` matches. Generate new pair. Invalidate old in Redis. Store new.
- **Test (Unit):** Duplicate email throws 409. Wrong password throws 401. Expired refresh throws 401.

**Task 16: Auth Middlewares**
- **Depends On:** Task 13, Task 6
- **Files:** `src/middlewares/auth.mid.js`, `src/middlewares/role.mid.js`
- **Goal:** `requireAuth`, `requireRole([...tiers])`, `requireAdmin`
- **Implementation Notes:**
  - `requireAuth`: Extract `Bearer token` from Authorization header. Verify access token. Fetch user from DB (or cache). Attach to `req.user`. Throw `Errors.UNAUTHORIZED()` if missing.
  - `requireRole(['premium'])`: Check `req.user.subscriptionTier` is in allowed array. Throw `Errors.PREMIUM_REQUIRED(feature)`.
  - `requireAdmin`: Check `req.user.isAdmin === true`.
- **Test (Unit):** No token → 401. Free user on premium route → 403. Admin flag required for admin routes.

**Task 17: Auth Controllers & Routes**
- **Depends On:** Task 14, Task 15, Task 16
- **Files:** `src/controllers/auth.controller.js`, `src/routes/auth.routes.js`, `src/routes/index.js`, `src/app.js`
- **Goal:** Wire all auth endpoints. Mount router. Apply rate limit to auth routes.
- **Implementation Notes:**
  - Apply auth rate limiter (`rateLimit.mid.js` auth variant) to `/register`, `/login`, `/forgot`, `/reset`
  - `GET /me` uses `requireAuth`
  - `PATCH /me` accepts `{ timezone, notificationPreferences }` only — no email/password here
  - All controllers use `sendSuccess()` / `sendCreated()` — no raw `res.json()`
  - Set up `src/routes/index.js` to mount all route files under `/api/v1`
- **Test (E2E/Supertest):** POST /register → 201. POST /login → tokens. GET /me with token → user. GET /me without token → 401.

**Task 18: OAuth Placeholder Services**
- **Depends On:** Task 15
- **Files:** `src/services/auth/oauth.service.js`, `src/routes/auth.routes.js`
- **Goal:** Google + Apple OAuth placeholder handlers that return internal JWTs
- **Implementation Notes:**
  - `verifyGoogleToken(idToken)`: In production → calls Google tokeninfo endpoint. In test → mock returns `{ email, name }`.
  - `verifyAppleToken(idToken)`: Similar placeholder.
  - On success: `findOrCreateUser(email, provider)` — find existing user or create with `authProvider: 'google'` (no password hash).
- **Test (E2E):** POST /auth/google with mock token returns 200 + internal JWT pair.

**Task 19: Password Reset Flow**
- **Depends On:** Task 4, Task 15
- **Files:** `src/services/auth/reset.service.js`, `src/routes/auth.routes.js`
- **Goal:** Token-based password reset via Redis
- **Implementation Notes:**
  - Generate: `crypto.randomBytes(32).toString('hex')` — store with `REDIS_KEYS.passwordReset(email)`, TTL 1h
  - POST /forgot: Always returns 200 (never reveal if email exists). If user found → store token (email service called in Task 51).
  - POST /reset: Fetch token from Redis. Compare. Update `passwordHash`. Delete token. Increment `tokenVersion` (invalidates all existing JWTs).
- **Test (E2E):** Correct token → password updated. Wrong token → 400. Used token cannot be reused.

---

### 🔵 PHASE 4: IDENTITY & ONBOARDING (Tasks 20–27)

**Task 20: Identity Validators**
- **Depends On:** Task 12
- **Files:** `src/validators/identity.validator.js`
- **Goal:** Zod schemas for all 5 onboarding steps
- **Schemas:**
  - `currentIdentitySchema`: role (string, max 100), energyLevel (1-10 integer), executionGap (enum), executionGapSeverity (1-5), strengths (array max 5), weaknesses (array max 5), frustrationPoint (string max 500)
  - `futureIdentitySchema`: desiredRole, incomeRange, skillGoals (array max 5), healthTarget (1-10), confidenceTarget (1-10), lifestyleVision (max 1000), declarationSentence (max 300)
  - `constraintsSchema`: availableHoursPerDay (0.5-16), workHoursStart (HH:MM format), sleepHours (4-12)
  - `riskSchema`: answers (array of exactly 6 integers, each 1-5)
  - `pillarsSchema`: pillars (array of 2-3 strings)
- **Test (Unit):** More than 5 strengths rejected. Answers array with 5 items rejected (needs 6).

**Task 21: Risk Scoring Math Service**
- **Depends On:** None
- **Files:** `src/services/identity/risk.service.js`
- **Goal:** Pure math — converts 6 answers (1-5 scale) to risk scores
- **Implementation Notes:**
  - Questions (assumed order):
    1. How often do you start but not finish things? (1=never, 5=always)
    2. How easily does your routine break? (1=very stable, 5=very fragile)
    3. How often do you procrastinate on important tasks? (1=never, 5=always)
    4. How long do you typically stay committed to a new habit? (1=days, 5=months+, REVERSE score)
    5. How often do external events derail your goals? (1=never, 5=always)
    6. How long before you drift away after a setback? (1=never, 5=weeks)
  - `stabilityScore = 100 - ((answers[1] + answers[4] + answers[5]) / 3) * 20`
  - `procrastinationIndex = ((answers[0] + answers[2]) / 2) * 20`
  - `driftProbability = ((answers[0] + answers[1] + answers[2] + answers[5]) / 4) / 5`
  - Clamp all to valid ranges. Return `{ stabilityScore, procrastinationIndex, driftProbability }`.
- **Test (Unit):** All answers = 5 → high drift probability. All answers = 1 → low drift probability. Scores never exceed bounds.

**Task 22: Baseline Score Calculator**
- **Depends On:** None
- **Files:** `src/services/identity/baseline.util.js`
- **Goal:** Pure math — calculate starting alignment score
- **Formula:**
  ```
  base = 50
  + ((energyLevel - 5) * 2)       // range: -8 to +10
  - (executionGapSeverity * 2)     // range: -2 to -10
  - (driftProbability * 10)        // range: 0 to -10
  = clamp(result, 0, 100)
  ```
- **Test (Unit):** Energy=10, gap=1, drift=0 → high score ≤ 100. Energy=1, gap=5, drift=1 → score ≥ 0 (not negative).

**Task 23: AI Orchestrator Base Configuration**
- **Depends On:** None
- **Files:** `src/services/ai/ai.orchestrator.js`
- **Goal:** OpenAI SDK wrapper with retry, timeout, JSON enforcement, token tracking
- **Implementation Notes:**
  - `callLLM({ model, systemPrompt, userPrompt, maxTokens = 1000 })` → parsed JSON object
  - Enforce `response_format: { type: "json_object" }` always
  - Retry up to `env.OPENAI_MAX_RETRIES` times on network/5xx errors (exponential backoff)
  - Validate response is valid JSON — throw `Errors.AI_UNAVAILABLE()` if not after retries
  - Log token usage (input + output tokens) via Pino for cost monitoring
  - Throw gracefully if `OPENAI_API_KEY` is missing or invalid
- **Test (Unit, with mock):** Successful call returns parsed JSON. Failed call after max retries throws `AI_UNAVAILABLE`.

**Task 24: Identity Synthesis Service & Prompt**
- **Depends On:** Task 23
- **Files:** `src/services/ai/prompts/synthesis.prompt.js`, `src/services/identity/synthesis.service.js`
- **Goal:** AI synthesis of identity + Zod validation of LLM output
- **Implementation Notes:**
  - Use prompt from Section 15.1
  - Use `OPENAI_MODEL_SYNTHESIS` (gpt-4o — only expensive call)
  - Validate AI response with Zod schema: `{ behavioralRiskProfile: z.string(), quarterlyDirection: z.string(), keyInsight: z.string(), suggestedDeclaration: z.string() }`
  - If Zod validation fails → retry once → throw `Errors.AI_UNAVAILABLE()` if still fails
  - After synthesis: call `calculateBaselineScore()` and save full profile in DB
  - Update `onboardingSteps.synthesized = true`
- **Test (Unit, mocked AI):** Returns valid synthesis object. Invalid AI JSON is retried.

**Task 25: Identity Controllers & Routes**
- **Depends On:** Task 7, Task 20, Task 21, Task 22, Task 24
- **Files:** `src/controllers/identity.controller.js`, `src/routes/identity.routes.js`
- **Goal:** All identity onboarding endpoints
- **Implementation Notes:**
  - All POST/PATCH routes use `findOneAndUpdate({ userId }, $set: {...}, { upsert: true, new: true })`
  - Each step updates its corresponding `onboardingSteps.*Done = true` flag
  - `GET /identity/status` computes completion percentage from `onboardingSteps` flags
  - `POST /synthesize` is BLOCKING (awaits AI response — max 30s timeout)
  - Invalidate `REDIS_KEYS.identityCache(userId)` on any mutation
  - `GET /identity/me` checks cache first, populates and caches for 1hr on miss
- **Test (E2E):** Full onboarding flow: current → future → constraints → risk → pillars → synthesize results in populated IdentityProfile. Cache hit on second GET.

**Task 26: Avatar Config Mapper**
- **Depends On:** None
- **Files:** `src/services/avatar/avatar.service.js`, `src/controllers/avatar.controller.js`, `src/routes/avatar.routes.js`
- **Goal:** Map stateLevel to avatar visual config. Implement GET /avatar/state.
- **Implementation Notes:**
  - Fetch latest `AlignmentMetric` for user (or use `baselineAlignmentScore` if no metrics yet)
  - Return config from `AVATAR_STATES[stateLevel]` (Section 12)
  - Cache in Redis `REDIS_KEYS.avatarStateCache(userId)` for 30 minutes
  - Invalidate avatar cache whenever AlignmentMetric is upserted
- **Test (E2E):** New user gets state 2 (stable default). Returns complete visual config object.

**Task 27: Voice Input Wrapper**
- **Depends On:** None
- **Files:** `src/services/voice/stt.service.js`, `src/middlewares/upload.mid.js`
- **Goal:** Multer config for audio uploads. Whisper STT service scaffold.
- **Implementation Notes:**
  - Multer: `storage: multer.memoryStorage()`, `limits: { fileSize: 25 * 1024 * 1024 }`
  - Allowed MIME types: `audio/mpeg`, `audio/mp4`, `audio/m4a`, `audio/wav`, `audio/webm`
  - On invalid format: call `next(Errors.INVALID_AUDIO_FORMAT())`
  - `stt.service.js` `transcribe(buffer, mimetype)`: Write buffer to `/tmp/revup-{uuid}.mp3`, send to Whisper API, `finally { fs.unlinkSync(tmpPath) }`, return transcript string
  - Create route `POST /voice/transcribe` using upload middleware + stt service
- **Test (Unit):** Invalid MIME type rejected before reaching service. `/tmp` file deleted even on Whisper error.

---

### 🟣 PHASE 5: PLANNING ENGINE (Tasks 28–34)

**Task 28: Plan Validators & Overcommit Protection**
- **Depends On:** Task 12, Task 8
- **Files:** `src/validators/plan.validator.js`, `src/utils/constraint.util.js`
- **Goal:** Validate plan inputs. Prevent scheduling more hours than user has available.
- **Implementation Notes:**
  - `constraint.util.js`: `checkOvercommit(tasks, availableHoursPerDay)` — sums `estimatedMins` of all tasks, converts to hours, returns `{ isOvercommitted: boolean, totalHours, availableHours, excessHours }`
  - Throw `Errors.OVERCOMMIT()` in sprint generator if overcommitted
- **Test (Unit):** 3 tasks totaling 10hrs rejected for user with 8hrs available.

**Task 29: 90-Day Quarter Generator**
- **Depends On:** Task 8, Task 23
- **Files:** `src/services/planning/quarter.service.js`
- **Goal:** AI-generated quarterly plan saved to DB
- **Implementation Notes:**
  - Requires: `IdentityProfile` with `synthesized = true`
  - Use prompt from Section 15.3, `OPENAI_MODEL_PLANNING`
  - Validate AI output: max 3 objectives, each has title + pillar + successMetric + monthlyBreakdown (array of 3)
  - Map each objective's `pillar` to one of the user's `priorityPillars` — reject if AI hallucinated a different pillar
  - Save as `Plan` document: `{ userId, quarterTheme, macroObjectives, quarterStartDate, quarterEndDate }`
  - `quarterStartDate` = today (normalized to UTC midnight), `quarterEndDate` = +90 days
- **Test (E2E, mocked AI):** Plan saved with exactly 3 objectives. Objectives reference valid pillars.

**Task 30: Monthly Breakdown Service**
- **Depends On:** Task 29
- **Files:** `src/services/planning/month.service.js`
- **Goal:** Slice quarter into current month's 2-3 objectives
- **Implementation Notes:**
  - Takes `quarterPlan.macroObjectives` and extracts `monthlyBreakdown[monthIndex]` for current month
  - `monthIndex`: 0 for months 1-3, 1 for months 4-6, 2 for months 7-9 (based on days since quarterStart)
  - Update Plan with `monthlyPlans: [{ month: Date, objectives: string[] }]`
  - Max 3 objectives — if AI generated more in breakdown, take first 3
- **Test (Unit):** Month 1 gets index 0 breakdowns. Max 3 objectives enforced.

**Task 31: Weekly Sprint Generator**
- **Depends On:** Task 8
- **Files:** `src/services/planning/sprint.service.js`, `src/utils/weight.util.js`
- **Goal:** Generate weekly sprint with correct task counts and weights
- **Implementation Notes:**
  - Generates exactly: 3 core tasks (weight=3), 2 supporting tasks (weight=1), 1 identity habit (weight=1.5)
  - Task names can be AI-generated OR derived from monthly objectives (preferred)
  - Identity habit is pulled from `futureIdentity.skillGoals[0]` or a default habit pattern
  - `weekStartDate` = Monday midnight UTC of current week
  - `weekEndDate`   = Sunday 23:59:59 UTC of current week
  - Store as new entry in `plan.weeklySprints` array
  - Call `constraint.util.js` to validate hours before saving
- **Test (Unit):** Sprint always has 3 core + 2 supporting + 1 habit. Hours validated.

**Task 32: Adaptive Difficulty Service**
- **Depends On:** Task 31
- **Files:** `src/services/planning/adaptive.service.js`
- **Goal:** Scale task count based on streak
- **Implementation Notes:**
  - `getAdaptiveLevel(streakCount)`: streak > 14 → level 2 (add +1 supporting task), streak > 28 → level 3 (add +1 core), max level 5
  - Sprint generator calls this to set `adaptiveLevel` and add extra tasks accordingly
  - Never add tasks that would exceed `availableHoursPerDay`
- **Test (Unit):** Streak = 15 → level 2 = 4 supporting tasks. Streak = 5 → level 1 = 2 supporting tasks.

**Task 33: Planning Controllers & Routes**
- **Depends On:** Task 29, Task 30, Task 31
- **Files:** `src/controllers/plan.controller.js`, `src/routes/plan.routes.js`
- **Goal:** Wire all planning endpoints
- **Implementation Notes:**
  - `POST /quarter` requires identity to be synthesized (`onboardingSteps.synthesized === true`) — else 400
  - Cache plan in Redis `REDIS_KEYS.planCache(userId, weekStartDate)` after generation
  - Sprint reroll: check `rerollCount < MAX_SPRINT_REROLLS`, increment counter, regenerate, save
  - Archive old weekly sprints (older than 12 weeks) monthly via sweep job
  - Implement `GET /plan/stats`: returns `{ totalCoreTasks, totalSupportTasks, estimatedWeeklyHours }`
- **Test (E2E):** Full sequence: POST /quarter → POST /month → POST /sprint results in complete Plan document.

**Task 34: Today's Tasks Extractor & Timezone Normalizer**
- **Depends On:** Task 33
- **Files:** `src/utils/date.util.js`, `src/controllers/plan.controller.js`
- **Goal:** GET /plan/today returns current day's tasks accounting for user timezone
- **Implementation Notes:**
  - `date.util.js` functions:
    - `toLocalMidnightUTC(date, timezone)`: converts a local date to UTC midnight (start of local day)
    - `getLocalDayBounds(timezone)`: returns `{ startUTC, endUTC }` for today in user's timezone
    - `getWeekBounds(timezone)`: returns Monday–Sunday UTC bounds for current local week
    - `getISOWeekKey(date)`: returns `"YYYY-WW"` string for Redis keys
  - Use `date-fns-tz` or `luxon` for timezone math (add as dependency)
  - For today's tasks: find the sprint where `weekStartDate <= now <= weekEndDate`, return all tasks
- **Test (Unit):** 11PM IST and 2AM IST return same local date. UTC-5 user gets correct Sunday bounds.

---

### 🟤 PHASE 6: EXECUTION & LOGGING ENGINE (Tasks 35–39)

**Task 35: Execution Validators**
- **Depends On:** Task 12
- **Files:** `src/validators/exec.validator.js`
- **Goal:** Zod schemas for execution log, timer sync, intent
- **Schemas:**
  - `logSchema`: `date` (YYYY-MM-DD string), `tasks` (array of `{ taskId: objectId, taskName: string, weight: number, isCore: boolean, completed: boolean, effortScore: 1-10 }`, required if completed is true), `habitDone` (boolean), `deepWorkMinutes` (0-720 max 12hrs)
  - `timerSchema`: `minutes` (positive integer, max 240 per sync)
  - `intentSchema`: `date` (YYYY-MM-DD string)
- **Test (Unit):** effortScore 0 on a completed task rejected. deepWorkMinutes > 720 rejected.

**Task 36: Daily Execution Service**
- **Depends On:** Task 9, Task 35
- **Files:** `src/services/execution/exec.service.js`
- **Goal:** Upsert daily log, compute completion percentages
- **Implementation Notes:**
  - Normalize `date` string to UTC midnight using `date.util.js toLocalMidnightUTC(date, user.timezone)`
  - `upsertLog(userId, logData)`: `findOneAndUpdate({ userId, date }, { $set: {...} }, { upsert: true, new: true })`
  - After saving: compute `coreCompletionPct`, `supportCompletionPct`, `averageEffort` and save back
  - Return updated log → caller (execution route) enqueues alignment recalc
- **Test (Unit):** Calling twice same day updates same document. Completion % calculated correctly.

**Task 37: Deep Work Timer Sync**
- **Depends On:** Task 36
- **Files:** `src/services/execution/timer.service.js`
- **Goal:** Increment-only timer sync
- **Implementation Notes:**
  - `incrementTimer(userId, date, minutes)`: `findOneAndUpdate({ userId, date }, { $inc: { deepWorkMinutes: minutes } })`
  - Validates the log exists (cannot add timer without a log for that day)
  - Returns updated total minutes
- **Test (Unit):** 30 + 45 = 75 minutes total. Cannot go below 0.

**Task 38: Execution Routes & Controllers**
- **Depends On:** Task 36, Task 37
- **Files:** `src/controllers/exec.controller.js`, `src/routes/exec.routes.js`
- **Goal:** Wire all execution routes. Enqueue alignment job after log save.
- **Implementation Notes:**
  - After `exec.service.upsertLog()` success: call `enqueueAlignment({ userId, date, trigger: 'task_complete' })`
  - Do NOT await the alignment job — fire and forget
  - `GET /execute/today`: returns today's log for the user's timezone (or empty structure if not logged yet)
- **Test (E2E):** POST /execute/log returns 200. Second POST same day returns 200 (not 409). BullMQ job enqueued.

**Task 39: Morning Intent & Voice Commitment**
- **Depends On:** Task 38
- **Files:** `src/controllers/exec.controller.js`
- **Goal:** Intent declaration route. Voice commitment upload route (premium).
- **Implementation Notes:**
  - `POST /execute/intent`: upsert today's log setting `intentDeclared: true, intentDeclaredAt: new Date()`
  - `POST /execute/commit-voice` (premium): use upload middleware, transcribe via `stt.service.js`, save transcript + S3 URL to `voiceCommitmentUrl`
  - Enforce one intent per day (idempotent — calling twice is safe)
- **Test (E2E):** Intent saved. Second intent call is idempotent. Non-premium user blocked from voice commitment.

---

### 🔴 PHASE 7: ALIGNMENT SCORING — CORE BRAIN (Tasks 40–44)

> ⚠️ ABSOLUTE RULE: Zero LLM/AI calls in this phase. All files in `src/services/alignment/` are pure deterministic math.

**Task 40: Core Deterministic Score Service**
- **Depends On:** None
- **Files:** `src/services/alignment/score.service.js`
- **Goal:** Implement exact formula from Section 11, Step 1
- **Implementation Notes:**
  - Export `calculateRawScore(execSummary, reflectionQuality)` returning `{ rawScore, components }`
  - All inputs validated: clamp percentages 0-100, clamp effort 1-10
  - Precision: round to 2 decimal places using `Math.round(x * 100) / 100`
- **Test (Unit):** All combinations from Section 18 example tests must pass. Score never outside 0-100.

**Task 41: Streak & Penalty Service**
- **Depends On:** Task 40
- **Files:** `src/services/alignment/streak.service.js`
- **Goal:** Streak counting, multiplier, missed day penalty
- **Implementation Notes:**
  - Implement `calculateStreak(rawScore, previousMetrics)` → `{ streakCount, multiplier }` (Section 11, Step 2)
  - Implement `applyMultiplier(rawScore, multiplier)` → final score ≤ 100
  - Implement `calculateMissedDayScore(previousMetrics)` → penalized score for sweep job
- **Test (Unit):** Streak 0→3→0 on score dropping below 50. Multiplier 1.05 at streak 4. 1.10 at streak 8. Score never > 100 after multiplier.

**Task 42: Drift Index & State Level Service**
- **Depends On:** Task 41
- **Files:** `src/services/alignment/drift.service.js`
- **Goal:** 7-day moving average, drift calculation, state determination
- **Implementation Notes:**
  - Implement `calculateDrift(todayScore, previousMetrics)` → `{ driftIndex, sevenDayAverage }` (Section 11, Steps 3-4)
  - Implement `determineStateLevel(sevenDayAverage, driftIndex, previousMetrics)` → 1, 2, or 3
  - State can drop immediately. State can only RISE after 2 consecutive qualifying days.
- **Test (Unit):** sevenDayAvg=80, drift=0.1 → state 3. sevenDayAvg=30 → state 1. Drift bounded [-1, 1].

**Task 43: Pattern Detection Service**
- **Depends On:** None
- **Files:** `src/services/alignment/pattern.service.js`
- **Goal:** Implement all 4 pattern detectors from Section 14
- **Test (Unit):** 3 consecutive Wednesdays with 15+ point drops → MIDWEEK_DRIFT flagged. effort >= 8 but < 50% completion 3 days → EFFORT_INFLATION flagged.

**Task 44: Recalculation Orchestrator + Redis Lock + BullMQ Worker**
- **Depends On:** Task 4, Task 9, Task 10, Task 40, Task 41, Task 42, Task 43
- **Files:** `src/services/alignment/recalc.service.js`, `src/utils/lock.util.js`, `src/jobs/queues.js`, `src/jobs/workers/alignment.worker.js`
- **Goal:** Full async alignment pipeline: lock → fetch → calculate → upsert → invalidate cache
- **Implementation Notes:**
  - `lock.util.js`: `acquireLock(key, ttlSeconds)` uses `SET key 1 NX EX ttl` — returns boolean. `releaseLock(key)` deletes key.
  - `recalc.service.js`:
    1. Acquire lock `REDIS_KEYS.alignmentLock(userId)` (30s TTL) — if failed, another recalc is running, skip
    2. Fetch `DailyExecutionLog` for date
    3. Fetch last 7 `AlignmentMetric` for user (sorted newest-first)
    4. Fetch `JournalEntry` for date → get `reflectionQualityScore` (0 if not yet processed)
    5. Build `execSummary` from log
    6. Call `calculateRawScore(execSummary, reflectionQuality)`
    7. Call `calculateStreak(rawScore, previousMetrics)` → apply multiplier
    8. Call `calculateDrift(finalScore, previousMetrics)`
    9. Call `determineStateLevel(...)`
    10. Fetch last 30 metrics + logs → call `detectPatterns()`
    11. Upsert `AlignmentMetric` with all results
    12. Release lock
    13. Invalidate `REDIS_KEYS.avatarStateCache(userId)` and `REDIS_KEYS.dashboardCache(userId)`
  - BullMQ worker: listens on `QUEUES.ALIGNMENT`, calls `recalc.service.js` with job data
  - Update `POST /execute/log` to call `enqueueAlignment()` instead of awaiting recalc
- **Test (Unit):** Concurrent calls — only one recalc executes (lock prevents race). Lock released even on error.
- **Test (E2E):** Log execution → check AlignmentMetric updated after short delay.

---

### ⚫ PHASE 8: REFLECTION, AI & ASYNC JOBS (Tasks 45–50)

**Task 45: Journal CRUD Service**
- **Depends On:** Task 11
- **Files:** `src/services/reflection/journal.service.js`, `src/services/reflection/quality.service.js`
- **Goal:** Create journal entry with baseline quality score. Implement quality scoring from Section 13.
- **Implementation Notes:**
  - `createEntry(userId, date, text, mode)`: normalize date, compute word count, calculate baseline score, save with `processingStatus: 'pending'`
  - `getHistory(userId, { page, limit, tags })`: paginated query with optional tag filter
  - `search(userId, query)`: MongoDB text search on `reflectionText` field
  - Implement `calculateBaselineQuality()` and `validateAIQualityScore()` from Section 13
- **Test (Unit):** 250-word text gets baseline 75+. <50 words gets 20.

**Task 46: Reflection Controller & Routes**
- **Depends On:** Task 45
- **Files:** `src/controllers/reflect.controller.js`, `src/routes/reflect.routes.js`
- **Goal:** Wire reflection endpoints. Return 202 immediately, enqueue AI processing.
- **Implementation Notes:**
  - `POST /reflect/evening`:
    1. Create journal entry (saves text + baseline score)
    2. Enqueue `reflectionQueue.add({ journalEntryId, userId, date })`
    3. Return `sendAccepted(res, 'Reflection received. AI feedback coming shortly.')`
  - `GET /reflect/history`: use `sendPaginated()`
  - Apply `limit.tier.mid.js` (Task 53) to this route
- **Test (E2E):** POST returns 202 instantly. JournalEntry exists in DB with `processingStatus: 'pending'`.

**Task 47: Short-Term Memory Context Fetcher**
- **Depends On:** Task 7, Task 10
- **Files:** `src/services/ai/memory.short.js`
- **Goal:** Compressed context string for AI injection
- **Implementation Notes:**
  - Fetch: `IdentityProfile.futureIdentity.declarationSentence`, `IdentityProfile.riskProfile` summary
  - Fetch: Last 7 `AlignmentMetric` → extract `[{ date, alignmentScore, stateLevel, streakCount }]`
  - Fetch: Current week's sprint objectives (just task names)
  - Format as compact JSON string — max ~500 tokens total
  - Cache result in Redis for 10 minutes (invalidated on new metric)
- **Test (Unit):** Output is valid JSON parseable string. Contains all 3 required sections.

**Task 48: Async AI Reflection Processor Worker**
- **Depends On:** Task 23, Task 46, Task 47
- **Files:** `src/jobs/workers/reflection.worker.js`, `src/services/ai/prompts/reflection.prompt.js`
- **Goal:** BullMQ worker processes reflection: fetch context → call AI → validate → update journal → retrigger alignment
- **Implementation Notes:**
  - Use prompt from Section 15.2, `OPENAI_MODEL_REFLECTION`
  - Validate AI response with Zod: `{ aiFeedback: z.string(), tone: z.enum(['encouraging', 'firm', 'strategic', 'neutral']), qualityScore: z.number().min(0).max(100), alignmentDelta: z.number().min(-5).max(5), flags: z.object({...}) }`
  - Clamp `qualityScore` using `validateAIQualityScore(aiScore, baselineScore)` from quality.service.js
  - Update `JournalEntry`: `{ aiFeedback, aiTone: tone, reflectionQualityScore: clampedScore, alignmentDelta, analysisFlags: flags, processingStatus: 'completed', processedAt: new Date() }`
  - After update: call `enqueueAlignment({ userId, date, trigger: 'reflection_done' })` to recalculate score with new R value
  - On error: set `processingStatus: 'failed'`, log error, do not rethrow (allow BullMQ retry)
- **Test (E2E):** Submit reflection → wait → JournalEntry has `processingStatus: 'completed'`. AlignmentMetric updated.

**Task 49: Weekly Review Aggregator Job**
- **Depends On:** None (self-contained)
- **Files:** `src/jobs/workers/review.worker.js`, `src/services/ai/prompts/review.prompt.js`
- **Goal:** Runs every Sunday. Generates weekly progress card for each user.
- **Implementation Notes:**
  - Use prompt from Section 15.4
  - Aggregate: fetch 7 days of AlignmentMetrics + JournalEntries for user
  - Compute: `averageScore`, `bestDay`, `worstDay`, `habitConsistencyPct`, `totalDeepWorkMins`
  - Extract: pattern flags seen this week, journal tags frequency
  - Call AI to generate `progressCard` paragraph and `behavioralInsight`
  - Save `WeeklyReview` document
  - Schedule with BullMQ repeatable: `repeat: { cron: '0 23 * * 0' }` (Sunday 23:00 UTC)
- **Test (Unit):** Worker correctly aggregates 7-day metrics. AI prompt contains actual stats (not empty).

**Task 50: Midnight Penalty Sweep Worker**
- **Depends On:** Task 10
- **Files:** `src/jobs/workers/sweep.worker.js`
- **Goal:** Hourly job. Penalizes users who didn't log for yesterday.
- **Implementation Notes:**
  - Runs every hour at `:05` past the hour
  - For each user: convert `user.timezone` to UTC → check if their local time just crossed midnight (within the last hour)
  - If yes: check if `DailyExecutionLog` exists for yesterday (their local date)
  - If no log exists: create `DailyExecutionLog` with `isMissedDay: true`, all zeroes
  - Enqueue alignment recalc for that user/date
  - Use `REDIS_KEYS.midnightSwept(userId, date)` to prevent double-penalizing (TTL 48h)
  - Process users in batches of 100 to prevent memory issues
- **Test (Unit):** User with IST timezone gets penalized at correct UTC hour. Redis key prevents double penalty.

---

### 🏁 PHASE 9: PRODUCTION READINESS (Tasks 51–60)

**Task 51: Email Service (Resend)**
- **Depends On:** Task 19
- **Files:** `src/services/email/email.service.js`, `src/services/email/templates/reset.html`, `src/services/email/templates/welcome.html`
- **Goal:** Send password reset emails and welcome emails
- **Implementation Notes:**
  - Use Resend SDK: `new Resend(env.RESEND_API_KEY)`
  - `sendPasswordResetEmail(email, resetToken)`: link = `${env.FRONTEND_WEB_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
  - `sendWelcomeEmail(email, name)`: triggered from `identity.service.js` after synthesis
  - HTML templates must be valid email HTML (no CSS floats, use inline styles, max 600px wide)
  - In test environment: mock the Resend client, log what would be sent
- **Test (Unit, mocked):** Reset email contains the correct token link. Missing API key logs warning but doesn't crash.

**Task 52: Stripe & Razorpay Webhook Handler**
- **Depends On:** Task 6
- **Files:** `src/controllers/webhook.controller.js`, `src/routes/webhook.routes.js`
- **Goal:** Handle billing events to upgrade/downgrade user tier
- **Implementation Notes:**
  - **CRITICAL:** Webhook routes must use `express.raw({ type: 'application/json' })` middleware — NOT `express.json()` — to preserve raw body for signature verification
  - Stripe events to handle:
    - `checkout.session.completed` → `User.subscriptionTier = 'premium'`
    - `customer.subscription.deleted` → `User.subscriptionTier = 'free'`
    - `invoice.payment_failed` → log, optionally notify user
  - Verify Stripe signature: `stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET)`
  - Invalid signature → `sendError(res, 'Invalid signature', 400, 'INVALID_SIGNATURE')`
  - Razorpay: similar pattern with Razorpay SDK signature validation
- **Test (Unit):** Valid mock signed payload updates user tier. Invalid signature returns 400.

**Task 53: AI Usage Limit Middleware (Free Tier)**
- **Depends On:** Task 4, Task 16
- **Files:** `src/middlewares/limit.tier.mid.js`
- **Goal:** Enforce free tier AI call limits using Redis counters
- **Implementation Notes:**
  - `checkAILimit` middleware:
    1. If user is premium → `next()` immediately
    2. Get week key: `date-fns` `getISOWeek(new Date())` → `"2025-03"`
    3. Redis key: `REDIS_KEYS.aiUsageWeekly(userId, weekKey)`
    4. `INCR` the key (atomically increments and returns new count)
    5. If key is new, set TTL to seconds until end of week (Sunday 23:59:59)
    6. If count > `FREE_LIMITS.AI_CALLS_PER_WEEK` → throw `Errors.AI_LIMIT_EXCEEDED()`
  - Apply to: `POST /reflect/evening`, `POST /identity/synthesize`
- **Test (E2E):** Free user — 4th AI request in a week returns 403. Premium user is unlimited.

**Task 54: Web Dashboard Analytics Aggregation**
- **Depends On:** Task 9, Task 10
- **Files:** `src/services/analytics/dashboard.service.js`, `src/controllers/analytics.controller.js`, `src/routes/analytics.routes.js`
- **Goal:** Heavy MongoDB aggregations for web dashboard charts
- **Implementation Notes:**
  - `get30DayTrend(userId)`: `AlignmentMetric.aggregate([ $match(last 30 days), $sort(date), $project(date, alignmentScore, driftIndex) ])` — fills missing days with null
  - `getExecutionHeatmap(userId)`: Group by day-of-week, average completion % → output `[{ day: "Mon", avgCompletion: 72 }, ...]`
  - `getWeeklyCompletionGraph(userId)`: Group by week → average completion, habit rate
  - `getDriftChart(userId)`: Last 30 days drift index series
  - Cache full dashboard response in Redis `REDIS_KEYS.dashboardCache(userId)` for 30 minutes
  - Response shaped for direct Recharts consumption (no frontend calculation needed)
- **Test (Unit):** Aggregation with 30 days of seeded data returns correct averages.

**Task 55: OpenAI Whisper STT Integration**
- **Depends On:** Task 27
- **Files:** `src/services/voice/whisper.service.js`
- **Goal:** Full Whisper STT integration with tmp file cleanup
- **Implementation Notes:**
  - Write buffer to `/tmp/revup-${uuid()}.audio`
  - Send to Whisper: `openai.audio.transcriptions.create({ file: fs.createReadStream(tmpPath), model: env.OPENAI_MODEL_STT })`
  - `finally { fs.existsSync(tmpPath) && fs.unlinkSync(tmpPath) }` — guaranteed cleanup
  - Set timeout: if Whisper takes > 30s → reject with `Errors.AI_UNAVAILABLE()`
  - Route `POST /voice/transcribe` returns `{ transcript: string, wordCount: number }`
- **Test (Unit, mocked):** Tmp file cleaned up even when Whisper throws. Valid audio returns transcript.

**Task 56: TTS Generation & S3 Upload (Premium)**
- **Depends On:** Task 48, Task 55
- **Files:** `src/services/voice/tts.service.js`, `src/config/aws.js`
- **Goal:** Convert AI feedback to audio, upload to S3, return signed URL
- **Implementation Notes:**
  - AWS SDK v3: `S3Client`, `PutObjectCommand`, `getSignedUrl`
  - `generateTTSAndUpload(text, userId, journalEntryId)`:
    1. Call `openai.audio.speech.create({ model: 'tts-1', voice: 'onyx', input: text })`
    2. Get audio buffer
    3. S3 key: `voice-responses/${userId}/${journalEntryId}.mp3`
    4. Upload with `ContentType: 'audio/mpeg'`
    5. Generate presigned GET URL (expires in `env.AWS_S3_URL_EXPIRY` seconds)
    6. Return signed URL
  - Update `JournalEntry.aiAudioUrl` with the S3 URL
  - Called in `reflection.worker.js` for premium users only
- **Test (Unit, mocked):** S3 upload called with correct key. Signed URL returned. Non-premium users skipped.

**Task 57: Swagger OpenAPI Documentation**
- **Depends On:** Task 1
- **Files:** `src/docs/swagger.yaml`, `src/app.js`
- **Goal:** Live interactive API documentation at `/api-docs`
- **Implementation Notes:**
  - Use `swagger-ui-express` + `js-yaml` to parse `swagger.yaml`
  - Define all routes from Section 16 in OpenAPI 3.0 format
  - Include: request body schemas, response schemas, auth requirements (Bearer), error responses
  - Only serve docs in non-production OR with a query param `?key=admin-docs-key`
- **Acceptance:** Browse `/api-docs` → all routes documented with example request/responses.

**Task 58: Production Database Seeder**
- **Depends On:** Tasks 6-11
- **Files:** `src/utils/seed.js`
- **Goal:** CLI script to populate realistic 30-day test data
- **Implementation Notes:**
  - `npm run seed` creates:
    - 1 Test User: `test@revup.app` / `Password123!` / Premium tier
    - 1 IdentityProfile: Software engineer → Senior Engineering Manager
    - 1 Plan: Full quarter plan with 12 weeks of sprints
    - 30 DailyExecutionLogs: randomized but realistic (Mon-Fri higher completion, weekends lower)
    - 30 AlignmentMetrics: computed from execution logs using actual math services
    - 10 JournalEntries: scattered through the 30 days
    - 4 WeeklyReviews
  - Check if test user exists before creating (idempotent)
  - Log progress: `"Creating user... Creating identity... Seeding 30 days of execution logs..."`
- **Acceptance:** `npm run seed` completes without error. Web dashboard shows populated charts immediately.

**Task 59: Production Dockerfile & Docker Compose**
- **Depends On:** None
- **Files:** `Dockerfile`, `.dockerignore`, `docker-compose.prod.yml`
- **Goal:** Optimized multi-stage Docker build for production
- **Implementation Notes:**
  - Use exact Dockerfile from Section 19
  - `docker-compose.prod.yml`: includes API container with env_file, MongoDB and Redis with persistent volumes, no exposed ports except API on 3000
- **Test:** `docker build -t revup-api .` succeeds. Container starts and /health returns 200.

**Task 60: CI/CD GitHub Actions Pipeline**
- **Depends On:** Task 59, all tests
- **Files:** `.github/workflows/deploy.yml`
- **Goal:** Automated test → build → push → deploy pipeline
- **Implementation Notes:**
  ```yaml
  name: Deploy RevUp API
  on:
    push:
      branches: [main]
  jobs:
    test:
      runs-on: ubuntu-latest
      services:
        mongodb:
          image: mongo:7.0
          ports: ["27017:27017"]
        redis:
          image: redis:7.2-alpine
          ports: ["6379:6379"]
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '18' }
        - run: npm ci
        - run: npm test
          env:
            NODE_ENV: test
            MONGO_URI: mongodb://localhost:27017/revup_test
            REDIS_URL: redis://localhost:6379
            JWT_ACCESS_SECRET: ${{ secrets.JWT_ACCESS_SECRET }}
            JWT_REFRESH_SECRET: ${{ secrets.JWT_REFRESH_SECRET }}
    build-push:
      needs: test
      steps:
        - name: Build and push Docker image
          # ... push to AWS ECR or Docker Hub
    deploy:
      needs: build-push
      steps:
        - name: Deploy to server
          # ... SSH or ECS task definition update
  ```
  - Any Jest failure → build aborts → no deployment
  - Secrets stored in GitHub Secrets (never in YAML)
- **Test:** Push to main → GitHub Actions dashboard shows all 3 jobs passing.

---

## 22. VALIDATION MILESTONES

> Stop after each milestone and manually verify using Postman/Insomnia before proceeding.

### ✅ Milestone 1 — End of Phase 3 (Auth)
1. `POST /api/v1/auth/register` → 201 with tokens
2. `POST /api/v1/auth/login` with same credentials → 200 with tokens
3. `GET /api/v1/auth/me` with Bearer token → user object (no passwordHash)
4. `GET /api/v1/auth/me` without token → 401 `{ code: "UNAUTHORIZED" }`
5. `POST /api/v1/auth/register` duplicate email → 409 `{ code: "USER_EXISTS" }`
6. Redis has refresh token key for the logged-in user
7. MongoDB has 1 user document with `subscriptionTier: "free"`

### ✅ Milestone 2 — End of Phase 4 (Identity/Onboarding)
1. POST current identity → 200, `onboardingSteps.currentIdentityDone: true`
2. POST future identity → 200
3. POST constraints → 200
4. POST risk assessment (6 answers) → 200, risk scores calculated correctly
5. POST pillars (3 items) → 200
6. POST synthesize → 200, returns AI blueprint, `baselineAlignmentScore` calculated
7. `GET /identity/me` → full profile with all sections
8. `GET /identity/status` → `{ completionPct: 100 }`
9. Redis cache key exists for identity

### ✅ Milestone 3 — End of Phase 5 (Planning)
1. POST /plan/quarter → 200, plan document created with 3 objectives
2. POST /plan/month → 200, monthlyPlan populated
3. POST /plan/sprint → 200, sprint has exactly 3 core + 2 supporting + 1 habit tasks
4. GET /plan/today → returns today's tasks (timezone-correct)
5. POST /plan/sprint with tasks totaling > available hours → 400 `{ code: "OVERCOMMIT" }`
6. POST /plan/sprint/reroll → new task names generated (max 3 times)

### ✅ Milestone 4 — End of Phase 7 (Alignment Brain)
1. Insert 7 days of fake DailyExecutionLogs via seed or direct DB write
2. POST /execute/log for today → 200, BullMQ job enqueued
3. Wait 3 seconds → GET /alignment/dashboard → alignmentScore is calculated (not 0)
4. Insert a missed day (no log) → run sweep manually → score drops, drift goes negative
5. Check `driftIndex < 0` for a user with declining scores
6. Check `stateLevel: 1` for user with 7-day average < 45
7. Concurrent POST /execute/log calls → only one AlignmentMetric created per day
8. Pattern `EFFORT_INFLATION` flagged after 3 days of high effort + low completion

### ✅ Milestone 5 — End of Phase 8 (Reflection/AI/Jobs)
1. POST /reflect/evening → **immediately** returns 202 (not waiting for AI)
2. Node.js console shows BullMQ job processing in background
3. Wait 10 seconds → GET /reflect/history → entry has `processingStatus: "completed"`, `aiFeedback` populated
4. Free user: 4th POST /reflect/evening → 403 `{ code: "AI_LIMIT_EXCEEDED" }`
5. AlignmentMetric updated again after reflection (R score incorporated)
6. BullMQ dashboard (if running Bull Board) shows completed jobs

### ✅ Milestone 6 — Production Go-Live Check
1. **Billing:** Stripe CLI test webhook → user tier updated to premium in DB
2. **Billing:** Delete subscription webhook → tier reverted to free
3. **Data:** `npm run seed` → GET /analytics/web-dashboard → returns valid chart arrays
4. **Docs:** GET /api-docs → Swagger UI renders all routes
5. **Voice:** POST /voice/transcribe with real audio file → returns transcript
6. **Docker:** `docker build -t revup-api .` → container starts → GET /health returns 200
7. **CI:** Push to main branch → GitHub Actions runs → all tests green

---

## 📌 IMPLEMENTATION NOTES FOR CLAUDE CODE

### Starting a New Session
When beginning any task, always:
1. Read the section of this document relevant to your task
2. Check the Constants file (`src/config/constants.js`) — use imported values, never literals
3. Check the Redis keys file — never write raw key strings
4. Write the failing test FIRST, then implement to pass it

### If You Are Unsure About Something
1. Check Section 4 (Constants) for threshold values
2. Check Section 11 (Alignment Math) for scoring questions
3. Check Section 5/6 (Response/Error format) for API format questions
4. Check Section 9 (Models) for field names and types

### Things Never To Do
- ❌ Call OpenAI inside `src/services/alignment/` files
- ❌ Use `res.json()` directly in controllers — use `sendSuccess()` etc.
- ❌ Write raw Redis key strings — use `REDIS_KEYS.*` functions
- ❌ Write raw queue name strings — use `QUEUES.*` constants
- ❌ Access `process.env.X` directly in service files — use `env` from `config/env.js`
- ❌ Skip writing tests — every service function needs a unit test
- ❌ Put business logic in controllers — controllers only handle HTTP layer

---

*End of REVUP_BACKEND_MASTER_PLAN.md — Version 1.0*
*Total sections: 22 | Total tasks: 60 | Estimated implementation: ~3-4 weeks of AI-assisted development*
