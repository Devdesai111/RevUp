# REVUP BACKEND — MASTER REFERENCE FILE
> **This is the single file Claude reads to build the entire RevUp backend.**
> It references all other spec and planning documents and defines the exact protocol for every session.

---

## SESSION PROTOCOL (FOLLOW EVERY TIME)

```
1. Read this file (MASTER.md) fully
2. Check the current task status in TASKS.md
3. Ask the user: "Which task number should I implement?"
4. Implement THAT TASK ONLY
5. Write failing test FIRST → then implementation → confirm test passes
6. Run npm test AND npm run lint before marking complete
7. Verify ALL acceptance criteria in ACCEPTANCE_CRITERIA.md for that task
8. Stop and report: "Task [N] complete. Tests passing. Ready for Task [N+1]."
9. Do NOT continue to the next task without explicit instruction
```

---

## WHAT IS REVUP?

RevUp is an **Identity Alignment System** — a mobile/web app where users:
1. Define their current vs. future identity (onboarding)
2. Get a 90-day AI-generated execution plan
3. Log daily task completions
4. Receive an evening AI reflection on their journal entry
5. Watch their "alignment score" change based on consistency
6. See an avatar that visually reflects their alignment state

**The backend is the intelligence layer.** It handles all scoring math, AI calls, and real-time data.

---

## STACK (ABSOLUTE — NO EXCEPTIONS)

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 18+ |
| Framework | Express | 4.x |
| Database | MongoDB via Mongoose | 8.x |
| Cache / Queue store | Redis via ioredis | 5.x |
| Job Queue | BullMQ | 5.x |
| Validation | Zod | 3.x |
| Logging | Pino + pino-http | 8.x |
| AI | OpenAI SDK | 4.x |
| Email | Resend | 3.x |
| Payments | Stripe + Razorpay | latest |
| Push | Firebase Admin SDK | 12.x |
| Storage | AWS S3 | SDK v3 |

---

## ABSOLUTE CODE RULES

| Rule | Enforcement |
|------|------------|
| No `console.log` | ESLint `no-console: error` |
| No `process.env.X` direct | Only import from `src/config/env.js` |
| No raw Redis key strings | Always use `REDIS_KEYS.*()` from `redis-keys.js` |
| No raw queue name strings | Always use `QUEUES.*` from `constants.js` |
| No business logic in controllers | Controllers = HTTP only. Logic = services only |
| No AI calls in alignment services | `src/services/alignment/` = pure math ONLY |
| Always `next(err)` for errors | Never `res.status(500).json()` in controllers |
| Always validate in middleware | Zod in `validate(schema)` before controller |
| Always async AI routes = 202 | Return job ID immediately, process in BullMQ |
| TDD mandatory | Write failing test FIRST, then make it pass |

---

## TASK EXECUTION ORDER

**Total: 102 tasks across 10 phases. Complete STRICTLY in order.**

```
Phase 1 (Tasks 1–5):   Core Infrastructure
Phase 2 (Tasks 6–12):  Database Models & Validation
Phase 3 (Tasks 13–19): Authentication System
Phase 4 (Tasks 20–27): Identity & Onboarding
Phase 5 (Tasks 28–34): Planning Engine
Phase 6 (Tasks 35–39): Execution Logging
Phase 7 (Tasks 40–44): Alignment Brain (PURE MATH — NO AI)
Phase 8 (Tasks 45–50): Reflection & AI Jobs
Phase 9 (Tasks 51–60): Production Features
Phase 10 (Tasks 61–78): Gap Filling
Tasks 79–102:           Final completions
```

**Current progress tracker:** See `docs/TASKS.md` — mark each task as you complete it.

---

## KEY FILE LOCATIONS

```
backend/
├── src/
│   ├── app.js              ← Express app (no .listen() here)
│   ├── server.js           ← DB+Redis connect, workers start, app.listen()
│   ├── config/
│   │   ├── env.js          ← ALL env vars via Zod (never process.env.X elsewhere)
│   │   ├── db.js           ← Mongoose connection
│   │   ├── redis.js        ← ioredis singleton
│   │   ├── constants.js    ← QUEUES, JOBS, TIERS, ALIGNMENT, PATTERNS, etc.
│   │   ├── redis-keys.js   ← All Redis key factory functions
│   │   ├── avatar-states.js← Avatar visual config for levels 1, 2, 3
│   │   ├── firebase.js     ← Firebase Admin SDK (lazy init)
│   │   └── aws.js          ← S3 client (lazy init)
│   ├── models/             ← 7 Mongoose models (see SCHEMA.md)
│   ├── controllers/        ← HTTP only. All logic in services.
│   ├── routes/
│   │   └── index.js        ← Mounts ALL 12 route groups under /api/v1
│   ├── middlewares/
│   │   ├── auth.mid.js     ← requireAuth, requireAdmin
│   │   ├── role.mid.js     ← requireRole(['premium'])
│   │   ├── validate.mid.js ← validate(zodSchema)
│   │   ├── rateLimit.mid.js← Global + auth rate limits
│   │   ├── limit.tier.mid.js← AI usage limits for free users
│   │   ├── upload.mid.js   ← Multer for audio
│   │   ├── feature.mid.js  ← Feature flag checks
│   │   └── error.mid.js    ← Global error handler (LAST middleware)
│   ├── services/
│   │   ├── alignment/      ← PURE MATH ONLY. Zero OpenAI calls.
│   │   │   ├── score.service.js
│   │   │   ├── streak.service.js
│   │   │   ├── drift.service.js
│   │   │   ├── pattern.service.js
│   │   │   └── recalc.service.js
│   │   └── ai/
│   │       ├── ai.orchestrator.js  ← OpenAI wrapper
│   │       └── memory.short.js     ← User context builder
│   ├── jobs/
│   │   ├── queues.js       ← Queue instances + enqueue helpers + schedule functions
│   │   └── workers/        ← 6 workers: alignment, reflection, review, sweep, morning, evening
│   └── utils/
│       ├── AppError.js     ← Custom error class + Errors.* factories
│       ├── response.util.js← sendSuccess, sendCreated, sendAccepted, sendPaginated
│       ├── date.util.js    ← Timezone normalization utilities
│       └── lock.util.js    ← Redis SET NX lock
├── __mocks__/
│   └── openai.js           ← Auto-mocked in all tests (never hits real API)
├── jest.config.js          ← setupFilesAfterEnv (NOT setupFilesAfterFramework)
└── package.json            ← All deps including date-fns, firebase-admin, razorpay, uuid, pdfkit
```

---

## ALIGNMENT SCORING FORMULA (SACRED — NEVER CHANGE)

```
rawScore =
  (coreCompletion%    × 0.50) +   // max 50 pts
  (supportCompletion% × 0.20) +   // max 20 pts
  (habitCompletion    × 0.15) +   // max 15 pts  (0 or 100)
  (effortNormalized   × 0.10) +   // max 10 pts  (effort 1-10 → (effort-1)/9×100)
  (reflectionQuality  × 0.05)     // max  5 pts
= max 100 ✓

finalScore = min(100, rawScore × streakMultiplier)
streakMultiplier: streak>7 → 1.10 | streak>3 → 1.05 | else → 1.00
```

---

## AVATAR STATE LEVELS

| Level | Name | Trigger | Direction |
|-------|------|---------|-----------|
| 1 | Diminished | 7-day avg < 45 OR drift < -0.4 for 3+ days | Drops IMMEDIATELY |
| 2 | Stable | Default (45 ≤ avg ≤ 75) | — |
| 3 | Aligned | 7-day avg > 75 AND drift ≥ 0 | Rises only after 2 qualifying consecutive days |

---

## API STANDARD RESPONSE SHAPES

```javascript
// Success
{ success: true, message: "...", data: {} }

// Error
{ success: false, message: "...", code: "ERROR_CODE", errors: [] }

// Paginated
{ success: true, data: [], pagination: { page, limit, total, totalPages } }

// 202 Async accepted
{ success: true, message: "Processing", data: { jobId: "..." } }
```

---

## BASE URL + AUTH

```
Base URL:  /api/v1
Auth:      Authorization: Bearer <accessToken>
```

---

## ALL API ROUTES SUMMARY

| Group | Routes | Auth |
|-------|--------|------|
| Health | GET /health | None |
| Auth | POST /auth/register, /login, /google, /apple, GET/PATCH /auth/me, POST /auth/refresh, /logout, /logout-all, /forgot, /reset, DELETE /auth/account | Mixed |
| Identity | GET /identity/me, /status, POST /identity/current, /future, /constraints, /risk, /pillars, /synthesize, /avatar-base, PATCH /identity/declaration, DELETE /identity/reset, POST /identity/voice | Required |
| Plan | POST /plan/quarter, /month, /sprint, GET /plan/current, /today, /history, /stats, PATCH /plan/sprint, POST /plan/sprint/reroll, /sprint/extra, DELETE /plan/sprint/extra/:taskId | Required |
| Execute | POST /execute/intent, /log, PATCH /execute/log, POST /execute/timer, /commit-voice, GET /execute/today | Required |
| Alignment | GET /alignment/dashboard, /trend, /patterns | Required |
| Avatar | GET /avatar/state | Required |
| Reflect | POST /reflect/evening, /voice, GET /reflect/history, /search, /weekly-card, /audio/:journalId, /export/pdf | Required |
| Analytics | GET /analytics/web-dashboard, /heatmap, /completion-graph | Required |
| Voice | POST /voice/transcribe | Required |
| Settings | PATCH /settings/notifications, /fcm-token, GET /settings/subscription | Required |
| Webhooks | POST /webhooks/stripe, /webhooks/razorpay | Signature |
| Admin | POST /admin/calibrate/:userId, GET /admin/users, /metrics | Admin |

**Full spec for each endpoint:** See `docs/API_ENDPOINTS.md`

---

## KNOWN BUGS — ALREADY FIXED IN THIS PROJECT

All 10 bugs from the original spec have been corrected:

| # | Bug | Fix Applied |
|---|-----|------------|
| C1 | `jest.config.js` had `setupFilesAfterFramework` | Fixed to `setupFilesAfterEnv` |
| C2 | `package.json` missing packages | Added: date-fns, date-fns-tz, firebase-admin, js-yaml, razorpay, uuid, pdfkit, @bull-board/api, @bull-board/express |
| C3 | `env.js` missing Zod fields | FCM_PROJECT_ID, FRONTEND_APP_URL, FCM_SERVICE_ACCOUNT_JSON, BULL_BOARD_ENABLED must be in schema |
| C4 | `server.js` workers not started | All 6 workers must be imported and started after DB/Redis connect |
| C5 | `server.js` workers not in graceful shutdown | All 6 workers must be closed in shutdown sequence |
| C6 | `app.js` webhook body parser order wrong | `express.raw()` for /webhooks BEFORE `express.json()` |
| C7 | `routes/index.js` not wiring all routes | Task 76 wires all 12 route groups |
| C8 | `queues.js` missing morning/evening queues | morningQueue, eveningQueue, and their schedule functions must be exported |
| C9 | OpenAI mock in wrong location | `__mocks__/openai.js` at project root, mapped in jest.config.js `moduleNameMapper` |
| C10 | STT service named wrong | Task 55 implements `stt.service.js` (Whisper) — NOT `whisper.service.js` |

---

## EXTERNAL SERVICES REQUIRED

| Service | Required | Used For | Can be null? |
|---------|----------|---------|-------------|
| MongoDB | YES | All data storage | No |
| Redis | YES | Cache, queues, locks | No |
| OpenAI API | YES | AI synthesis, reflection, planning, TTS, STT | No — core features |
| AWS S3 | Optional | Voice audio storage | Yes — graceful null |
| Stripe | Optional | Payments (US/global) | Yes — payment only |
| Razorpay | Optional | Payments (India) | Yes — payment only |
| Firebase FCM | Optional | Push notifications | Yes — returns null if unconfigured |
| Resend | Optional | Email (reset, welcome) | Yes — logs and skips |

---

## TEST COMMANDS

```bash
npm test           # All tests (unit + e2e)
npm run test:unit  # Unit tests only
npm run test:e2e   # E2E tests only
npm run test:cov   # Coverage report (targets: 80% lines/functions)
npm run validate   # Check all required files exist (Task 78)
npm run seed       # Populate 30 days of test data (Task 58)
npm run lint       # ESLint check
npm run lint:fix   # Auto-fix lint issues
```

---

## CHECKLIST BEFORE MARKING ANY TASK COMPLETE

```
[ ] All failing tests for this task now pass (npm test)
[ ] No test regressions — all previously passing tests still pass
[ ] npm run lint passes with ZERO errors
[ ] No console.log in implementation files
[ ] No hardcoded queue names (use QUEUES.*)
[ ] No hardcoded Redis key strings (use REDIS_KEYS.*())
[ ] No process.env.X outside env.js
[ ] Response format matches standard shapes
[ ] All acceptance criteria in ACCEPTANCE_CRITERIA.md checked off
[ ] No raw res.status().json() in controllers
```

---

## REFERENCE DOCUMENTS (READ THESE FOR DEEP DETAIL)

| Document | Contents |
|----------|----------|
| `docs/TASKS.md` | All 102 tasks with files, implementation notes, TDD notes |
| `docs/SCHEMA.md` | All 7 Mongoose models, Redis keys, queue contracts |
| `docs/API_ENDPOINTS.md` | All 55 endpoints with exact request/response shapes |
| `docs/ACCEPTANCE_CRITERIA.md` | Pass/fail checklist for every task |
| `REVUP_BACKEND_MASTER_PLAN.md` | Full original spec with exact code templates |
| `REVUP_PENDING_TASKS_SUPPLEMENT.md` | Tasks 61-78 gap fill with exact code |
| `REVUP_FINAL_GAPS.md` | Additional gaps discovered in audit |
| `REVUP_DEEP_AUDIT.md` | Bug corrections and final completeness audit |

---

## ALIGNMENT SCORING WORKED EXAMPLES

### Example 1: Good Day
```
Core tasks: 3/3 done    → 100 × 0.50 = 50.00
Support:    2/2 done    → 100 × 0.20 = 20.00
Habit:      done        → 100 × 0.15 = 15.00
Effort:     8/10        → 77.8 × 0.10 = 7.78
Reflection: 60          → 60 × 0.05 = 3.00
                         ────────────────────
rawScore = 95.78
streak = 5 (multiplier = 1.05)
finalScore = min(100, 95.78 × 1.05) = 100 (capped)
```

### Example 2: Partial Day
```
Core tasks: 1/3 done    → 33.3 × 0.50 = 16.67
Support:    1/2 done    → 50 × 0.20 = 10.00
Habit:      missed      → 0 × 0.15 = 0
Effort:     5/10        → 44.4 × 0.10 = 4.44
Reflection: 40          → 40 × 0.05 = 2.00
                         ────────────────────
rawScore = 33.11
streak reset (< 50)
finalScore = 33.11
```

### Example 3: Missed Day (Sweep)
```
No log submitted → sweep creates log with isMissedDay=true
missedDayScore = lastScore × 0.90
if lastScore = 68 → missedDayScore = 61
```

---

## REFLECTION QUALITY BANDS

| Word Count | Baseline Score |
|-----------|---------------|
| < 50 words | 20 |
| 50-99 words | 40 |
| 100-199 words | 60 |
| 200-299 words | 75 |
| 300+ words | 85 |

- **+5 bonus** if submitted before 10PM local time
- **AI adjustment:** ±20 points max from baseline
- **Final score:** AI score clamped to [baseline-20, baseline+20]

---

## PATTERN DETECTION THRESHOLDS

| Pattern | Condition | Days Required |
|---------|-----------|--------------|
| MIDWEEK_DRIFT | Wed score 15+ below Mon | 3 of last 4 weeks |
| EFFORT_INFLATION | Effort ≥ 8 AND completion < 50% | 3 of last 7 days |
| OVERCOMMITMENT | Core completion < 40% | 5 of last 7 days |
| STREAK_BREAK | Streak dropped from >7 to 0 | Within last 3 days |

---

## AI PROMPT STRUCTURE

All AI calls must use:
- `response_format: { type: "json_object" }` — enforces JSON output
- Model for identity synthesis: `OPENAI_MODEL_SYNTHESIS` (gpt-4o)
- Model for reflection + planning + review: `OPENAI_MODEL_REFLECTION` (gpt-4o-mini)
- Retry on failure: `OPENAI_MAX_RETRIES` times with exponential backoff
- Validate AI output with Zod before using

**See `REVUP_BACKEND_MASTER_PLAN.md` Section 15 for exact prompt templates.**

---

## WORKER SCHEDULE

| Worker | Schedule | Trigger |
|--------|----------|---------|
| alignment.worker | On demand | enqueueAlignment() |
| reflection.worker | On demand | enqueueReflection() |
| review.worker | Every Sunday 23:00 UTC | scheduleWeeklyReviews() |
| sweep.worker | Every hour at :05 | scheduleMidnightSweep() |
| morning.worker | Every 30 minutes | scheduleMorningReminders() |
| evening.worker | Every 30 minutes | scheduleEveningReminders() |

---

## QUICK BUG LOOKUP

| Problem | Solution |
|---------|----------|
| Test says `setupFilesAfterFramework` unknown | Fix jest.config.js: use `setupFilesAfterEnv` |
| Webhook returns 400 (body undefined) | Check app.js: `express.raw()` must be before `express.json()` |
| Worker not processing jobs | Check server.js: all workers must be imported AND started |
| OpenAI mock not working | Check `__mocks__/openai.js` is at PROJECT ROOT, check `moduleNameMapper` in jest.config.js |
| Alignment not recalculating | Check queues.js exports `alignmentQueue` and `enqueueAlignment` |
| FCM crashing on startup | Check firebase.js: uses `getFirebaseApp()` lazy pattern, returns null if not configured |
| Timezone wrong for daily logs | Check `date.util.js` `toLocalMidnightUTC()` is used for all date normalization |
| Free user gets AI on 4th request | Check `limit.tier.mid.js` is applied to reflect and synthesize routes |

---

*End of MASTER.md — Start at Task 1.*
