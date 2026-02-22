# REVUP BACKEND — DATABASE SCHEMA REFERENCE
> All 7 Mongoose models with complete field definitions, types, validations, indexes, and relationships.

---

## Overview

| Model | Collection | Key Relationship |
|-------|-----------|-----------------|
| User | users | Root entity |
| IdentityProfile | identityprofiles | 1:1 with User |
| Plan | plans | N:1 with User |
| DailyExecutionLog | dailyexecutionlogs | N:1 with User |
| AlignmentMetric | alignmentmetrics | N:1 with User |
| JournalEntry | journalentries | N:1 with User |
| WeeklyReview | weeklyreviews | N:1 with User |

---

## Model 1: User

**File:** `src/models/User.js`
**Collection:** `users`

### Fields

| Field | Type | Required | Default | Validation | Notes |
|-------|------|----------|---------|-----------|-------|
| `email` | String | Yes | — | Unique, lowercase, trim, regex email | Indexed |
| `passwordHash` | String | If local auth | — | `select: false` — never returned by default | Required only when `authProvider === 'local'` |
| `authProvider` | String (enum) | No | `'local'` | `local`, `google`, `apple` | Uses `AUTH_PROVIDERS` constant |
| `subscriptionTier` | String (enum) | No | `'free'` | `free`, `premium` | Uses `TIERS` constant |
| `timezone` | String | No | `'UTC'` | — | e.g. `'Asia/Kolkata'`, `'America/New_York'` |
| `notificationPreferences.morning` | Boolean | No | `true` | — | |
| `notificationPreferences.evening` | Boolean | No | `true` | — | |
| `notificationPreferences.drift` | Boolean | No | `true` | — | |
| `notificationPreferences.streak` | Boolean | No | `true` | — | |
| `fcmToken` | String | No | `null` | — | Firebase push notification token |
| `isActive` | Boolean | No | `true` | — | Soft delete / ban flag |
| `isAdmin` | Boolean | No | `false` | — | Platform admin access |
| `tokenVersion` | Number | No | `0` | — | Incremented on logout-all to invalidate all JWTs |
| `stripeCustomerId` | String | No | `null` | — | Stripe customer reference |
| `lastLoginAt` | Date | No | `null` | — | Updated on every login |
| `createdAt` | Date | Auto | — | — | From `timestamps: true` |
| `updatedAt` | Date | Auto | — | — | From `timestamps: true` |

### Indexes
```javascript
{ email: 1 }              // unique: true
{ subscriptionTier: 1 }
{ isActive: 1 }
```

### toJSON Transform
```javascript
transform: (doc, ret) => {
  delete ret.passwordHash;  // Never expose hash
  delete ret.__v;
  return ret;
}
```

---

## Model 2: IdentityProfile

**File:** `src/models/IdentityProfile.js`
**Collection:** `identityprofiles`

### Fields — currentIdentity

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `currentIdentity.role` | String | No | trim, max 100 |
| `currentIdentity.energyLevel` | Number | No | min: 1, max: 10 (integer) |
| `currentIdentity.executionGap` | String (enum) | No | `focus`, `consistency`, `motivation`, `clarity`, `time` |
| `currentIdentity.executionGapSeverity` | Number | No | min: 1, max: 5 |
| `currentIdentity.strengths` | String[] | No | max 5 items |
| `currentIdentity.weaknesses` | String[] | No | max 5 items |
| `currentIdentity.frustrationPoint` | String | No | trim |
| `currentIdentity.disciplineBreakPattern` | String | No | trim |

### Fields — futureIdentity

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `futureIdentity.desiredRole` | String | No | trim |
| `futureIdentity.incomeRange` | String | No | e.g. `'₹50L-1Cr'` |
| `futureIdentity.skillGoals` | String[] | No | max 5 items |
| `futureIdentity.healthTarget` | Number | No | min: 1, max: 10 |
| `futureIdentity.confidenceTarget` | Number | No | min: 1, max: 10 |
| `futureIdentity.lifestyleVision` | String | No | trim |
| `futureIdentity.declarationSentence` | String | No | maxlength: 300 |

### Fields — blueprint (AI-generated)

| Field | Type | Notes |
|-------|------|-------|
| `blueprint.behavioralRiskProfile` | String | AI paragraph |
| `blueprint.quarterlyDirection` | String | AI paragraph |
| `blueprint.keyInsight` | String | AI 1-liner |
| `blueprint.synthesizedAt` | Date | When AI ran |

### Fields — timeConstraints

| Field | Type | Validation |
|-------|------|-----------|
| `timeConstraints.availableHoursPerDay` | Number | min: 0.5, max: 16 |
| `timeConstraints.workHoursStart` | String | `'09:00'` format |
| `timeConstraints.workHoursEnd` | String | `'18:00'` format |
| `timeConstraints.sleepHours` | Number | min: 4, max: 12 |
| `timeConstraints.focusWindowStart` | String | `'06:00'` format |
| `timeConstraints.focusWindowEnd` | String | `'08:00'` format |
| `timeConstraints.fixedCommitments` | String[] | User-described fixed commitments |

### Fields — riskProfile

| Field | Type | Validation |
|-------|------|-----------|
| `riskProfile.stabilityScore` | Number | min: 0, max: 100 |
| `riskProfile.procrastinationIndex` | Number | min: 0, max: 100 |
| `riskProfile.driftProbability` | Number | min: 0, max: 1 |
| `riskProfile.rawAnswers` | Number[] | Exactly 6 ints, each 1-5 |

### Fields — onboardingSteps

| Field | Type | Default |
|-------|------|---------|
| `onboardingSteps.currentIdentityDone` | Boolean | `false` |
| `onboardingSteps.futureIdentityDone` | Boolean | `false` |
| `onboardingSteps.constraintsDone` | Boolean | `false` |
| `onboardingSteps.riskAssessmentDone` | Boolean | `false` |
| `onboardingSteps.pillarsSelected` | Boolean | `false` |
| `onboardingSteps.synthesized` | Boolean | `false` |
| `onboardingSteps.avatarCreated` | Boolean | `false` |

### Fields — other

| Field | Type | Validation |
|-------|------|-----------|
| `userId` | ObjectId (ref: User) | Required, Unique |
| `priorityPillars` | String[] | max 3 items (custom validator) |
| `avatarPreferences.genderPresentation` | String (enum) | `masculine`, `feminine`, `neutral` |
| `avatarPreferences.skinTone` | String | hex or preset |
| `avatarPreferences.clothingStyle` | String (enum) | `professional`, `casual`, `athletic`, `minimal` |
| `avatarPreferences.environmentTheme` | String (enum) | `office`, `outdoor`, `minimal`, `luxury` |
| `baselineAlignmentScore` | Number | min: 0, max: 100, default: 50 |

### Indexes
```javascript
{ userId: 1 }  // unique: true
```

---

## Model 3: Plan

**File:** `src/models/Plan.js`
**Collection:** `plans`

### Sub-schema: taskSchema

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `name` | String | Yes | trim, maxlength: 200 |
| `description` | String | No | trim, maxlength: 500 |
| `weight` | Number | Yes | 3=core, 1=support, 1.5=habit |
| `estimatedMins` | Number | No | min: 5, max: 480 |
| `completed` | Boolean | No | default: false |
| `isCore` | Boolean | No | default: false |
| `isHabit` | Boolean | No | default: false |

### Sub-schema: weeklySprintSchema

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `weekStartDate` | Date | Yes | Monday midnight UTC |
| `weekEndDate` | Date | Yes | Sunday 23:59 UTC |
| `coreActions` | taskSchema[] | No | max 3 (validator) |
| `supportingActions` | taskSchema[] | No | max 2 (validator) |
| `identityHabit` | taskSchema | No | Single task |
| `extraTasks` | taskSchema[] | No | User-added, weight=0 (non-scoring) |
| `rerollCount` | Number | No | default: 0, max: 3 |
| `generatedByAI` | Boolean | No | default: true |
| `adaptiveLevel` | Number | No | min: 1, max: 5, default: 1 |

### Plan fields

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `userId` | ObjectId (ref: User) | Yes | |
| `quarterTheme` | String | No | trim |
| `quarterStartDate` | Date | No | |
| `quarterEndDate` | Date | No | |
| `macroObjectives` | String[] | No | max 3 (validator) |
| `successMetrics` | String[] | No | |
| `monthlyPlans` | Array | No | max 3 (months 1-3) |
| `monthlyPlans[].month` | Date | No | First day of month |
| `monthlyPlans[].objectives` | String[] | No | max 3 |
| `monthlyPlans[].measurableTargets` | String[] | No | |
| `weeklySprints` | weeklySprintSchema[] | No | |
| `isActive` | Boolean | No | default: true |
| `archivedAt` | Date | No | default: null |
| `createdAt` | Date | Auto | timestamps |
| `updatedAt` | Date | Auto | timestamps |

### Indexes
```javascript
{ userId: 1 }
{ userId: 1, isActive: 1 }
{ 'weeklySprints.weekStartDate': -1 }
```

---

## Model 4: DailyExecutionLog

**File:** `src/models/DailyExecutionLog.js`
**Collection:** `dailyexecutionlogs`

### Sub-schema: completedTaskSchema

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `taskId` | ObjectId | No | ref to Plan sprint task |
| `taskName` | String | Yes | |
| `weight` | Number | Yes | |
| `isCore` | Boolean | No | default: false |
| `isHabit` | Boolean | No | default: false |
| `completed` | Boolean | No | default: false |
| `effortScore` | Number | No | min: 1, max: 10 |
| `completedAt` | Date | No | |

> `{ _id: false }` on completedTaskSchema

### DailyExecutionLog fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `userId` | ObjectId (ref: User) | Yes | Part of compound unique index |
| `date` | Date | Yes | **UTC midnight of user's local day** — normalized via `date.util.js` |
| `tasks` | completedTaskSchema[] | No | |
| `identityHabitDone` | Boolean | No | default: false |
| `deepWorkMinutes` | Number | No | default: 0, min: 0 |
| `intentDeclared` | Boolean | No | default: false |
| `intentDeclaredAt` | Date | No | |
| `voiceCommitmentUrl` | String | No | S3 URL of morning voice commit |
| `coreCompletionPct` | Number | No | 0-100, computed by exec.service.js |
| `supportCompletionPct` | Number | No | 0-100, computed |
| `averageEffort` | Number | No | 0-10, computed average |
| `isMissedDay` | Boolean | No | default: false — set by sweep worker |
| `createdAt` | Date | Auto | |
| `updatedAt` | Date | Auto | |

### Indexes
```javascript
{ userId: 1, date: 1 }   // unique: true — one log per user per day
{ userId: 1, date: -1 }
{ date: -1 }              // For sweep worker to find all users on a date
```

---

## Model 5: AlignmentMetric

**File:** `src/models/AlignmentMetric.js`
**Collection:** `alignmentmetrics`

### Fields

| Field | Type | Required | Validation | Notes |
|-------|------|----------|-----------|-------|
| `userId` | ObjectId (ref: User) | Yes | Part of compound index | |
| `date` | Date | Yes | Part of compound unique | UTC midnight of local day (same as DailyExecutionLog) |
| `alignmentScore` | Number | Yes | min: 0, max: 100 | Final score after streak multiplier |
| `rawScore` | Number | No | min: 0, max: 100 | Before multiplier |
| `streakMultiplier` | Number | No | default: 1 | 1.0, 1.05, or 1.10 |
| `driftIndex` | Number | No | min: -1, max: 1, default: 0 | Positive = trending up |
| `sevenDayAverage` | Number | No | min: 0, max: 100 | Rolling 7-day average |
| `streakCount` | Number | No | default: 0 | Consecutive days above 50 |
| `stateLevel` | Number (enum) | No | `1`, `2`, or `3` | Avatar state level |
| `patternFlags` | String[] | No | | e.g. `['MIDWEEK_DRIFT', 'EFFORT_INFLATION']` |
| `components.coreCompletion` | Number | No | | Debug breakdown |
| `components.supportCompletion` | Number | No | | |
| `components.habitCompletion` | Number | No | | 0 or 100 |
| `components.effortNormalized` | Number | No | | effort mapped to 0-100 |
| `components.reflectionQuality` | Number | No | | 0-100 |
| `createdAt` | Date | Auto | | |
| `updatedAt` | Date | Auto | | |

### Indexes
```javascript
{ userId: 1, date: 1 }   // unique: true
{ userId: 1, date: -1 }
{ alignmentScore: -1 }    // For platform analytics
```

---

## Model 6: JournalEntry

**File:** `src/models/JournalEntry.js`
**Collection:** `journalentries`

### Fields

| Field | Type | Required | Validation | Notes |
|-------|------|----------|-----------|-------|
| `userId` | ObjectId (ref: User) | Yes | | |
| `date` | Date | Yes | | UTC midnight of local day |
| `reflectionText` | String | No | trim, min: 10, max: 5000 | User's written reflection |
| `voiceUrl` | String | No | | S3 URL (voice input) |
| `inputMode` | String (enum) | No | `text`, `voice` | default: 'text' |
| `wordCount` | Number | No | default: 0 | Computed on save |
| `aiFeedback` | String | No | | AI-generated response (async) |
| `aiTone` | String (enum) | No | `encouraging`, `firm`, `neutral`, `strategic` | Set by reflection worker |
| `aiAudioUrl` | String | No | | Pre-signed S3 URL for TTS response (premium) |
| `reflectionQualityScore` | Number | No | min: 0, max: 100, default: 0 | Final score (AI-adjusted) |
| `baselineScore` | Number | No | min: 0, max: 100 | Before AI adjustment |
| `alignmentDelta` | Number | No | default: 0 | Score change suggested by AI (-5 to +5) |
| `analysisFlags.hasAccountability` | Boolean | No | | AI flag |
| `analysisFlags.hasExcuses` | Boolean | No | | AI flag |
| `analysisFlags.hasGrowthMindset` | Boolean | No | | AI flag |
| `analysisFlags.specificity` | Number | No | min: 0, max: 10 | AI-rated specificity |
| `tags` | String[] | No | enum: `win`, `failure`, `insight`, `focus`, `energy`, `gratitude` | |
| `processingStatus` | String (enum) | No | `pending`, `processing`, `completed`, `failed` | default: 'pending' |
| `processedAt` | Date | No | | When AI processing completed |
| `createdAt` | Date | Auto | | |
| `updatedAt` | Date | Auto | | |

### Indexes
```javascript
{ userId: 1, date: -1 }
{ tags: 1 }
{ userId: 1, processingStatus: 1 }
{ reflectionText: 'text' }   // Full-text search index
```

---

## Model 7: WeeklyReview

**File:** `src/models/WeeklyReview.js`
**Collection:** `weeklyreviews`

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `userId` | ObjectId (ref: User) | Yes | |
| `weekStartDate` | Date | Yes | Monday midnight UTC |
| `weekEndDate` | Date | Yes | Sunday 23:59 UTC |
| `averageAlignmentScore` | Number | No | Computed from 7 metrics |
| `bestDay` | Date | No | Highest score day |
| `bestDayScore` | Number | No | |
| `weakestDay` | Date | No | Lowest score day |
| `weakestDayScore` | Number | No | |
| `totalDeepWorkMins` | Number | No | default: 0 |
| `habitConsistencyPct` | Number | No | % of days habit was done |
| `taskCompletionPct` | Number | No | avg core completion % |
| `progressCard` | String | No | AI-generated summary (3-4 sentences) |
| `behavioralInsight` | String | No | AI-generated key insight |
| `driftTrend` | String (enum) | No | `improving`, `stable`, `declining` |
| `patternsSeen` | String[] | No | Pattern flags detected this week |
| `generatedAt` | Date | No | When AI review was run |
| `createdAt` | Date | Auto | |
| `updatedAt` | Date | Auto | |

### Indexes
```javascript
{ userId: 1, weekStartDate: -1 }
```

---

## Redis Key Reference

| Key Pattern | Factory Function | TTL |
|-------------|-----------------|-----|
| `revup:auth:refresh:{userId}` | `REDIS_KEYS.refreshToken(userId)` | 604800s (7d) |
| `revup:auth:reset:{email}` | `REDIS_KEYS.passwordReset(email)` | 3600s (1h) |
| `revup:auth:version:{userId}` | `REDIS_KEYS.sessionVersion(userId)` | No TTL |
| `revup:cache:identity:{userId}` | `REDIS_KEYS.identityCache(userId)` | 3600s (1h) |
| `revup:cache:plan:{userId}:{week}` | `REDIS_KEYS.planCache(userId, week)` | 604800s (7d) |
| `revup:cache:avatar:{userId}` | `REDIS_KEYS.avatarStateCache(userId)` | 1800s (30min) |
| `revup:cache:dashboard:{userId}` | `REDIS_KEYS.dashboardCache(userId)` | 1800s (30min) |
| `revup:limit:ai:{userId}:{weekKey}` | `REDIS_KEYS.aiUsageWeekly(userId, weekKey)` | End of week |
| `revup:limit:reroll:{userId}:{weekKey}` | `REDIS_KEYS.sprintRerolls(userId, weekKey)` | End of week |
| `revup:lock:alignment:{userId}` | `REDIS_KEYS.alignmentLock(userId)` | 30s |
| `revup:sweep:{userId}:{date}` | `REDIS_KEYS.midnightSwept(userId, date)` | 172800s (48h) |
| `revup:notif:drift:{userId}` | `REDIS_KEYS.lastDriftAlert(userId)` | 604800s (7d) |
| `revup:fcm:token:{userId}` | `REDIS_KEYS.fcmToken(userId)` | 2592000s (30d) |

---

## Constants Reference (`src/config/constants.js`)

```javascript
// Queue Names
QUEUES = { ALIGNMENT, REFLECTION, REVIEW, SWEEP, MORNING, EVENING }

// Job Names
JOBS = { RECALCULATE, PROCESS_REFLECTION, WEEKLY_REVIEW, SWEEP_USERS, SEND_MORNING, SEND_EVENING }

// Auth
TIERS = { FREE: 'free', PREMIUM: 'premium' }
AUTH_PROVIDERS = { LOCAL: 'local', GOOGLE: 'google', APPLE: 'apple' }

// Avatar
AVATAR_LEVELS = { DIMINISHED: 1, STABLE: 2, ALIGNED: 3 }

// Alignment thresholds
ALIGNMENT = {
  STREAK_BREAK_SCORE: 50,        // Score must be >= 50 to continue streak
  STREAK_THRESHOLD_LOW: 3,       // streak > 3 → 1.05x multiplier
  STREAK_THRESHOLD_HIGH: 7,      // streak > 7 → 1.10x multiplier
  MULTIPLIER_LOW: 1.05,
  MULTIPLIER_HIGH: 1.10,
  STATE_STABLE_MIN: 45,          // avg < 45 → Diminished
  STATE_ALIGNED_MIN: 75,         // avg > 75 + drift >= 0 → Aligned
  DRIFT_DANGER: -0.4,            // drift < -0.4 for 3 consecutive days → Diminished
  MISSED_DAY_PENALTY: 0.10,      // 10% deduction from last score
}

// Pattern detection thresholds
PATTERNS = {
  MIDWEEK_DRIFT: { DROP_THRESHOLD: 15, WEEKS_REQUIRED: 3 },
  EFFORT_INFLATION: { EFFORT_MIN: 8, COMPLETION_MAX: 50, DAYS_REQUIRED: 3 },
  OVERCOMMIT: { COMPLETION_MAX: 40, DAYS_REQUIRED: 5 },
}

// Plan limits
PLAN_LIMITS = {
  MAX_CORE_ACTIONS: 3,
  MAX_SUPPORT_ACTIONS: 2,
  MAX_EXTRA_TASKS: 5,
  MAX_REROLLS_PER_WEEK: 3,
  ADAPTIVE_STREAK_UNLOCK: 14,
}

// Score weights (must sum to 1.0)
SCORE_WEIGHTS = {
  CORE: 0.50,
  SUPPORT: 0.20,
  HABIT: 0.15,
  EFFORT: 0.10,
  REFLECTION: 0.05,
}

// Pagination
PAGINATION = { DEFAULT_PAGE: 1, DEFAULT_LIMIT: 20, MAX_LIMIT: 100 }

// Notification types
NOTIFICATION_TYPES = { MORNING_REMINDER, EVENING_REMINDER, DRIFT_ALERT, STREAK_MILESTONE, WEEKLY_REVIEW }
```

---

## BullMQ Queue Contracts

### alignmentQueue — Job payload
```typescript
{
  userId: string;    // MongoDB ObjectId string
  date: string;      // ISO UTC midnight date string
  trigger?: 'task_complete' | 'reflection_done' | 'sweep' | 'log_edit' | 'admin_calibrate';
}
```

### reflectionQueue — Job payload
```typescript
{
  journalEntryId: string;
  userId: string;
  date: string;
}
```

### reviewQueue — Job payload
```typescript
{
  userId: string;
  weekStart: string;  // ISO date string (Monday midnight UTC)
}
```

### sweepQueue — Job payload
```typescript
{
  date: string;  // ISO date of the day being swept (yesterday's date)
}
```

### morningQueue / eveningQueue — Job payload
```typescript
{}  // No payload — worker queries all eligible users
```
