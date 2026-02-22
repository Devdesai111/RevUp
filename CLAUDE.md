# CLAUDE.md — RevUp Backend Project Instructions
> Claude Code reads this file automatically at the start of every session.  
> **Full specs are in:** `REVUP_BACKEND_MASTER_PLAN.md` + `REVUP_PENDING_TASKS_SUPPLEMENT.md`  
> Read both files completely before writing any code.

---

## 🚨 SESSION PROTOCOL (FOLLOW EVERY TIME)

```
1. Read REVUP_BACKEND_MASTER_PLAN.md fully
2. Read REVUP_PENDING_TASKS_SUPPLEMENT.md fully  
3. Ask the user: "Which task number should I implement?"
4. Implement THAT TASK ONLY
5. Write failing test first → then implementation → confirm test passes
6. Stop and report: "Task [N] complete. Tests passing. Ready for Task [N+1]."
7. Do NOT continue to the next task without explicit instruction
```

---

## ⚡ QUICK REFERENCE — ABSOLUTE RULES

| Rule | What It Means |
|---|---|
| **Stack only** | Node 18 · Express 4 · Mongoose 8 · ioredis 5 · BullMQ 5 · Zod 3 · Pino |
| **TDD always** | Write the failing test FIRST, then make it pass |
| **No AI in alignment** | `src/services/alignment/` = pure math only, zero OpenAI calls |
| **No `res.json()` direct** | Always use `sendSuccess()`, `sendError()`, `sendPaginated()` from `response.util.js` |
| **No `process.env.X` direct** | Always import from `src/config/env.js` |
| **No string literals for queues/keys** | Import `QUEUES.*` from `constants.js`, use `REDIS_KEYS.*()` from `redis-keys.js` |
| **No business logic in controllers** | Controllers = HTTP only. Logic = services only. |
| **AI calls async only** | Return 202 immediately → BullMQ processes in background (exception: POST /identity/synthesize) |
| **All errors via next(err)** | Never `res.status(500).json()` directly in controllers |
| **Validate before controller** | Zod schemas in `validate(schema)` middleware, never inside controllers |

---

## 📁 KEY FILE LOCATIONS

```
src/config/env.js          ← All environment variables (import here, not process.env)
src/config/constants.js    ← All enums, thresholds, queue names, limits
src/config/redis-keys.js   ← All Redis key factory functions
src/config/avatar-states.js ← Avatar visual config for all 3 levels
src/utils/AppError.js      ← Custom error class + Errors.* factories
src/utils/response.util.js ← sendSuccess(), sendError(), sendPaginated(), sendAccepted()
src/utils/logger.js        ← Pino logger (never use console.log)
src/routes/index.js        ← Mounts ALL routes under /api/v1
src/app.js                 ← Express app setup (middleware order matters — see Task 77)
src/server.js              ← DB connect, worker startup, app.listen
```

---

## 🧮 ALIGNMENT SCORE FORMULA (Never change this)

```
rawScore = (coreCompletion% × 0.50)     // max 50 pts
         + (supportCompletion% × 0.20)  // max 20 pts
         + (habitCompletion% × 0.15)    // max 15 pts  (100 if done, 0 if not)
         + (effortNormalized × 0.10)    // max 10 pts  (effort 1-10 → 0-100)
         + (reflectionQuality × 0.05)   // max  5 pts
         = max 100 ✓

finalScore = min(100, rawScore × streakMultiplier)
streakMultiplier: streak>7 → 1.10 | streak>3 → 1.05 | else → 1.00
```

---

## 🗄️ STANDARD API RESPONSE SHAPES

```javascript
// All success responses
{ success: true, message: "...", data: {} }

// All error responses  
{ success: false, message: "...", code: "ERROR_CODE", errors: [] }

// Paginated responses
{ success: true, data: [], pagination: { page, limit, total, totalPages } }

// Async accepted (202)
{ success: true, message: "Processing", data: { jobId: "..." } }
```

---

## 🚦 AVATAR STATE LEVELS

| Level | Name | Trigger |
|---|---|---|
| 1 | Diminished | 7-day avg < 45 OR drift < -0.4 for 3+ days |
| 2 | Stable | Default — 7-day avg 45–75 |
| 3 | Aligned | 7-day avg > 75 AND drift ≥ 0 (needs 2 consecutive days) |

State drops **immediately**. State rises only after **2 qualifying consecutive days**.

---

## 🔴 KNOWN CORRECTIONS (Apply before building)

These bugs exist in the original plan — apply them immediately:

```javascript
// jest.config.js — FIX THIS TYPO:
// ❌ setupFilesAfterFramework: [...]
// ✅ setupFilesAfterEnv: ['./src/tests/helpers/db.helper.js']

// app.js — WEBHOOK BODY PARSER ORDER:
// Webhook routes MUST use express.raw() BEFORE express.json() is mounted
app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json());  // This comes AFTER

// server.js — WORKERS MUST BE STARTED:
// Import all workers and schedule repeatable jobs at startup
// See Task 77 in REVUP_PENDING_TASKS_SUPPLEMENT.md for complete server.js

// package.json — ADD MISSING PACKAGES:
// date-fns, date-fns-tz, firebase-admin, js-yaml, razorpay, uuid
```

---

## 📋 TASK MAP (78 total)

| Phase | Tasks | Status |
|---|---|---|
| 1 — Core Infrastructure | 1–5 | Core setup |
| 2 — DB Models | 6–12 | Mongoose schemas |
| 3 — Auth | 13–19 | JWT, OAuth, reset |
| 4 — Identity/Onboarding | 20–27 | AI synthesis |
| 5 — Planning Engine | 28–34 | 90-day plans |
| 6 — Execution Logging | 35–39 | Daily task logs |
| 7 — Alignment Brain | 40–44 | Pure math scoring |
| 8 — Reflection/AI/Jobs | 45–50 | Async AI pipeline |
| 9 — Production | 51–60 | Docker, CI/CD, seed |
| 10 — Gap Filling | 61–78 | Missing pieces (see supplement) |

**Start at Task 1. Complete in order. Never skip.**

---

## 🧪 TEST COMMANDS

```bash
npm test           # All tests
npm run test:unit  # Unit tests only
npm run test:e2e   # E2E tests only
npm run test:cov   # Coverage report
npm run validate   # Check all required files exist (Task 78)
npm run seed       # Populate 30 days of test data (Task 58)
npm run lint       # ESLint check
```

---

## ✅ BEFORE MARKING ANY TASK COMPLETE

1. All tests written for this task pass (`npm test`)
2. No `console.log` in implementation files
3. No hardcoded strings for queue names, Redis keys, or env vars
4. `npm run lint` passes with no errors
5. Response format matches the standard shapes above

---

## 🆘 IF STUCK ON SOMETHING

| Problem | Where to look |
|---|---|
| What threshold/constant to use | `REVUP_BACKEND_MASTER_PLAN.md` Section 4 |
| Alignment math question | `REVUP_BACKEND_MASTER_PLAN.md` Section 11 |
| Which API response format | `REVUP_BACKEND_MASTER_PLAN.md` Section 5 |
| Which field is on which model | `REVUP_BACKEND_MASTER_PLAN.md` Section 9 |
| Missing file or route not wired | `REVUP_PENDING_TASKS_SUPPLEMENT.md` Gaps 1–16 |
| Worker not running | `REVUP_PENDING_TASKS_SUPPLEMENT.md` Gaps 12–13 |
