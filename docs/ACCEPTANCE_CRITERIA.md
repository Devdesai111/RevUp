# REVUP BACKEND — ACCEPTANCE CRITERIA
> Precise pass/fail checklist for every task.
> A task is COMPLETE only when ALL criteria in its section pass.

---

## How to Use This File
1. Implement the task
2. Run `npm test` — all listed tests must pass
3. Run `npm run lint` — must report zero errors
4. Manually verify any behavioral criteria that aren't covered by automated tests
5. Mark task complete in TASKS.md

---

## PHASE 1 — CORE INFRASTRUCTURE

### Task 1: Express App & Server
| # | Criterion | Type |
|---|-----------|------|
| 1.1 | `npm start` starts server on PORT without crash | Behavioral |
| 1.2 | `GET /api/v1/health` returns `{ status: "ok", mongo: "connected", redis: "connected" }` | Behavioral |
| 1.3 | Missing required env var → process exits with error message at startup | Behavioral |
| 1.4 | `src/config/env.js` Zod schema includes ALL 40+ fields listed in Task 1 spec | Code Review |
| 1.5 | No `process.env.X` calls anywhere except in `src/config/env.js` | Code Review |
| 1.6 | `src/app.js` does NOT call `app.listen()` | Code Review |
| 1.7 | `src/tests/setup.js` starts MongoMemoryServer and sets `process.env.MONGO_URI` | Code Review |
| 1.8 | `npm test` runs without MongoDB or Redis installed locally | Behavioral |

### Task 2: Error Handler & Logger
| # | Criterion | Type |
|---|-----------|------|
| 2.1 | Throwing `new AppError('msg', 400, 'CODE')` returns `{ success: false, message, code, errors }` | Test |
| 2.2 | Mongoose ValidationError → 400 `VALIDATION_ERROR` response | Test |
| 2.3 | Mongoose duplicate key (11000) → 409 `DUPLICATE_KEY` response | Test |
| 2.4 | `JsonWebTokenError` → 401 `INVALID_TOKEN` | Test |
| 2.5 | `TokenExpiredError` → 401 `TOKEN_EXPIRED` | Test |
| 2.6 | Unhandled error (programming bug) → 500 `INTERNAL_ERROR` | Test |
| 2.7 | `err.stack` NOT present in production responses | Code Review |
| 2.8 | `logger.js` uses Pino (not console.log) | Code Review |
| 2.9 | All response helpers exist: `sendSuccess`, `sendCreated`, `sendAccepted`, `sendError`, `sendPaginated` | Code Review |
| 2.10 | All 17 `Errors.*` factory methods exist | Code Review |
| 2.11 | No raw `res.status(500).json()` in any controller | Code Review |

### Task 3: MongoDB Connection
| # | Criterion | Type |
|---|-----------|------|
| 3.1 | Server logs `MongoDB Connected` on startup | Behavioral |
| 3.2 | Connection failure retries 5 times then exits | Behavioral |
| 3.3 | `SIGTERM` triggers graceful shutdown log and `process.exit(0)` | Behavioral |
| 3.4 | Tests use `MONGO_URI_TEST` or MongoMemoryServer URI | Code Review |
| 3.5 | `maxPoolSize: 100` set in connection options | Code Review |

### Task 4: Redis Client
| # | Criterion | Type |
|---|-----------|------|
| 4.1 | `redis.ping()` returns `'PONG'` | Test |
| 4.2 | All keys have `revup:` prefix automatically (via `keyPrefix` option) | Test |
| 4.3 | Only one Redis instance created across entire application | Code Review |
| 4.4 | All 13 `REDIS_KEYS.*` factory functions exist and return correct string patterns | Test |
| 4.5 | `redis.js` is not imported directly in models — only in services/workers | Code Review |

### Task 5: Rate Limiter & Security Headers
| # | Criterion | Type |
|---|-----------|------|
| 5.1 | 101st request from same IP returns HTTP 429 | Test |
| 5.2 | Response includes correct 429 error format with `RATE_LIMIT_EXCEEDED` code | Test |
| 5.3 | `X-Powered-By` header absent | Test |
| 5.4 | Auth rate limiter (5/10min) is separate from global limiter | Code Review |
| 5.5 | CORS only allows configured origins | Test |

---

## PHASE 2 — DATABASE MODELS

### Task 6: User Model
| # | Criterion | Type |
|---|-----------|------|
| 6.1 | Saving duplicate email throws error code 11000 | Test |
| 6.2 | Default `subscriptionTier` is `'free'` | Test |
| 6.3 | `passwordHash` NOT returned in default queries | Test |
| 6.4 | `passwordHash` IS returned when `.select('+passwordHash')` used | Test |
| 6.5 | `__v` field absent from `.toJSON()` output | Test |
| 6.6 | `AUTH_PROVIDERS` and `TIERS` enums enforced — invalid values rejected | Test |

### Task 7: IdentityProfile Model
| # | Criterion | Type |
|---|-----------|------|
| 7.1 | `userId` unique index rejects second profile for same user | Test |
| 7.2 | More than 3 `priorityPillars` rejected by custom validator | Test |
| 7.3 | All nested objects (`currentIdentity`, `futureIdentity`, `blueprint`, etc.) save correctly | Test |
| 7.4 | All onboarding step flags default to `false` | Test |
| 7.5 | `baselineAlignmentScore` defaults to 50 | Test |

### Task 8: Plan Model
| # | Criterion | Type |
|---|-----------|------|
| 8.1 | Sprint with 4 core actions rejected by validator | Test |
| 8.2 | Sprint with 3 supporting actions rejected | Test |
| 8.3 | `rerollCount` cannot exceed 3 | Test |
| 8.4 | More than 3 `macroObjectives` rejected | Test |
| 8.5 | `isActive` defaults to `true` | Test |

### Task 9: DailyExecutionLog Model
| # | Criterion | Type |
|---|-----------|------|
| 9.1 | Two logs for same `userId + date` combination rejected (unique compound index) | Test |
| 9.2 | `isMissedDay` defaults to `false` | Test |
| 9.3 | `deepWorkMinutes` defaults to `0` | Test |
| 9.4 | `effortScore` outside 1-10 range rejected | Test |

### Task 10: AlignmentMetric Model
| # | Criterion | Type |
|---|-----------|------|
| 10.1 | `stateLevel` must be exactly 1, 2, or 3 — value of 4 rejected | Test |
| 10.2 | `driftIndex` outside [-1, 1] rejected | Test |
| 10.3 | Compound unique `{ userId, date }` prevents duplicates | Test |
| 10.4 | All `components` sub-fields are optional (won't break if missing) | Test |

### Task 11: JournalEntry + WeeklyReview
| # | Criterion | Type |
|---|-----------|------|
| 11.1 | Full-text index exists on `reflectionText` | Test |
| 11.2 | `processingStatus` defaults to `'pending'` | Test |
| 11.3 | `tags` only accepts values from enum | Test |
| 11.4 | `reflectionText` shorter than 10 chars rejected | Test |
| 11.5 | `reflectionText` longer than 5000 chars rejected | Test |
| 11.6 | WeeklyReview: `driftTrend` must be one of `improving`, `stable`, `declining` | Test |

### Task 12: Validation Middleware + Constants
| # | Criterion | Type |
|---|-----------|------|
| 12.1 | Route with `validate(schema)` returns 400 for invalid body | Test |
| 12.2 | Error format is `{ field: "email", message: "..." }` array | Test |
| 12.3 | Valid body passes through to controller unmodified | Test |
| 12.4 | `constants.js` exports `QUEUES`, `JOBS`, `TIERS`, `AUTH_PROVIDERS`, `AVATAR_LEVELS`, `ALIGNMENT`, `PATTERNS`, `PLAN_LIMITS`, `SCORE_WEIGHTS`, `PAGINATION`, `NOTIFICATION_TYPES` | Code Review |
| 12.5 | `SCORE_WEIGHTS` sums to 1.0 | Test |

---

## PHASE 3 — AUTHENTICATION

### Task 13: Hash + JWT Utils
| # | Criterion | Type |
|---|-----------|------|
| 13.1 | `hashPassword('test') !== 'test'` | Test |
| 13.2 | `comparePassword('test', hash)` returns true | Test |
| 13.3 | `comparePassword('wrong', hash)` returns false | Test |
| 13.4 | Generated access token contains `{ sub, tier, version }` payload | Test |
| 13.5 | Expired token (manipulate clock or use past expiry) throws `TOKEN_EXPIRED` | Test |
| 13.6 | Tampered token throws `INVALID_TOKEN` | Test |
| 13.7 | Token signed with wrong secret throws `INVALID_TOKEN` | Test |

### Task 14: Auth Validators
| # | Criterion | Type |
|---|-----------|------|
| 14.1 | Password shorter than 8 chars → 400 validation error | Test |
| 14.2 | Invalid email format → 400 validation error | Test |
| 14.3 | Email is lowercased and trimmed by Zod transform | Test |
| 14.4 | `riskSchema` rejects array with 5 integers (needs exactly 6) | Test |

### Task 15: Auth Service
| # | Criterion | Type |
|---|-----------|------|
| 15.1 | `registerUser` with duplicate email → `USER_EXISTS` AppError | Test |
| 15.2 | `loginUser` with wrong password → `INVALID_CREDENTIALS` AppError | Test |
| 15.3 | `loginUser` with inactive user → `UNAUTHORIZED` AppError | Test |
| 15.4 | `registerUser` stores refresh token in Redis with 7d TTL | Test |
| 15.5 | `refreshTokens` with expired refresh token → 401 | Test |
| 15.6 | `logoutAll` increments `tokenVersion` on User document | Test |
| 15.7 | After `logoutAll`, old access token is rejected by `requireAuth` | Test |

### Task 16: Auth Middleware
| # | Criterion | Type |
|---|-----------|------|
| 16.1 | Request with no token → 401 `UNAUTHORIZED` | Test |
| 16.2 | Request with invalid token → 401 `INVALID_TOKEN` | Test |
| 16.3 | Request with expired token → 401 `TOKEN_EXPIRED` | Test |
| 16.4 | `requireRole(['premium'])` with free user → 403 `PREMIUM_REQUIRED` | Test |
| 16.5 | `requireAdmin` with non-admin user → 403 `FORBIDDEN` | Test |
| 16.6 | Valid token → `req.user` populated with full user document | Test |

### Task 17: Auth Routes (E2E)
| # | Criterion | Type |
|---|-----------|------|
| 17.1 | `POST /auth/register` → 201 + tokens + user | E2E Test |
| 17.2 | `POST /auth/login` → 200 + tokens | E2E Test |
| 17.3 | `GET /auth/me` with valid token → 200 + user profile | E2E Test |
| 17.4 | `GET /auth/me` without token → 401 | E2E Test |
| 17.5 | `PATCH /auth/me` updates timezone on user document | E2E Test |
| 17.6 | `POST /auth/refresh` → new token pair | E2E Test |
| 17.7 | `POST /auth/logout` → refresh token deleted from Redis | E2E Test |
| 17.8 | `POST /auth/logout-all` → tokenVersion incremented | E2E Test |
| 17.9 | `POST /auth/forgot` always returns 200 (no email enumeration) | E2E Test |

### Task 18: OAuth (E2E)
| # | Criterion | Type |
|---|-----------|------|
| 18.1 | `POST /auth/google` with mock token → 200 + JWT pair | E2E Test |
| 18.2 | Repeated calls with same email create only one user | Test |

### Task 19: Password Reset (E2E)
| # | Criterion | Type |
|---|-----------|------|
| 19.1 | Correct reset token → password updated, old tokens invalid | E2E Test |
| 19.2 | Wrong/expired token → 400 | E2E Test |
| 19.3 | Used token cannot be reused | E2E Test |
| 19.4 | After reset, `tokenVersion` incremented | E2E Test |

---

## PHASE 4 — IDENTITY & ONBOARDING

### Task 20: Identity Validators
| # | Criterion | Type |
|---|-----------|------|
| 20.1 | More than 5 strengths → 400 validation error | Test |
| 20.2 | `answers` array with 5 items → 400 (needs 6) | Test |
| 20.3 | `energyLevel` of 11 → 400 | Test |
| 20.4 | Invalid `executionGap` value → 400 | Test |
| 20.5 | More than 3 pillars → 400 | Test |

### Task 21: Risk Service
| # | Criterion | Type |
|---|-----------|------|
| 21.1 | All answers = 5 → high `driftProbability` (close to 1) | Unit Test |
| 21.2 | All answers = 1 → low `driftProbability` (close to 0) | Unit Test |
| 21.3 | `stabilityScore` always 0-100 | Unit Test |
| 21.4 | `procrastinationIndex` always 0-100 | Unit Test |
| 21.5 | `driftProbability` always 0-1 | Unit Test |
| 21.6 | `rawAnswers` array stored in result | Unit Test |

### Task 22: Baseline Calculator
| # | Criterion | Type |
|---|-----------|------|
| 22.1 | Max energy (10), min gap (1), min drift (0) → score <= 100 | Unit Test |
| 22.2 | Min energy (1), max gap (5), max drift (1) → score >= 0 | Unit Test |
| 22.3 | Default baseline with energy=5, gap=3, drift=0.5 → ~42 | Unit Test |

### Task 23: AI Orchestrator
| # | Criterion | Type |
|---|-----------|------|
| 23.1 | Successful call returns parsed JSON object | Unit Test (mocked) |
| 23.2 | Invalid JSON response → retried up to `OPENAI_MAX_RETRIES` times | Unit Test |
| 23.3 | After max retries → throws `AI_UNAVAILABLE` AppError | Unit Test |
| 23.4 | `response_format: { type: 'json_object' }` passed in every call | Code Review |
| 23.5 | Token usage logged after every successful call | Code Review |
| 23.6 | Missing `OPENAI_API_KEY` → `AI_UNAVAILABLE` on first call | Unit Test |

### Task 24: Synthesis Service
| # | Criterion | Type |
|---|-----------|------|
| 24.1 | Returns `{ behavioralRiskProfile, quarterlyDirection, keyInsight, suggestedDeclaration, baselineAlignmentScore }` | Unit Test (mocked) |
| 24.2 | Invalid AI JSON is retried once | Unit Test |
| 24.3 | `onboardingSteps.synthesized` set to true after synthesis | Test |
| 24.4 | `blueprint.synthesizedAt` field populated | Test |

### Task 25: Identity Routes (E2E)
| # | Criterion | Type |
|---|-----------|------|
| 25.1 | Full onboarding flow (7 steps) completes with 200s | E2E Test |
| 25.2 | `GET /identity/status` returns correct `percentComplete` at each step | E2E Test |
| 25.3 | Cache hit on second `GET /identity/me` call | E2E Test |
| 25.4 | `POST /identity/synthesize` before all steps done → 400 | E2E Test |
| 25.5 | `DELETE /identity/reset` by free user → 403 | E2E Test |

### Task 26: Avatar Routes (E2E)
| # | Criterion | Type |
|---|-----------|------|
| 26.1 | New user returns `stateLevel: 2` (stable default) | E2E Test |
| 26.2 | Response includes complete visual config object | E2E Test |
| 26.3 | Second request hits Redis cache | E2E Test |

### Task 27: Upload Middleware
| # | Criterion | Type |
|---|-----------|------|
| 27.1 | Non-audio MIME type → 400 `INVALID_AUDIO_FORMAT` | Unit Test |
| 27.2 | File over 25MB → multer size limit error (400) | Unit Test |
| 27.3 | Valid audio passes through to next middleware | Unit Test |

---

## PHASE 5 — PLANNING ENGINE

### Task 28: Plan Validators + Constraint Util
| # | Criterion | Type |
|---|-----------|------|
| 28.1 | Task hours > available × 1.5 → `OVERCOMMIT` error | Unit Test |
| 28.2 | Task hours within limit → passes, returns stats | Unit Test |

### Task 29: Quarter Generator
| # | Criterion | Type |
|---|-----------|------|
| 29.1 | Returns `{ quarterTheme, macroObjectives[] }` (mocked AI) | Unit Test |
| 29.2 | Previous active plan archived before new plan created | Test |
| 29.3 | `quarterStartDate` = today, `quarterEndDate` = today + 90 days | Test |

### Task 31: Sprint Generator
| # | Criterion | Type |
|---|-----------|------|
| 31.1 | Generated sprint has exactly 3 core tasks | Test |
| 31.2 | Generated sprint has exactly 2 support tasks | Test |
| 31.3 | Sprint includes identityHabit task | Test |
| 31.4 | Overcommit check runs — too many estimated hours reduces task count | Test |

### Task 33: Plan Routes (E2E)
| # | Criterion | Type |
|---|-----------|------|
| 33.1 | `POST /plan/quarter` → 202 | E2E Test |
| 33.2 | `GET /plan/current` returns active plan with sprints | E2E Test |
| 33.3 | `GET /plan/today` returns today's tasks based on user timezone | E2E Test |
| 33.4 | `POST /plan/sprint/reroll` 4th time → 429 `RATE_LIMIT_EXCEEDED` | E2E Test |
| 33.5 | `POST /plan/sprint/extra` adds non-scoring task | E2E Test |
| 33.6 | `DELETE /plan/sprint/extra/:taskId` removes task | E2E Test |

---

## PHASE 6 — EXECUTION LOGGING

### Task 36: Execution Service
| # | Criterion | Type |
|---|-----------|------|
| 36.1 | `coreCompletionPct` computed correctly from tasks array | Unit Test |
| 36.2 | `averageEffort` computed correctly | Unit Test |
| 36.3 | Date normalized to UTC midnight via `toLocalMidnightUTC` | Unit Test |
| 36.4 | Alignment recalc job enqueued after log saved | Test |

### Task 38: Execution Routes (E2E)
| # | Criterion | Type |
|---|-----------|------|
| 38.1 | `POST /execute/intent` → 200 + `intentDeclared: true` | E2E Test |
| 38.2 | `POST /execute/log` → 202 + job queued | E2E Test |
| 38.3 | `GET /execute/today` returns today's log | E2E Test |
| 38.4 | `GET /execute/today` with no log → returns empty/null | E2E Test |
| 38.5 | Voice commit upload by free user → 403 | E2E Test |

### Task 39: Edit Log
| # | Criterion | Type |
|---|-----------|------|
| 39.1 | `PATCH /execute/log` updates existing log | E2E Test |
| 39.2 | Recalculation re-queued after edit | E2E Test |

---

## PHASE 7 — ALIGNMENT BRAIN

### Task 40: Score Service
| # | Criterion | Type |
|---|-----------|------|
| 40.1 | Perfect execution (3/3 core, 2/2 support, habit done, effort 10) + perfect reflection → `rawScore = 100` | Unit Test |
| 40.2 | Zero completion, missed day, no reflection → `rawScore = 0` | Unit Test |
| 40.3 | 50% core (1/3), full support, habit done, effort 5, no reflection → `~56.11` | Unit Test |
| 40.4 | Score never exceeds 100 | Unit Test |
| 40.5 | Score never goes below 0 | Unit Test |
| 40.6 | `components` object correctly broken down | Unit Test |
| 40.7 | `isMissedDay = true` → effort normalized = 0 | Unit Test |

### Task 41: Streak Service
| # | Criterion | Type |
|---|-----------|------|
| 41.1 | Score >= 50 continues streak (increments by 1) | Unit Test |
| 41.2 | Score < 50 resets streak to 0 | Unit Test |
| 41.3 | Streak > 7 → multiplier = 1.10 | Unit Test |
| 41.4 | Streak 4-7 → multiplier = 1.05 | Unit Test |
| 41.5 | Streak <= 3 → multiplier = 1.00 | Unit Test |

### Task 42: Drift Service
| # | Criterion | Type |
|---|-----------|------|
| 42.1 | 7-day average computed correctly from window of [today, ...6 previous] | Unit Test |
| 42.2 | `driftIndex` never outside [-1.0, 1.0] | Unit Test |
| 42.3 | Positive drift when today > 7-day average | Unit Test |
| 42.4 | `sevenDayAverage = 0` → `driftIndex = 0` (no division by zero) | Unit Test |
| 42.5 | State level 1 when avg < 45 | Unit Test |
| 42.6 | State level 3 requires avg > 75 AND drift >= 0 AND 2 prior days at state >= 3 | Unit Test |
| 42.7 | State level drops immediately (no 2-day buffer for drops) | Unit Test |

### Task 43: Pattern Detection
| # | Criterion | Type |
|---|-----------|------|
| 43.1 | `MIDWEEK_DRIFT` flag set when Wed score is 15+ below Mon for 3+ of last 4 weeks | Unit Test |
| 43.2 | `EFFORT_INFLATION` flag set when effort >= 8 + completion < 50% for 3+ of last 7 days | Unit Test |
| 43.3 | `OVERCOMMITMENT` flag set when completion < 40% for 5+ of last 7 days | Unit Test |
| 43.4 | `STREAK_BREAK` flag set when streak dropped from >7 to 0 within last 3 days | Unit Test |
| 43.5 | No false positives when patterns NOT present | Unit Test |

### Task 44: Recalc Worker
| # | Criterion | Type |
|---|-----------|------|
| 44.1 | Full recalc flow produces correct `AlignmentMetric` document | Integration Test |
| 44.2 | Redis lock prevents concurrent recalc for same user | Test |
| 44.3 | Lock released after successful run | Test |
| 44.4 | Lock released even if recalc throws error | Test |
| 44.5 | `dashboardCache` and `avatarStateCache` invalidated after recalc | Test |
| 44.6 | `QUEUES.*` constants used everywhere — no raw queue name strings | Code Review |
| 44.7 | Worker has `on('failed', ...)` error handler | Code Review |

---

## PHASE 8 — REFLECTION & AI

### Task 45: Reflection Quality Service
| # | Criterion | Type |
|---|-----------|------|
| 45.1 | Text < 50 words → baseline = 20 | Unit Test |
| 45.2 | Text 100-200 words → baseline = 60 | Unit Test |
| 45.3 | Text > 300 words → baseline = 85 | Unit Test |
| 45.4 | Submitted before 10PM → +5 bonus | Unit Test |
| 45.5 | `validateAIQualityScore` clamps to [baseline-20, baseline+20] | Unit Test |
| 45.6 | AI score of 100 when baseline is 30 → clamped to 50 | Unit Test |

### Task 46: Reflection Routes (E2E)
| # | Criterion | Type |
|---|-----------|------|
| 46.1 | `POST /reflect/evening` → 202 + jobId | E2E Test |
| 46.2 | JournalEntry created with `processingStatus: 'pending'` | E2E Test |
| 46.3 | `GET /reflect/history` returns paginated entries | E2E Test |
| 46.4 | `GET /reflect/search?q=focus` returns matching entries | E2E Test |
| 46.5 | Free user posting 4th reflection in a week → 429 `AI_LIMIT_EXCEEDED` | E2E Test |
| 46.6 | Voice reflection by free user → 403 | E2E Test |

### Task 48: Reflection Worker
| # | Criterion | Type |
|---|-----------|------|
| 48.1 | JournalEntry updated to `processingStatus: 'completed'` after processing | Integration Test |
| 48.2 | `aiFeedback` and `aiTone` populated | Integration Test |
| 48.3 | `reflectionQualityScore` is AI-adjusted score within baseline ± 20 | Integration Test |
| 48.4 | Alignment recalc re-queued with updated reflection quality | Integration Test |
| 48.5 | Worker error sets `processingStatus: 'failed'` and logs error | Integration Test |

### Task 50: Midnight Sweep
| # | Criterion | Type |
|---|-----------|------|
| 50.1 | User with no log → `DailyExecutionLog` created with `isMissedDay: true` | Integration Test |
| 50.2 | User with existing log → NOT overwritten | Integration Test |
| 50.3 | `midnightSwept` Redis key set after processing | Test |
| 50.4 | Running sweep twice for same day is idempotent | Test |
| 50.5 | Missed day score = last score × 0.9 | Unit Test |

---

## PHASE 9 — PRODUCTION

### Task 51: Email Service
| # | Criterion | Type |
|---|-----------|------|
| 51.1 | `sendPasswordResetEmail` called with valid args → email sent (mocked) | Unit Test |
| 51.2 | Missing `RESEND_API_KEY` → email skipped, no crash | Unit Test |

### Task 52: Webhooks
| # | Criterion | Type |
|---|-----------|------|
| 52.1 | Invalid Stripe signature → 400 (signature verification fails) | E2E Test |
| 52.2 | Valid `customer.subscription.created` → user `subscriptionTier` updated to `premium` | E2E Test |
| 52.3 | Valid `customer.subscription.deleted` → tier downgraded to `free` | E2E Test |
| 52.4 | Webhook route receives raw bytes (not JSON parsed) | Code Review |
| 52.5 | `app.use('/api/v1/webhooks', express.raw())` appears BEFORE `app.use(express.json())` in app.js | Code Review |

### Task 53: AI Tier Limit
| # | Criterion | Type |
|---|-----------|------|
| 53.1 | Free user 3rd AI call → 200, 4th → 429 `AI_LIMIT_EXCEEDED` | E2E Test |
| 53.2 | Premium user unlimited AI calls (no 429) | E2E Test |
| 53.3 | Counter resets at end of week | Test |

### Task 55: STT Service
| # | Criterion | Type |
|---|-----------|------|
| 55.1 | Returns transcript string (mocked Whisper) | Unit Test |
| 55.2 | Temp file deleted after transcription (even if error) | Unit Test |

### Task 67: PDF Export
| # | Criterion | Type |
|---|-----------|------|
| 67.1 | `GET /reflect/export/pdf` streams valid PDF bytes | E2E Test |
| 67.2 | Empty month → PDF generated without crash | Unit Test |
| 67.3 | Free user → 403 | E2E Test |

---

## PHASE 10 — GAP FILLING

### Task 61: Alignment Dashboard
| # | Criterion | Type |
|---|-----------|------|
| 61.1 | `GET /alignment/dashboard` returns correct dashboard object | E2E Test |
| 61.2 | New user with no metrics → returns baseline defaults (score 50) | E2E Test |
| 61.3 | Cache hit verified on second request | E2E Test |
| 61.4 | `GET /alignment/trend` returns array of last 30 days | E2E Test |
| 61.5 | `GET /alignment/patterns` returns patterns with descriptions | E2E Test |

### Task 62: Settings Routes
| # | Criterion | Type |
|---|-----------|------|
| 62.1 | `PATCH /settings/notifications { morning: false }` → preference updated | E2E Test |
| 62.2 | `PATCH /settings/fcm-token` → stored in DB and Redis | E2E Test |
| 62.3 | `GET /settings/subscription` returns tier info | E2E Test |

### Task 63: Admin Routes
| # | Criterion | Type |
|---|-----------|------|
| 63.1 | Non-admin user accessing admin route → 403 | E2E Test |
| 63.2 | `GET /admin/metrics` returns platform stats | E2E Test |
| 63.3 | `POST /admin/calibrate/:userId` enqueues alignment job | E2E Test |

### Task 64: FCM Service
| # | Criterion | Type |
|---|-----------|------|
| 64.1 | `sendPushToUser` with no FCM token → no-ops silently | Unit Test |
| 64.2 | Firebase not configured (no env vars) → returns null, no crash | Unit Test |
| 64.3 | Firebase error → caught and logged, never throws | Unit Test |

### Task 66: Feature Flag Middleware
| # | Criterion | Type |
|---|-----------|------|
| 66.1 | Feature flag `false` → 403 `FORBIDDEN` | Unit Test |
| 66.2 | Feature flag `true` → calls `next()` | Unit Test |

### Task 76: Routes Index
| # | Criterion | Type |
|---|-----------|------|
| 76.1 | All 12 route groups mounted in `src/routes/index.js` | Code Review |
| 76.2 | No route returns 404 for known paths | E2E Test |

### Task 77: App.js + Server.js Assembly
| # | Criterion | Type |
|---|-----------|------|
| 77.1 | `express.raw()` for webhooks appears BEFORE `express.json()` | Code Review |
| 77.2 | All 6 workers imported and started in server.js | Code Review |
| 77.3 | All 4 schedule functions called at startup | Code Review |
| 77.4 | Graceful shutdown closes all 6 workers | Code Review |
| 77.5 | `errorHandler` is the LAST middleware in app.js | Code Review |
| 77.6 | `npm test` passes with all tests | Automated |
| 77.7 | `npm run lint` passes with zero errors | Automated |

---

## GLOBAL REQUIREMENTS (Apply to EVERY Task)

| # | Rule | Verification |
|---|------|-------------|
| G.1 | No `console.log` in any implementation file | `npm run lint` → `no-console` rule |
| G.2 | No hardcoded Redis key strings — always use `REDIS_KEYS.*` | Code Review |
| G.3 | No hardcoded queue names — always use `QUEUES.*` | Code Review |
| G.4 | No `process.env.X` direct access outside `src/config/env.js` | Code Review |
| G.5 | All error passing via `next(err)` — no `res.status(500).json()` in controllers | Code Review |
| G.6 | All success responses use `sendSuccess()` / `sendCreated()` / `sendAccepted()` / `sendPaginated()` | Code Review |
| G.7 | Zod validation in middleware, never inside controllers | Code Review |
| G.8 | `npm run lint` passes after every task | Automated |
| G.9 | `npm test` passes after every task (no test regressions) | Automated |
| G.10 | No AI calls in `src/services/alignment/` directory | Code Review |
| G.11 | All async route handlers wrapped in try/catch with `next(err)` | Code Review |

---

## Test Coverage Targets

| Category | Minimum |
|----------|---------|
| Branches | 70% |
| Functions | 80% |
| Lines | 80% |
| Statements | 80% |

Run `npm run test:cov` to check coverage before marking any phase complete.
