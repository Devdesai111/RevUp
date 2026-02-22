# REVUP BACKEND — COMPLETE TASK LIST (102 Tasks)
> **Source of truth for implementation order.**
> Complete tasks strictly in order. Never skip. Each task has exact files, implementation notes, and test requirements.

---

## PHASE 1 — CORE INFRASTRUCTURE (Tasks 1–5)

---

### TASK 1: Initialize Express App & Server Skeleton
**Phase:** 1 | **Priority:** CRITICAL | **Depends On:** None

**Files to create:**
- `src/app.js`
- `src/server.js`
- `src/config/env.js`
- `.env.example`
- `.gitignore`
- `src/tests/setup.js`
- `src/tests/teardown.js`

**Implementation notes:**
- `src/app.js` exports configured Express app — does NOT call `.listen()`
- `src/server.js` imports app, connects DB + Redis, calls `app.listen(PORT)`
- `src/config/env.js` uses Zod to validate ALL environment variables at startup — process.exit(1) on invalid
- Mount only `GET /api/v1/health` in this task — returns `{ status: "ok", mongo: "connected", redis: "connected" }`
- Load dotenv at top of `server.js` with `require('dotenv').config()`
- `src/tests/setup.js` starts MongoMemoryServer, sets `process.env.MONGO_URI` to its URI
- `src/tests/teardown.js` stops MongoMemoryServer

**env.js Zod schema must include ALL these fields:**
PORT, NODE_ENV, MONGO_URI, MONGO_URI_TEST, MONGO_MAX_POOL_SIZE, REDIS_URL, REDIS_KEY_PREFIX, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY, OPENAI_API_KEY, OPENAI_MODEL_SYNTHESIS, OPENAI_MODEL_REFLECTION, OPENAI_MODEL_PLANNING, OPENAI_MODEL_TTS, OPENAI_MODEL_STT, OPENAI_MAX_RETRIES, OPENAI_TIMEOUT_MS, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET, AWS_S3_URL_EXPIRY, RESEND_API_KEY, EMAIL_FROM, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, FCM_SERVER_KEY, **FCM_PROJECT_ID** (Bug 1), **FRONTEND_APP_URL** (Bug 1), FRONTEND_WEB_URL, CORS_ALLOWED_ORIGINS, RATE_LIMIT_GLOBAL_MAX, RATE_LIMIT_GLOBAL_WINDOW_MS, RATE_LIMIT_AUTH_MAX, RATE_LIMIT_AUTH_WINDOW_MS, RATE_LIMIT_AI_FREE_DAILY, FEATURE_VOICE_ONBOARDING, FEATURE_TTS_RESPONSE, **FCM_SERVICE_ACCOUNT_JSON** (Bug B), **BULL_BOARD_ENABLED** (Bug B)

---

### TASK 2: Global Error Handler & Pino Logger
**Phase:** 1 | **Priority:** CRITICAL | **Depends On:** Task 1

**Files to create:**
- `src/utils/logger.js`
- `src/utils/AppError.js`
- `src/utils/response.util.js`
- `src/middlewares/error.mid.js`

**Files to modify:**
- `src/app.js` (add pino-http middleware + error handler)

**Implementation notes:**
- `logger.js`: Pino with pretty transport in dev, JSON in production. Include `requestId`, `userId`, `method`, `url`, `statusCode`, `responseTime` in log fields
- `AppError.js`: Custom error class with `message`, `statusCode`, `code`, `errors[]`, `isOperational: true`
- `AppError.js` must export BOTH `AppError` class AND `Errors.*` factory methods (USER_EXISTS, INVALID_CREDENTIALS, UNAUTHORIZED, FORBIDDEN, TOKEN_EXPIRED, INVALID_TOKEN, NOT_FOUND, IDENTITY_NOT_FOUND, PLAN_NOT_FOUND, VALIDATION_ERROR, OVERCOMMIT, RATE_LIMIT_EXCEEDED, AI_LIMIT_EXCEEDED, PREMIUM_REQUIRED, AI_UNAVAILABLE, AUDIO_TOO_LARGE, INVALID_AUDIO_FORMAT)
- `response.util.js`: `sendSuccess`, `sendCreated`, `sendAccepted`, `sendError`, `sendPaginated`
- `error.mid.js`: Handle Mongoose ValidationError (400), duplicate key 11000 (409), JWT errors (401), generic AppError, fallback 500
- Never expose stack trace in production (`env.NODE_ENV !== 'production'` check)
- Apply `pino-http` as request logger middleware in `app.js` BEFORE routes

---

### TASK 3: MongoDB Connection with Graceful Shutdown
**Phase:** 1 | **Priority:** CRITICAL | **Depends On:** Tasks 1, 2

**Files to create:**
- `src/config/db.js`

**Files to modify:**
- `src/server.js`

**Implementation notes:**
- Options: `maxPoolSize: 100`, `serverSelectionTimeoutMS: 5000`, `socketTimeoutMS: 45000`
- Connection retry: on error → log + wait 5s → retry (max 5 attempts → `process.exit(1)`)
- Use `MONGO_URI_TEST` when `NODE_ENV === 'test'`, else `MONGO_URI`
- Listen on Mongoose connection events: `connected`, `error`, `disconnected`
- `gracefulShutdown(signal)` in `server.js`: close HTTP server → close workers (added in Task 77) → close mongoose → close redis → `process.exit(0)`
- Register: `process.on('SIGTERM', ...)`, `process.on('SIGINT', ...)`

---

### TASK 4: Redis Client Setup
**Phase:** 1 | **Priority:** CRITICAL | **Depends On:** Tasks 1, 2

**Files to create:**
- `src/config/redis.js`
- `src/config/redis-keys.js`

**Files to modify:**
- `src/server.js`

**Implementation notes:**
- Create ioredis client: `new Redis(env.REDIS_URL, { keyPrefix: env.REDIS_KEY_PREFIX, lazyConnect: false })`
- Export as singleton — never create new Redis instances in other files
- Log `Redis connected` on `ready` event, log on `error`, log reconnect attempts on `reconnecting`
- `redis-keys.js` exports key factory functions (NOT strings):
  - `refreshToken(userId)` → `auth:refresh:${userId}`
  - `passwordReset(email)` → `auth:reset:${email}`
  - `sessionVersion(userId)` → `auth:version:${userId}`
  - `identityCache(userId)` → `cache:identity:${userId}`
  - `planCache(userId, week)` → `cache:plan:${userId}:${week}`
  - `avatarStateCache(userId)` → `cache:avatar:${userId}`
  - `dashboardCache(userId)` → `cache:dashboard:${userId}`
  - `aiUsageWeekly(userId, weekKey)` → `limit:ai:${userId}:${weekKey}`
  - `sprintRerolls(userId, weekKey)` → `limit:reroll:${userId}:${weekKey}`
  - `alignmentLock(userId)` → `lock:alignment:${userId}`
  - `midnightSwept(userId, date)` → `sweep:${userId}:${date}`
  - `lastDriftAlert(userId)` → `notif:drift:${userId}`
  - `fcmToken(userId)` → `fcm:token:${userId}`

**TTL reference:**
| Key | TTL |
|-----|-----|
| auth:refresh | 604800s (7d) |
| auth:reset | 3600s (1h) |
| cache:identity | 3600s (1h) |
| cache:plan | 604800s (7d) |
| cache:avatar | 1800s (30min) |
| lock:alignment | 30s |
| limit:ai | until end of week |
| notif:drift | 604800s (7d) |

---

### TASK 5: Global Middlewares (CORS, Helmet, Rate Limiter)
**Phase:** 1 | **Priority:** CRITICAL | **Depends On:** Tasks 1, 4

**Files to create:**
- `src/middlewares/rateLimit.mid.js`

**Files to modify:**
- `src/app.js`

**Implementation notes:**
- CORS: `origin: env.CORS_ALLOWED_ORIGINS.split(',')`, `allowedHeaders: ['Content-Type', 'Authorization']`, `credentials: true`
- Helmet: all defaults, `contentSecurityPolicy: false`
- Global rate limit: `max: env.RATE_LIMIT_GLOBAL_MAX`, `windowMs: env.RATE_LIMIT_GLOBAL_WINDOW_MS`, store in Redis via `rate-limit-redis`
- Auth rate limit (exported separately): `max: env.RATE_LIMIT_AUTH_MAX`, `windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS` — applied per-router in auth routes
- `RedisStore({ client: redis, prefix: 'rl:' })`
- On limit exceeded: call `next(Errors.RATE_LIMIT_EXCEEDED())`

---

## PHASE 2 — DATABASE MODELS (Tasks 6–12)

---

### TASK 6: User Model
**Phase:** 2 | **Priority:** CRITICAL | **Depends On:** Task 3

**Files to create:** `src/models/User.js`

**Fields:** email (unique, lowercase, trim), passwordHash (select: false), authProvider (local/google/apple), subscriptionTier (free/premium), timezone, notificationPreferences.{morning,evening,drift,streak}, fcmToken, isActive, isAdmin, tokenVersion, stripeCustomerId, lastLoginAt, timestamps

**Indexes:** `{ email: 1 }` unique, `{ subscriptionTier: 1 }`, `{ isActive: 1 }`

**toJSON transform:** remove `passwordHash` and `__v` from all responses

---

### TASK 7: IdentityProfile Model
**Phase:** 2 | **Priority:** CRITICAL | **Depends On:** Task 6

**Files to create:** `src/models/IdentityProfile.js`

**Fields:** userId (ref User, unique), currentIdentity.{role, energyLevel(1-10), executionGap(enum), executionGapSeverity(1-5), strengths[], weaknesses[], frustrationPoint, disciplineBreakPattern}, futureIdentity.{desiredRole, incomeRange, skillGoals[], healthTarget, confidenceTarget, lifestyleVision, declarationSentence}, blueprint.{behavioralRiskProfile, quarterlyDirection, keyInsight, synthesizedAt}, timeConstraints.{availableHoursPerDay, workHoursStart, workHoursEnd, sleepHours, focusWindowStart, focusWindowEnd, fixedCommitments[]}, riskProfile.{stabilityScore, procrastinationIndex, driftProbability, rawAnswers[]}, priorityPillars(max 3 validator), avatarPreferences.{genderPresentation, skinTone, clothingStyle, environmentTheme}, onboardingSteps.{currentIdentityDone, futureIdentityDone, constraintsDone, riskAssessmentDone, pillarsSelected, synthesized, avatarCreated}, baselineAlignmentScore

**Index:** `{ userId: 1 }` unique

---

### TASK 8: Plan Model
**Phase:** 2 | **Priority:** CRITICAL | **Depends On:** Task 6

**Files to create:** `src/models/Plan.js`

**Sub-schemas:**
- `taskSchema`: name, description, weight, estimatedMins, completed, isCore, isHabit
- `weeklySprintSchema`: weekStartDate, weekEndDate, coreActions(max 3), supportingActions(max 2), identityHabit, extraTasks[], rerollCount(max 3), generatedByAI, adaptiveLevel(1-5)

**Plan fields:** userId, quarterTheme, quarterStartDate, quarterEndDate, macroObjectives(max 3), successMetrics[], monthlyPlans[{month, objectives(max 3), measurableTargets[]}], weeklySprints[], isActive, archivedAt

**Indexes:** `{ userId: 1 }`, `{ userId: 1, isActive: 1 }`, `{ weeklySprints.weekStartDate: -1 }`

---

### TASK 9: DailyExecutionLog Model
**Phase:** 2 | **Priority:** CRITICAL | **Depends On:** Task 6

**Files to create:** `src/models/DailyExecutionLog.js`

**Sub-schema — completedTaskSchema:** taskId, taskName, weight, isCore, isHabit, completed, effortScore(1-10), completedAt

**Fields:** userId, date (UTC midnight of local day), tasks[], identityHabitDone, deepWorkMinutes, intentDeclared, intentDeclaredAt, voiceCommitmentUrl, coreCompletionPct(0-100), supportCompletionPct(0-100), averageEffort(0-10), isMissedDay

**Indexes:** `{ userId, date }` unique compound, `{ userId, date: -1 }`, `{ date: -1 }` (for sweep job)

---

### TASK 10: AlignmentMetric Model
**Phase:** 2 | **Priority:** CRITICAL | **Depends On:** Task 6

**Files to create:** `src/models/AlignmentMetric.js`

**Fields:** userId, date, alignmentScore(0-100), rawScore, streakMultiplier, driftIndex(-1 to 1), sevenDayAverage(0-100), streakCount, stateLevel(enum: 1|2|3), patternFlags[], components.{coreCompletion, supportCompletion, habitCompletion, effortNormalized, reflectionQuality}

**Indexes:** `{ userId, date }` unique, `{ userId, date: -1 }`, `{ alignmentScore: -1 }`

---

### TASK 11: JournalEntry + WeeklyReview Models
**Phase:** 2 | **Priority:** HIGH | **Depends On:** Task 6

**Files to create:** `src/models/JournalEntry.js`, `src/models/WeeklyReview.js`

**JournalEntry fields:** userId, date, reflectionText(10-5000), voiceUrl, inputMode(text/voice), wordCount, aiFeedback, aiTone(encouraging/firm/neutral/strategic), aiAudioUrl, reflectionQualityScore(0-100), baselineScore, alignmentDelta, analysisFlags.{hasAccountability, hasExcuses, hasGrowthMindset, specificity(0-10)}, tags(enum array), processingStatus(pending/processing/completed/failed), processedAt

**JournalEntry indexes:** `{ userId, date: -1 }`, `{ tags: 1 }`, `{ userId, processingStatus: 1 }`, `{ reflectionText: 'text' }` (full-text)

**WeeklyReview fields:** userId, weekStartDate, weekEndDate, averageAlignmentScore, bestDay, bestDayScore, weakestDay, weakestDayScore, totalDeepWorkMins, habitConsistencyPct, taskCompletionPct, progressCard, behavioralInsight, driftTrend(improving/stable/declining), patternsSeen[], generatedAt

---

### TASK 12: Zod Validation Middleware + Constants
**Phase:** 2 | **Priority:** CRITICAL | **Depends On:** None

**Files to create:** `src/middlewares/validate.mid.js`, `src/config/constants.js`

**validate.mid.js implementation:**
```js
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  if (!result.success) {
    const errors = result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    return next(Errors.VALIDATION_ERROR(errors));
  }
  // Assign validated & transformed values back to request
  if (result.data.body)   req.body   = result.data.body;
  if (result.data.query)  req.query  = result.data.query;
  if (result.data.params) req.params = result.data.params;
  next();
};
```

**constants.js must export:** QUEUES, JOBS, TIERS, AUTH_PROVIDERS, AVATAR_LEVELS, ALIGNMENT, TASK_WEIGHTS, SCORE_WEIGHTS, REFLECTION_QUALITY, PATTERNS, FREE_LIMITS, PAGINATION, PLAN_LIMITS, NOTIFICATION_TYPES

---

## PHASE 3 — AUTHENTICATION SYSTEM (Tasks 13–19)

---

### TASK 13: Auth Utilities (Hash + JWT)
**Phase:** 3 | **Priority:** CRITICAL | **Depends On:** None

**Files to create:** `src/utils/hash.util.js`, `src/utils/jwt.util.js`

**hash.util.js:**
- `hashPassword(plain)` → bcrypt hash, 10 salt rounds
- `comparePassword(plain, hash)` → boolean

**jwt.util.js:**
- `generateAccessToken(user)` → payload `{ sub: userId, tier, version: tokenVersion }`, signs with `JWT_ACCESS_SECRET`
- `generateRefreshToken(user)` → payload `{ sub: userId, version: tokenVersion }`, signs with `JWT_REFRESH_SECRET`
- `verifyToken(token, secret)` → decoded payload or throws `Errors.TOKEN_EXPIRED()` / `Errors.INVALID_TOKEN()`

---

### TASK 14: Auth Validators
**Phase:** 3 | **Priority:** HIGH | **Depends On:** Task 12

**Files to create:** `src/validators/auth.validator.js`

**Schemas:**
- `registerSchema`: `{ body: { email: z.string().email().toLowerCase().trim(), password: z.string().min(8) } }`
- `loginSchema`: same as register
- `forgotSchema`: `{ body: { email: z.string().email() } }`
- `resetSchema`: `{ body: { token: z.string(), newPassword: z.string().min(8) } }`
- `updateMeSchema`: `{ body: { timezone: z.string().optional(), notificationPreferences: z.object({...}).optional() } }`
- `refreshSchema`: `{ body: { refreshToken: z.string() } }`
- `logoutSchema`: `{ body: { refreshToken: z.string() } }`

---

### TASK 15: Auth Service Logic
**Phase:** 3 | **Priority:** CRITICAL | **Depends On:** Tasks 6, 13

**Files to create:** `src/services/auth/auth.service.js`

**Functions:**
- `registerUser(email, password)` → check duplicate → hash → create User → generate tokens → store refresh in Redis (TTL 7d) → return `{ user, accessToken, refreshToken }`
- `loginUser(email, password)` → find with `.select('+passwordHash')` → compare → check isActive → update lastLoginAt → generate tokens → store refresh in Redis → return tokens
- `refreshTokens(refreshToken)` → verify against `JWT_REFRESH_SECRET` → fetch user → check `tokenVersion` matches → generate new pair → delete old from Redis → store new → return tokens
- `logoutUser(userId, refreshToken)` → `redis.del(REDIS_KEYS.refreshToken(userId))`
- `logoutAll(userId)` → `User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } })` → `redis.del(...)` → all existing JWTs rejected

---

### TASK 16: Auth Middlewares
**Phase:** 3 | **Priority:** CRITICAL | **Depends On:** Tasks 13, 6

**Files to create:** `src/middlewares/auth.mid.js`, `src/middlewares/role.mid.js`

**requireAuth:** Extract `Bearer <token>` from Authorization header → `verifyToken(token, JWT_ACCESS_SECRET)` → fetch user from DB → check `user.isActive` → attach to `req.user` → `next()`

**requireRole(allowedTiers):** Check `req.user.subscriptionTier` in `allowedTiers` → else `next(Errors.PREMIUM_REQUIRED(feature))`

**requireAdmin:** Check `req.user.isAdmin === true` → else `next(Errors.FORBIDDEN())`

---

### TASK 17: Auth Controllers & Routes
**Phase:** 3 | **Priority:** CRITICAL | **Depends On:** Tasks 14, 15, 16

**Files to create:** `src/controllers/auth.controller.js`, `src/routes/auth.routes.js`

**Files to modify:** `src/routes/index.js`, `src/app.js`

**Controller functions:** `register`, `login`, `googleOAuth`, `appleOAuth`, `getMe`, `updateMe`, `refresh`, `logout`, `logoutAll`, `forgotPassword`, `resetPassword`, `deleteAccount`

**Route wiring:**
- POST /register → authRateLimit + validate(registerSchema) + register
- POST /login → authRateLimit + validate(loginSchema) + login
- POST /google → googleOAuth
- POST /apple → appleOAuth
- GET /me → requireAuth + getMe
- PATCH /me → requireAuth + validate(updateMeSchema) + updateMe
- POST /refresh → validate(refreshSchema) + refresh
- POST /logout → requireAuth + validate(logoutSchema) + logout
- POST /logout-all → requireAuth + logoutAll
- POST /forgot → authRateLimit + validate(forgotSchema) + forgotPassword
- POST /reset → validate(resetSchema) + resetPassword
- DELETE /account → requireAuth + deleteAccount

---

### TASK 18: OAuth Service (Google + Apple)
**Phase:** 3 | **Priority:** MEDIUM | **Depends On:** Task 15

**Files to create:** `src/services/auth/oauth.service.js`

**Functions:**
- `verifyGoogleToken(idToken)` → in dev/test: mock decode. In prod: call `https://oauth2.googleapis.com/tokeninfo?id_token=...` → return `{ email, name, googleId }`
- `verifyAppleToken(idToken)` → placeholder that decodes without full validation in dev
- `findOrCreateOAuthUser(email, provider)` → `User.findOneAndUpdate({ email }, { authProvider: provider }, { upsert: true, new: true })`

---

### TASK 19: Password Reset Flow
**Phase:** 3 | **Priority:** HIGH | **Depends On:** Tasks 4, 15

**Files to create:** `src/services/auth/reset.service.js`

**Functions:**
- `generateResetToken(email)` → `crypto.randomBytes(32).toString('hex')` → `redis.set(REDIS_KEYS.passwordReset(email), token, 'EX', 3600)` → return token (caller passes to email service)
- `applyPasswordReset(token, email, newPassword)` → get from Redis → compare → hash new → update User.passwordHash → `$inc: { tokenVersion: 1 }` → `redis.del(...)` → done

**Note:** POST /forgot always returns 200 (never reveal if email exists)

---

## PHASE 4 — IDENTITY & ONBOARDING (Tasks 20–27)

---

### TASK 20: Identity Validators
**Phase:** 4 | **Priority:** HIGH | **Depends On:** Task 12

**Files to create:** `src/validators/identity.validator.js`

**Schemas:**
- `currentIdentitySchema`: role(max 100), energyLevel(1-10 int), executionGap(enum: focus|consistency|motivation|clarity|time), executionGapSeverity(1-5 int), strengths(array max 5 strings), weaknesses(array max 5 strings), frustrationPoint(max 500)
- `futureIdentitySchema`: desiredRole, incomeRange, skillGoals(array max 5), healthTarget(1-10), confidenceTarget(1-10), lifestyleVision(max 1000), declarationSentence(max 300)
- `constraintsSchema`: availableHoursPerDay(0.5-16), workHoursStart(regex HH:MM), workHoursEnd(regex HH:MM), sleepHours(4-12), focusWindowStart(HH:MM optional), focusWindowEnd(HH:MM optional)
- `riskSchema`: answers(array of exactly 6 integers, each 1-5)
- `pillarsSchema`: pillars(array 2-3 strings, not empty)
- `avatarBaseSchema`: genderPresentation, skinTone, clothingStyle, environmentTheme (all optional)
- `declarationSchema`: declaration(string 10-300)

---

### TASK 21: Risk Scoring Service (Pure Math)
**Phase:** 4 | **Priority:** HIGH | **Depends On:** None

**Files to create:** `src/services/identity/risk.service.js`

**Formula (6 answers, each 1-5):**
```
stabilityScore = 100 - ((answers[1] + answers[4] + answers[5]) / 3) * 20
procrastinationIndex = ((answers[0] + answers[2]) / 2) * 20
driftProbability = ((answers[0] + answers[1] + answers[2] + answers[5]) / 4) / 5
```
All results clamped to valid ranges. Returns `{ stabilityScore, procrastinationIndex, driftProbability, rawAnswers }`

---

### TASK 22: Baseline Score Calculator (Pure Math)
**Phase:** 4 | **Priority:** HIGH | **Depends On:** None

**Files to create:** `src/services/identity/baseline.util.js`

**Formula:**
```
base = 50
+ ((energyLevel - 5) * 2)       // -8 to +10
- (executionGapSeverity * 2)     // -2 to -10
- (driftProbability * 10)        // 0 to -10
= clamp(result, 0, 100)
```
Returns `{ baselineScore: number }`

---

### TASK 23: AI Orchestrator
**Phase:** 4 | **Priority:** CRITICAL | **Depends On:** None

**Files to create:** `src/services/ai/ai.orchestrator.js`

**Function:** `callLLM({ model, systemPrompt, userPrompt, maxTokens = 1000 })`
- Always use `response_format: { type: 'json_object' }`
- Retry up to `env.OPENAI_MAX_RETRIES` with exponential backoff (2s, 4s, 8s)
- Parse response JSON — throw `Errors.AI_UNAVAILABLE()` if not valid JSON after all retries
- Log token usage: `logger.info({ inputTokens, outputTokens, model }, 'AI call completed')`
- Never throw raw OpenAI errors to callers — wrap in `Errors.AI_UNAVAILABLE()`

---

### TASK 24: Identity Synthesis Service
**Phase:** 4 | **Priority:** CRITICAL | **Depends On:** Task 23

**Files to create:** `src/services/ai/prompts/synthesis.prompt.js`, `src/services/identity/synthesis.service.js`

**synthesizeIdentity(identityProfile):**
1. Build prompt using `buildSynthesisPrompt(identity)`
2. Call `callLLM({ model: env.OPENAI_MODEL_SYNTHESIS, ...prompt })`
3. Validate AI response with Zod: `{ behavioralRiskProfile, quarterlyDirection, keyInsight, suggestedDeclaration }` (all strings)
4. If Zod fails → retry once → throw `AI_UNAVAILABLE`
5. Calculate `baselineAlignmentScore` via `baseline.util.js`
6. Save to IdentityProfile: blueprint fields + baselineScore + `onboardingSteps.synthesized = true`
7. Return the synthesis object + baselineScore

---

### TASK 25: Identity Controllers & Routes
**Phase:** 4 | **Priority:** CRITICAL | **Depends On:** Tasks 7, 20, 21, 22, 24

**Files to create:** `src/controllers/identity.controller.js`, `src/routes/identity.routes.js`

**Controller functions:**
- `getProfile` → check Redis cache → DB fetch → cache 1hr → return
- `getOnboardingStatus` → compute `{ stepsComplete, totalSteps, percentComplete, nextStep }` from `onboardingSteps`
- `saveCurrentIdentity`, `saveFutureIdentity`, `saveConstraints` → upsert + set step flag + invalidate cache
- `submitRiskAssessment` → call `risk.service.calcRiskProfile(answers)` → upsert → set flag
- `selectPillars` → validate max 3 → upsert → set flag
- `synthesize` → check all prior steps done → call `synthesis.service.synthesizeIdentity()` → return result
- `saveAvatarBase` → upsert avatarPreferences + set `avatarCreated: true`
- `updateDeclaration` → update `futureIdentity.declarationSentence`
- `resetOnboarding` → Premium only → delete IdentityProfile → redirect to start
- `submitVoiceOnboarding` → Premium + feature flag → transcribe audio → save current identity from transcript (manual for now)

---

### TASK 26: Avatar Config Mapper
**Phase:** 4 | **Priority:** MEDIUM | **Depends On:** None

**Files to create:** `src/config/avatar-states.js`, `src/services/avatar/avatar.service.js`, `src/controllers/avatar.controller.js`, `src/routes/avatar.routes.js`

**avatar.service.js → getAvatarState(userId):**
1. Check `REDIS_KEYS.avatarStateCache(userId)` — return if hit
2. Fetch latest AlignmentMetric → get stateLevel (default 2 if no metrics)
3. Merge `AVATAR_STATES[stateLevel]` with user's `avatarPreferences` from IdentityProfile
4. Cache for 1800s → return

**Route:** `GET /api/v1/avatar/state` → requireAuth

---

### TASK 27: Voice Upload Wrapper
**Phase:** 4 | **Priority:** MEDIUM | **Depends On:** None

**Files to create:** `src/middlewares/upload.mid.js`, `src/services/voice/stt.service.js` (scaffold)

**upload.mid.js:**
- `multer({ storage: memoryStorage(), limits: { fileSize: 25MB }, fileFilter })`
- Allowed MIME types: audio/mpeg, audio/mp4, audio/m4a, audio/wav, audio/webm
- Invalid format → `next(Errors.INVALID_AUDIO_FORMAT())`

**stt.service.js scaffold:** `transcribe(buffer, mimetype)` function stub (full implementation in Task 55)

---

## PHASE 5 — PLANNING ENGINE (Tasks 28–34)

---

### TASK 28: Plan Validators + Constraint Util
**Phase:** 5 | **Priority:** HIGH | **Depends On:** Task 12

**Files to create:** `src/validators/plan.validator.js`, `src/utils/constraint.util.js`

**plan.validator.js schemas:** `generatePlanSchema`, `editSprintSchema`, `rerollSchema`, `addExtraTaskSchema`

**constraint.util.js — `checkOvercommit(tasks, availableHoursPerDay)`:**
- Sum estimated hours for all tasks weighted by type
- Core tasks × 3, support × 1, habit × 1.5
- If total weighted hours > `availableHoursPerDay * 1.5` → throw `Errors.OVERCOMMIT()`
- Returns `{ totalHours, weightedHours, isOvercommitted }`

---

### TASK 29: Quarter Plan Generator
**Phase:** 5 | **Priority:** HIGH | **Depends On:** Tasks 23, 7

**Files to create:** `src/services/planning/quarter.service.js`, `src/services/ai/prompts/planning.prompt.js`

**generateQuarterPlan(userId):**
1. Fetch IdentityProfile — throw `IDENTITY_NOT_FOUND` if not synthesized
2. Build prompt with `buildPlanningPrompt(identity, constraints)`
3. Call `callLLM({ model: env.OPENAI_MODEL_PLANNING, ...prompt })`
4. Validate response: `{ quarterTheme, macroObjectives: [{ title, pillar, successMetric, monthlyBreakdown[] }] }`
5. Create Plan document with quarterTheme, quarterStartDate (today), quarterEndDate (+90 days), macroObjectives, isActive: true
6. Archive previous active plan if exists
7. Return saved plan

---

### TASK 30: Monthly Plan Generator
**Phase:** 5 | **Priority:** HIGH | **Depends On:** Task 29

**Files to create:** `src/services/planning/month.service.js`

**generateMonthlyPlan(planId, monthNumber):**
- Fetch Plan document
- Derive monthly objectives from macroObjectives by month index
- Create `monthlyPlans[monthNumber]` with objectives and measurable targets derived from successMetrics
- Save and return

---

### TASK 31: Sprint Generator
**Phase:** 5 | **Priority:** HIGH | **Depends On:** Tasks 29, 28

**Files to create:** `src/services/planning/sprint.service.js`

**generateWeeklySprint(planId, weekStartDate):**
1. Fetch Plan + IdentityProfile
2. Determine current month objectives from monthlyPlans
3. Generate sprint tasks:
   - 3 core tasks (from quarter objectives, aligned to available hours)
   - 2 support tasks (supporting habits/skills)
   - 1 identity habit (from IdentityProfile priorities)
4. Run `checkOvercommit(tasks, availableHoursPerDay)` — reduce task count if needed
5. Assign weights via `weight.util.js`
6. Push new sprint to `weeklySprints[]` — save Plan
7. Return sprint

---

### TASK 32: Adaptive Difficulty Service
**Phase:** 5 | **Priority:** MEDIUM | **Depends On:** Tasks 29, 10

**Files to create:** `src/services/planning/adaptive.service.js`

**adaptDifficulty(userId, planId):**
- Fetch last 14 days of AlignmentMetrics
- If avg score > 75 AND streak > `PLAN_LIMITS.ADAPTIVE_STREAK_UNLOCK` (14) → increase `adaptiveLevel` on current sprint
- If avg score < 45 → decrease adaptiveLevel
- Scale task `estimatedMins` by `adaptiveLevel / 3` factor
- Returns `{ newAdaptiveLevel, adjusted: boolean }`

---

### TASK 33: Plan Controllers & Routes
**Phase:** 5 | **Priority:** CRITICAL | **Depends On:** Tasks 28–32

**Files to create:** `src/controllers/plan.controller.js`, `src/routes/plan.routes.js`

**Controller functions:** `generateQuarterPlan`, `generateMonthlyPlan`, `generateSprint`, `getCurrentPlan`, `getTodaysTasks`, `getPlanHistory`, `getPlanStats`, `editSprint`, `rerollSprint`, `addExtraTask`, `removeExtraTask`

**POST /plan/quarter:** 202 response — queue AI job OR block (if < 30s acceptable)
**GET /plan/today:** timezone-aware — use `req.user.timezone` to determine "today"'s sprint tasks
**POST /plan/sprint/reroll:** Check `sprintRerolls` Redis key — max 3 per week

---

### TASK 34: Date Utility
**Phase:** 5 | **Priority:** HIGH | **Depends On:** None

**Files to create:** `src/utils/date.util.js`

**Functions:**
- `toLocalMidnightUTC(dateStr, timezone)` → converts `YYYY-MM-DD` in user timezone to UTC midnight Date object
- `getLocalDayBounds(timezone)` → returns `{ startUTC, endUTC }` for current local day in given timezone
- `getISOWeekKey(date)` → returns `YYYY-WW` string for Redis week keys (uses `date-fns` `getISOWeek`)
- `getWeekBounds(date)` → returns `{ weekStart: Monday, weekEnd: Sunday }` for a given date

---

## PHASE 6 — EXECUTION LOGGING (Tasks 35–39)

---

### TASK 35: Execution Validators
**Phase:** 6 | **Priority:** HIGH | **Depends On:** Task 12

**Files to create:** `src/validators/exec.validator.js`

**Schemas:**
- `intentSchema`: `{ body: { date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), commitmentText: z.string().max(500).optional() } }`
- `logSchema`: tasks (array of `{ taskId, taskName, weight, isCore, isHabit, completed, effortScore(1-10) }`), habitDone (boolean), deepWorkMinutes (0-720)
- `timerSchema`: `{ body: { date: z.string(), minutes: z.number().min(1).max(720) } }`

---

### TASK 36: Execution Service
**Phase:** 6 | **Priority:** HIGH | **Depends On:** Tasks 9, 34

**Files to create:** `src/services/execution/exec.service.js`

**saveLog(userId, date, tasks, habitDone, deepWorkMinutes, timezone):**
1. `normalizedDate = toLocalMidnightUTC(date, timezone)`
2. Compute `coreCompletionPct`, `supportCompletionPct`, `averageEffort` from tasks array
3. Upsert `DailyExecutionLog` — `{ userId, date: normalizedDate }` with $set
4. Enqueue alignment recalculation: `enqueueAlignment({ userId, date: normalizedDate.toISOString(), trigger: 'task_complete' })`
5. Invalidate `dashboardCache` and `avatarStateCache`
6. Return saved log

---

### TASK 37: Timer Service
**Phase:** 6 | **Priority:** MEDIUM | **Depends On:** Task 9

**Files to create:** `src/services/execution/timer.service.js`

**syncTimer(userId, date, minutes, timezone):**
- `normalizedDate = toLocalMidnightUTC(date, timezone)`
- `DailyExecutionLog.findOneAndUpdate({ userId, date }, { $max: { deepWorkMinutes: minutes } }, { upsert: true, new: true })`
- Re-enqueue alignment if minutes increased
- Returns updated log

---

### TASK 38: Execution Controllers & Routes (POST/GET)
**Phase:** 6 | **Priority:** HIGH | **Depends On:** Tasks 35, 36, 37

**Files to create:** `src/controllers/exec.controller.js`, `src/routes/exec.routes.js`

**Controller functions:** `declareIntent`, `logTasks`, `syncTimer`, `uploadVoiceCommit`, `getTodayLog`

**Routes:**
- POST /execute/intent → requireAuth + validate(intentSchema) + declareIntent
- POST /execute/log → requireAuth + validate(logSchema) + logTasks
- POST /execute/timer → requireAuth + validate(timerSchema) + syncTimer
- POST /execute/commit-voice → requireAuth + requireRole(['premium']) + upload.single('audio') + uploadVoiceCommit
- GET /execute/today → requireAuth + getTodayLog

---

### TASK 39: Edit Log Route (PATCH)
**Phase:** 6 | **Priority:** HIGH | **Depends On:** Task 38

**Files to modify:** `src/controllers/exec.controller.js`, `src/routes/exec.routes.js`

**editLog controller:**
- Find log by `{ userId, date: normalizedDate }`
- `$set` only provided fields (tasks, habitDone, deepWorkMinutes)
- Recompute completion percentages inline
- Re-enqueue alignment with trigger `'log_edit'`
- Route: `PATCH /execute/log → requireAuth + validate(logSchema) + editLog`

---

## PHASE 7 — ALIGNMENT BRAIN (Tasks 40–44)

> **CRITICAL RULE: ZERO AI calls in this entire phase. Pure math only.**

---

### TASK 40: Score Service (Pure Math)
**Phase:** 7 | **Priority:** CRITICAL | **Depends On:** None

**Files to create:** `src/services/alignment/score.service.js`

**`calculateRawScore(exec, reflectionQuality = 0):`**
```
rawScore =
  (coreCompletion%    × 0.50) +   // max 50
  (supportCompletion% × 0.20) +   // max 20
  (habitCompletion    × 0.15) +   // max 15  (0 or 100)
  (effortNormalized   × 0.10) +   // max 10  (effort 1-10 → (effort-1)/9*100)
  (reflectionQuality  × 0.05)     // max  5
clamp to [0, 100]
```
Returns `{ rawScore, components }`

**`applyMultiplier(rawScore, multiplier):`** `Math.min(100, Math.round(rawScore * multiplier * 100) / 100)`

---

### TASK 41: Streak Service (Pure Math)
**Phase:** 7 | **Priority:** CRITICAL | **Depends On:** None

**Files to create:** `src/services/alignment/streak.service.js`

**`calculateStreak(rawScore, previousMetrics):`**
- Streak increments if yesterday's `alignmentScore >= ALIGNMENT.STREAK_BREAK_SCORE (50)`
- Streak resets to 0 if yesterday < 50
- `multiplier`: streak > 7 → 1.10, streak > 3 → 1.05, else 1.00
- Returns `{ streakCount, multiplier }`

---

### TASK 42: Drift Service (Pure Math)
**Phase:** 7 | **Priority:** CRITICAL | **Depends On:** None

**Files to create:** `src/services/alignment/drift.service.js`

**`calculateDrift(todayScore, previousMetrics):`**
- Rolling window: [todayScore, ...last 6 metrics scores]
- `sevenDayAverage = sum(window) / window.length`
- `driftIndex = (todayScore - sevenDayAverage) / sevenDayAverage` (0 if avg is 0)
- Clamp driftIndex to [-1.0, +1.0]
- Returns `{ driftIndex, sevenDayAverage }`

**`determineStateLevel(sevenDayAverage, driftIndex, previousMetrics):`**
- sustainedDanger = last 3 driftIndex all < ALIGNMENT.DRIFT_DANGER (-0.4)
- avg < 45 OR sustainedDanger → state 1
- avg > 75 AND driftIndex >= 0 AND last 2 metrics also state >= 3 → state 3
- else → state 2

---

### TASK 43: Pattern Detection Service (Pure Math)
**Phase:** 7 | **Priority:** HIGH | **Depends On:** None

**Files to create:** `src/services/alignment/pattern.service.js`

**`detectPatterns(last30Metrics, last30Logs):`** runs all detectors, returns string[] of flags

**Detectors:**
- `MIDWEEK_DRIFT`: Wednesday score is 15+ below Monday, in 3 of last 4 weeks
- `EFFORT_INFLATION`: effort >= 8 AND coreCompletion < 50%, happening 3 of last 7 days
- `OVERCOMMITMENT`: coreCompletion < 40% for 5 of last 7 days
- `STREAK_BREAK`: streak[0] === 0 AND streak[1] > 7 (just broke a long streak)

---

### TASK 44: Recalc Service + Alignment Worker
**Phase:** 7 | **Priority:** CRITICAL | **Depends On:** Tasks 40, 41, 42, 43, 4

**Files to create:** `src/services/alignment/recalc.service.js`, `src/jobs/workers/alignment.worker.js`, `src/jobs/queues.js`, `src/utils/lock.util.js`

**recalc flow (`recalcForUser(userId, date)`):**
1. Acquire Redis lock: `REDIS_KEYS.alignmentLock(userId)` with `SET NX EX 30`
2. Fetch DailyExecutionLog for date
3. Fetch JournalEntry for date → get `reflectionQualityScore` (0 if no entry)
4. Fetch last 7 AlignmentMetrics (sorted newest first)
5. Call `calculateRawScore(execSummary, reflectionQuality)`
6. Call `calculateStreak(rawScore, previousMetrics)` → get multiplier
7. Apply multiplier: `finalScore = applyMultiplier(rawScore, multiplier)`
8. Call `calculateDrift(finalScore, previousMetrics)`
9. Call `determineStateLevel(avg, drift, previousMetrics)`
10. Fetch last 30 days metrics + logs → call `detectPatterns()`
11. Upsert `AlignmentMetric` for date
12. Invalidate `dashboardCache` + `avatarStateCache`
13. Release lock

**lock.util.js:** `acquireLock(key, ttl)`, `releaseLock(key)` using `SET NX EX` pattern

**queues.js exports:** `alignmentQueue`, `reflectionQueue`, `reviewQueue`, `sweepQueue`, `morningQueue`, `eveningQueue`, `enqueueAlignment`, `enqueueReflection`, `enqueueWeeklyReview`, `scheduleWeeklyReviews`, `scheduleMidnightSweep`, `scheduleMorningReminders`, `scheduleEveningReminders`

---

## PHASE 8 — REFLECTION & AI JOBS (Tasks 45–50)

---

### TASK 45: Journal Service + Reflection Quality
**Phase:** 8 | **Priority:** HIGH | **Depends On:** Tasks 11, 34

**Files to create:** `src/services/reflection/journal.service.js`, `src/services/reflection/quality.service.js`

**quality.service.js — `calculateBaselineQuality(text, submittedAt)`:**
- wordCount < 50 → 20, < 100 → 40, < 200 → 60, < 300 → 75, else → 85
- Bonus +5 if submitted before 10PM
- Returns `{ baselineScore, wordCount }`

**`validateAIQualityScore(aiScore, baselineScore):`** clamp aiScore to [baseline-20, baseline+20]

**journal.service.js — `createEntry(userId, date, text, inputMode, timezone)`:**
1. `normalizedDate = toLocalMidnightUTC(date, timezone)`
2. `{ baselineScore, wordCount } = calculateBaselineQuality(text, new Date())`
3. Create JournalEntry with `processingStatus: 'pending'`
4. Return entry

---

### TASK 46: Reflection Controllers & Routes
**Phase:** 8 | **Priority:** HIGH | **Depends On:** Tasks 45, 44

**Files to create:** `src/validators/reflect.validator.js`

**Files to modify:** `src/controllers/reflect.controller.js`, `src/routes/reflect.routes.js`

**reflect.validator.js schemas:** `eveningReflectionSchema`, `journalSearchSchema`

**Controller functions:** `submitEveningReflection`, `submitVoiceReflection`, `getJournalHistory`, `searchJournal`, `getWeeklyCard`, `getAudioResponse`, `exportPDF`

**submitEveningReflection:**
1. Call `journal.service.createEntry(...)`
2. `enqueueReflection({ journalEntryId, userId, date })`
3. Return `sendAccepted(res, 'Processing', job.id)` — 202

**Routes:**
- POST /reflect/evening → requireAuth + validate(eveningReflectionSchema) + limitTier
- POST /reflect/voice → requireAuth + requireRole(['premium']) + requireFeature('FEATURE_VOICE_ONBOARDING') + upload.single('audio')
- GET /reflect/history → requireAuth
- GET /reflect/search → requireAuth + validate(journalSearchSchema)
- GET /reflect/weekly-card → requireAuth
- GET /reflect/audio/:journalId → requireAuth + requireRole(['premium'])
- GET /reflect/export/pdf → requireAuth + requireRole(['premium'])

---

### TASK 47: Short-Term Memory Service
**Phase:** 8 | **Priority:** MEDIUM | **Depends On:** Tasks 10, 7

**Files to create:** `src/services/ai/memory.short.js`

**`buildShortTermMemory(userId):`**
1. Fetch IdentityProfile → extract `declarationSentence`, `behavioralRiskProfile`
2. Fetch last 7 AlignmentMetrics → compact to `[{ date, alignmentScore, stateLevel }]`
3. Fetch active Plan → get current week focus (sprint objectives)
4. Returns `ShortTermMemory` object (see contracts.js)

---

### TASK 48: Reflection Worker (AI Processing)
**Phase:** 8 | **Priority:** HIGH | **Depends On:** Tasks 45, 23, 47

**Files to create:** `src/jobs/workers/reflection.worker.js`, `src/services/ai/prompts/reflection.prompt.js`

**processReflection job:**
1. Update JournalEntry `processingStatus: 'processing'`
2. Fetch journal entry, user, today's DailyExecutionLog
3. Build `memory = await buildShortTermMemory(userId)`
4. Call `callLLM(buildReflectionPrompt(memory, reflectionText, todayStats))`
5. Validate AI response: `{ aiFeedback, tone, qualityScore, alignmentDelta, flags }`
6. `validatedQuality = validateAIQualityScore(aiScore, baselineScore)`
7. Update JournalEntry: aiFeedback, aiTone, reflectionQualityScore, analysisFlags, alignmentDelta, `processingStatus: 'completed'`
8. Re-enqueue alignment recalculation with updated reflection quality
9. If `FEATURE_TTS_RESPONSE && user.tier === 'premium'` → call ttsService (Task 56)
10. On error: `processingStatus: 'failed'`, log error

---

### TASK 49: Weekly Review Worker
**Phase:** 8 | **Priority:** MEDIUM | **Depends On:** Tasks 11, 23, 47

**Files to create:** `src/jobs/workers/review.worker.js`, `src/services/ai/prompts/review.prompt.js`

**processWeeklyReview job:**
1. Determine week bounds (Monday–Sunday)
2. Aggregate last 7 AlignmentMetrics, DailyExecutionLogs, JournalEntries for user
3. Compute: averageScore, bestDay, worstDay, habitConsistency, deepWorkTotal, patterns
4. Build memory + week summary
5. Call `callLLM(buildWeeklyReviewPrompt(weekData, memory))`
6. Upsert WeeklyReview document
7. Send push notification via FCM if user opted in

---

### TASK 50: Midnight Sweep Worker
**Phase:** 8 | **Priority:** HIGH | **Depends On:** Tasks 9, 10, 44

**Files to create:** `src/jobs/workers/sweep.worker.js`

**Sweep job (runs hourly at :05):**
1. Find all users whose local midnight just passed (timezone-aware) — users without `midnightSwept` Redis key
2. For each user: find DailyExecutionLog for yesterday
3. If no log found → create log with `isMissedDay: true`, score = `calculateMissedDayScore(previousMetrics)`
4. Trigger alignment recalc for missed day
5. Set `midnightSwept(userId, date)` Redis key with 48hr TTL (idempotency)

---

## PHASE 9 — PRODUCTION FEATURES (Tasks 51–60)

---

### TASK 51: Email Service
**Phase:** 9 | **Priority:** MEDIUM | **Depends On:** Task 1

**Files to create:** `src/services/email/email.service.js`, `src/services/email/templates/reset.html`, `src/services/email/templates/welcome.html`

**email.service.js:**
- Initialize `Resend(env.RESEND_API_KEY)`
- `sendPasswordResetEmail(email, resetToken)` → build reset URL from `env.FRONTEND_WEB_URL`, send HTML email
- `sendWelcomeEmail(email, name)` → send welcome template
- Graceful fallback: if `RESEND_API_KEY` not set → log and skip (never crash)

---

### TASK 52: Payment Webhooks
**Phase:** 9 | **Priority:** HIGH | **Depends On:** Tasks 6, 17

**Files to create:** `src/controllers/webhook.controller.js`, `src/routes/webhook.routes.js`

**CRITICAL — app.js webhook body parser order (Correction C6):**
```js
app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json()); // AFTER webhooks
```

**Stripe webhook:** Verify signature with `stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET)`. Handle: `customer.subscription.created` → update User.subscriptionTier to 'premium', `customer.subscription.deleted` → downgrade to 'free'

**Razorpay webhook:** Verify HMAC-SHA256 signature with `env.RAZORPAY_KEY_SECRET`. Handle: `payment.captured` → upgrade user tier

---

### TASK 53: Free Tier AI Limit Middleware
**Phase:** 9 | **Priority:** HIGH | **Depends On:** Tasks 4, 6

**Files to create:** `src/middlewares/limit.tier.mid.js`

**`requireAILimit` middleware:**
1. Premium users → `next()` immediately
2. Free users: get week key `getISOWeekKey(new Date())` → `redis.incr(REDIS_KEYS.aiUsageWeekly(userId, weekKey))`
3. If count > `env.RATE_LIMIT_AI_FREE_DAILY (3)` → `next(Errors.AI_LIMIT_EXCEEDED())`
4. Set expiry on first use: until Sunday 23:59 of current week

---

### TASK 54: Analytics Controller
**Phase:** 9 | **Priority:** MEDIUM | **Depends On:** Tasks 9, 10

**Files to create:** `src/services/analytics/dashboard.service.js`, `src/controllers/analytics.controller.js`, `src/routes/analytics.routes.js`

**dashboard.service.js:**
- `getWebDashboard(userId)` → aggregate last 90 days metrics, plans, journal counts
- `getHeatmap(userId)` → group metrics by day-of-week, average alignment by day
- `getCompletionGraph(userId)` → weekly coreCompletionPct averaged per week (last 12 weeks)

---

### TASK 55: STT Service (Full Implementation)
**Phase:** 9 | **Priority:** HIGH | **Depends On:** Task 27

**Files to modify:** `src/services/voice/stt.service.js` (replace scaffold)

**`transcribe(buffer, mimetype):`**
1. Write buffer to `/tmp/revup-${uuid()}.${ext}` (ext from mimetype)
2. Open file stream → pass to `openai.audio.transcriptions.create({ file: stream, model: env.OPENAI_MODEL_STT })`
3. `finally { fs.unlinkSync(tmpPath) }` — always clean up
4. Return `transcript` string

---

### TASK 56: TTS Service
**Phase:** 9 | **Priority:** MEDIUM | **Depends On:** Task 55

**Files to create:** `src/services/voice/tts.service.js`, `src/config/aws.js`

**`generateTTSAndUpload(text, userId, journalEntryId):`**
1. Call `openai.audio.speech.create({ model: env.OPENAI_MODEL_TTS, voice: 'onyx', input: text })`
2. Get S3 client from `aws.js` — if null, skip upload and return null
3. Upload to S3: `revup-voice-audio/{userId}/{journalEntryId}/response.mp3`
4. Generate pre-signed URL (TTL: `env.AWS_S3_URL_EXPIRY`)
5. Update JournalEntry.aiAudioUrl with signed URL
6. Return URL

**aws.js:** `getS3Client()` — lazy init, returns null if AWS creds not configured

---

### TASK 57: Swagger / OpenAPI Spec
**Phase:** 9 | **Priority:** LOW | **Depends On:** All routes

**Files to create:** `src/docs/swagger.yaml`

Full OpenAPI 3.0 YAML covering all 13 route groups. Must be parseable by `js-yaml`. Mount via swagger-ui-express in `app.js`:
```js
const swaggerDocument = yaml.load(fs.readFileSync('./src/docs/swagger.yaml', 'utf8'));
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

---

### TASK 58: Database Seeder
**Phase:** 9 | **Priority:** LOW | **Depends On:** All models

**Files to create:** `src/utils/seed.js`

**Creates for a test user:**
- 1 User (premium)
- 1 IdentityProfile (fully synthesized)
- 1 active Plan (with 4 weekly sprints)
- 30 DailyExecutionLogs (varied completion %)
- 30 AlignmentMetrics (realistic trending data)
- 10 JournalEntries (with AI feedback)
- 4 WeeklyReviews

---

### TASK 59: Docker Configuration
**Phase:** 9 | **Priority:** MEDIUM | **Depends On:** None

**Files:** `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `docker-compose.prod.yml`

Already created — review and validate multi-stage build works:
```bash
docker build -t revup-backend .
docker-compose up mongo redis
```

---

### TASK 60: CI/CD GitHub Actions
**Phase:** 9 | **Priority:** MEDIUM | **Depends On:** None

**Files to create:** `.github/workflows/deploy.yml`

**Pipeline steps:** checkout → node 18 setup → npm ci → npm run lint → npm test → (if main branch) docker build + push to registry + deploy

---

## PHASE 10 — GAP FILLING (Tasks 61–78)

---

### TASK 61: Alignment Dashboard Controller & Routes
**Fixes:** GAP 2 | **Depends On:** Tasks 10, 44

**Files:** `src/controllers/alignment.controller.js`, `src/routes/alignment.routes.js`

**Controllers:** `getDashboard` (cache + fallback), `getTrend` (30-day array), `getPatterns` (flags with descriptions)

---

### TASK 62: Settings Controller & Routes
**Fixes:** GAP 3 | **Depends On:** Tasks 6, 16

**Files:** `src/controllers/settings.controller.js`, `src/routes/settings.routes.js`

**Controllers:** `updateNotifications`, `updateFcmToken` (also updates Redis), `getSubscription`

---

### TASK 63: Admin Controller & Routes
**Fixes:** GAP 4 | **Depends On:** Tasks 6, 10, 16, 44

**Files:** `src/controllers/admin.controller.js`, `src/routes/admin.routes.js`

**Controllers:** `calibrateUser` (force recalc), `listUsers` (paginated, filterable by tier), `getPlatformMetrics` (aggregated stats)

All routes behind `requireAuth + requireAdmin`

---

### TASK 64: FCM Service + Firebase Config
**Fixes:** GAP 5 (part 1) | **Depends On:** Tasks 4, 6

**Files:** `src/config/firebase.js`, `src/services/notifications/fcm.service.js`

**firebase.js:** Lazy init Firebase Admin SDK. Returns null if `FCM_PROJECT_ID` or `FCM_SERVER_KEY` not set.

**fcm.service.js exports:** `sendPushToUser`, `sendMorningReminder`, `sendEveningReminder`, `sendDriftAlert`, `sendStreakMilestone`

All functions: never throw — log errors, return silently

---

### TASK 65: Morning & Evening Notification Workers
**Fixes:** GAP 5 (part 2) | **Depends On:** Task 64

**Files:** `src/jobs/workers/morning.worker.js`, `src/jobs/workers/evening.worker.js`

Also update `src/jobs/queues.js` to add `morningQueue`, `eveningQueue`, `scheduleMorningReminders`, `scheduleEveningReminders` and export all (Correction C8 / Bug 2)

---

### TASK 66: Feature Flag Middleware
**Fixes:** GAP 6 | **Depends On:** None

**Files:** `src/middlewares/feature.mid.js`

`requireFeature(flagName)` factory → returns middleware that checks `env[flagName]` → 403 if disabled

---

### TASK 67: PDF Export Service
**Fixes:** GAP 7 | **Depends On:** Tasks 11, 10

**Files:** `src/services/analytics/pdf.service.js`

`generateMonthlyPDF(userId, year, month, res)` → pdfkit → pipe to Express response

Also add `exportPDF` controller to `reflect.controller.js` → `GET /reflect/export/pdf?year=&month=`

---

### TASK 68: Test Factory Helpers
**Fixes:** GAP 8 | **Depends On:** Tasks 6–11

**Files:** `src/tests/helpers/auth.helper.js`, `src/tests/helpers/factories/user.factory.js`, `src/tests/helpers/factories/identity.factory.js`, `src/tests/helpers/factories/metric.factory.js`

---

### TASK 69: ESLint + Prettier Config
**Fixes:** GAP 9 | **Depends On:** None

Already created — verify `npm run lint` passes on empty codebase with no errors

---

### TASK 70: Bull Board Queue Monitoring
**Fixes:** GAP 10 | **Depends On:** Tasks 44, 48

**Files to modify:** `src/app.js`

Mount Bull Board at `/admin/queues` if `NODE_ENV !== 'production' || BULL_BOARD_ENABLED === true`

---

### TASK 71: Swagger YAML Scaffold
**Fixes:** GAP 15 | **Depends On:** All routes

**Files:** `src/docs/swagger.yaml` — complete OpenAPI 3.0 covering all routes

---

### TASK 72: Reflection Validator
**Fixes:** GAP 16 | **Depends On:** Task 12

**Files:** `src/validators/reflect.validator.js` (full implementation)

Schemas: `eveningReflectionSchema`, `journalSearchSchema`

---

### TASK 73: Recalc Service Correctness Audit
**Depends On:** Tasks 40–44

Review and verify the recalc service handles: missed days correctly, lock expiry, journal entry timing (reflection submitted after log), concurrent recalc prevention

---

### TASK 74: Identity Service Abstraction
**Depends On:** Task 25

**Files:** `src/services/identity/identity.service.js`

Move all DB operations from `identity.controller.js` into this service. Controllers should only call service functions.

---

### TASK 75: Alignment + Reflect E2E Tests
**Depends On:** Tasks 61, 46, 68

**Files:** `src/tests/e2e/alignment.e2e.test.js`, `src/tests/e2e/reflect.e2e.test.js`

---

### TASK 76: Routes Index — Wire All 12 Route Files
**Fixes:** Correction C7 | **Depends On:** All route files

**Files to modify:** `src/routes/index.js`

Mount all route groups:
```js
router.use('/auth',       authRoutes);
router.use('/identity',   identityRoutes);
router.use('/plan',       planRoutes);
router.use('/execute',    execRoutes);
router.use('/alignment',  alignmentRoutes);
router.use('/avatar',     avatarRoutes);
router.use('/reflect',    reflectRoutes);
router.use('/analytics',  analyticsRoutes);
router.use('/voice',      voiceRoutes);
router.use('/settings',   settingsRoutes);
router.use('/webhooks',   webhookRoutes);
router.use('/admin',      adminRoutes);
```

---

### TASK 77: App.js Final Assembly + Server.js Workers
**Fixes:** Corrections C4, C5, C6 | **Depends On:** All workers, all routes

**app.js middleware order:**
1. `express.raw()` for /webhooks BEFORE `express.json()` (C6)
2. `express.json()`
3. pino-http logger
4. helmet
5. cors
6. global rate limiter
7. Routes (via routes/index.js)
8. Bull Board (if enabled)
9. Swagger UI
10. `errorHandler` LAST

**server.js worker startup** (after DB + Redis connected):
```js
const alignmentWorker  = require('./jobs/workers/alignment.worker');
const reflectionWorker = require('./jobs/workers/reflection.worker');
const reviewWorker     = require('./jobs/workers/review.worker');
const sweepWorker      = require('./jobs/workers/sweep.worker');
const morningWorker    = require('./jobs/workers/morning.worker');
const eveningWorker    = require('./jobs/workers/evening.worker');

await scheduleWeeklyReviews();
await scheduleMidnightSweep();
await scheduleMorningReminders();
await scheduleEveningReminders();
```

**server.js graceful shutdown** (C5): close all 6 workers before closing DB/Redis

---

### TASK 78: Project Validation Script
**Depends On:** All tasks

**Files:** `src/utils/validate-setup.js`

Script that checks all required files exist, all env vars are set, all routes are registered. Run via `npm run validate`.

---

## TASKS 79–89 (Final Gaps Round 2)

---

### TASK 79: weight.util.js
**Files:** `src/utils/weight.util.js`

`getTaskWeight(task)`, `getTotalWeightedHours(tasks)`, `assignTaskWeight(type)` using `TASK_WEIGHTS` constants

---

### TASK 80: voice.controller.js + voice.routes.js
**Files:** `src/controllers/voice.controller.js`, `src/routes/voice.routes.js`

`transcribeAudio` controller → `POST /voice/transcribe` → requireAuth + upload.single('audio') + handler

---

### TASK 81: Plan Factory Helper
**Files:** `src/tests/helpers/factories/plan.factory.js`

`buildPlan(userId, overrides)`, `createPlan(userId, overrides)` with realistic sprint data

---

### TASK 82: AWS Config
**Files:** `src/config/aws.js`

`getS3Client()` lazy init — returns null if no AWS creds configured

---

### TASK 83: contracts.js Type Definitions
**Files:** `src/types/contracts.js`

JSDoc typedef: `AlignmentInput`, `DailyExecSummary`, `AlignmentOutput`, `ScoreComponents`, `AIReflectionResult`, `AnalysisFlags`, `ShortTermMemory`

---

### TASK 84: Sprint Service Ambiguity Fix
**Files:** Review `src/services/planning/sprint.service.js`

Ensure sprint generation: always creates exactly 3 core + 2 support + 1 habit tasks; handles weeks where no monthly plan exists (fall back to quarter objectives)

---

### TASK 85: Email Templates
**Files:** `src/services/email/templates/reset.html`, `src/services/email/templates/welcome.html`

Proper HTML email templates with RevUp branding, reset link, and welcome message

---

### TASK 86: Reflect History + Search Implementation
**Files:** Add to `src/controllers/reflect.controller.js`

`getJournalHistory`: paginated with `sendPaginated()`. `searchJournal`: MongoDB `$text` search on reflectionText. `getWeeklyCard`: fetch latest WeeklyReview. `getAudioResponse`: return `aiAudioUrl` signed URL.

---

### TASK 87: Account Delete + GDPR
**Files:** Add to `src/controllers/auth.controller.js`

`deleteAccount`: delete User + IdentityProfile + all Plans + all Logs + all Metrics + all JournalEntries + all WeeklyReviews for userId. Clear all Redis keys. Return 200.

---

### TASK 88: Plan History + Stats
**Files:** Add to `src/controllers/plan.controller.js`

`getPlanHistory`: `Plan.find({ userId, isActive: false }).sort({ archivedAt: -1 })` paginated. `getPlanStats`: aggregate sprint task counts, estimated hours, completion rates.

---

### TASK 89: E2E Test for Plan Extras
**Files:** Add to `src/tests/e2e/plan.e2e.test.js`

Test: POST /plan/sprint/extra adds task. DELETE /plan/sprint/extra/:id removes it.

---

## TASKS 90–102 (Deep Audit Corrections)

---

### TASK 90: env.js — Add Missing Zod Fields
FCM_PROJECT_ID, FRONTEND_APP_URL, FCM_SERVICE_ACCOUNT_JSON, BULL_BOARD_ENABLED — should already be in Task 1's env.js

### TASK 91: queues.js — Export Morning/Evening
Verify `module.exports` includes all 6 queues and all schedule functions

### TASK 92: __mocks__/openai.js at Project Root
Already created — verify `moduleNameMapper` in jest.config.js points to it

### TASK 93: PATCH /execute/log
Already covered in Task 39

### TASK 94: POST /auth/logout + logoutUser()
Already covered in Task 15 + 17

### TASK 95: POST /auth/logout-all + logoutAll()
Already covered in Task 15 + 17

### TASK 96: POST /auth/refresh controller + route
Already covered in Task 17

### TASK 97: POST /plan/sprint/extra + DELETE /plan/sprint/extra/:taskId
Already covered in Task 33

### TASK 98: POST /identity/avatar-base
Already covered in Task 25

### TASK 99: PATCH /identity/declaration
Already covered in Task 25

### TASK 100: POST /reflect/voice (voice reflection, premium)
Already covered in Task 46

### TASK 101: __mocks__/openai.js at project root
Already created

### TASK 102: E2E tests for auth logout, plan extras, identity avatar
Add to respective E2E test files

---

*End of TASKS.md — 102 tasks fully specified*
