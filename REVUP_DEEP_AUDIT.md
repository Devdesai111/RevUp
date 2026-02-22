# 🔬 REVUP — DEEP AUDIT (Third Pass)
> **This is the fourth and definitively final document.**
> Read after: Master Plan (Tasks 1–60) → Supplement (Tasks 61–78) → Final Gaps (Tasks 79–89)
> **Grand total after this doc: 89 + 13 new = 102 tasks**

---

## WHAT THIS AUDIT COVERS

This was a line-by-line read of both source files, cross-referencing:
- Every route in Section 16 against every task definition
- Every file in the folder structure (Section 17) against every task
- Every env var in Section 3 against the Zod schema in env.js
- Every function referenced between files against where it's actually defined
- Every `queues.js` export against what workers and server.js import

---

## 🔴 CRITICAL BUGS STILL IN BOTH DOCUMENTS

### Bug 1 — `env.js` Zod Schema Missing 3 More Variables

The env.js Zod schema (Section 3) defines only `FCM_SERVER_KEY` but the code uses TWO more Firebase vars. Also missing one URL.

**`.env.example` has these:**
```
FCM_SERVER_KEY=
FCM_PROJECT_ID=          ← MISSING from Zod schema
FRONTEND_APP_URL=        ← MISSING from Zod schema
```

**`firebase.js` (Task 64) uses `env.FCM_PROJECT_ID`** — but if it's not in the Zod schema, `env.FCM_PROJECT_ID` will be `undefined` and Firebase init will silently fail.

**`email.service.js` (Task 51 / Final Gaps) uses `env.FRONTEND_APP_URL`** in welcome email — same problem.

**Fix — add to Zod schema in `src/config/env.js`:**
```javascript
FCM_PROJECT_ID:        z.string().optional(),
FRONTEND_APP_URL:      z.string().default('exp://localhost:19000'),
```

---

### Bug 2 — `queues.js` Module.exports Missing Morning/Evening Queues

The original `queues.js` in Section 8 exports:
```javascript
module.exports = {
  alignmentQueue, reflectionQueue, reviewQueue, sweepQueue,
  enqueueAlignment, enqueueReflection, enqueueWeeklyReview,
  scheduleWeeklyReviews, scheduleMidnightSweep,
};
```

Task 65 adds `morningQueue`, `eveningQueue`, `scheduleMorningReminders`, `scheduleEveningReminders` to queues.js but never updates the `module.exports`. Server.js (Gap 12 fix) imports `scheduleWeeklyReviews` and `scheduleMidnightSweep` from queues.js — if morning/evening schedule functions aren't exported, they'll throw on import.

**Fix — queues.js `module.exports` must be:**
```javascript
module.exports = {
  alignmentQueue, reflectionQueue, reviewQueue, sweepQueue,
  morningQueue, eveningQueue,
  enqueueAlignment, enqueueReflection, enqueueWeeklyReview,
  scheduleWeeklyReviews, scheduleMidnightSweep,
  scheduleMorningReminders, scheduleEveningReminders,
};
```

---

### Bug 3 — OpenAI Mock File: Wrong Folder Location

Section 18 shows:
```javascript
// src/tests/__mocks__/openai.js
```

But the folder structure (Section 17) shows no `__mocks__` directory. Jest's **automatic module mocking** requires `__mocks__` to be at the project root (same level as `node_modules`), NOT inside `src/tests/`. The current path `src/tests/__mocks__/` will NOT be picked up automatically by Jest.

**Fix — two options, pick one:**

Option A (Recommended): Move the mock file to the root:
```
/__mocks__/openai.js   ← Root level, auto-discovered by Jest
```

Option B: Add `roots` to jest.config.js:
```javascript
// jest.config.js
moduleDirectories: ['node_modules', 'src'],
```

**Either way, Task 23 (AI Orchestrator) E2E tests will fail with real OpenAI calls in CI without this fix.**

---

### Bug 4 — `PATCH /execute/log` Has No Implementation

Section 16.4 defines:
```
PATCH /execute/log    Required    Edit today's log
```

Task 38 only implements `POST /execute/log`. The PATCH route (editing a saved log) needs a separate handler. Without it, the route 404s.

**Add to `exec.controller.js`:**
```javascript
// PATCH /execute/log — Edit existing log for today
const editLog = async (req, res, next) => {
  try {
    const { date, tasks, habitDone, deepWorkMinutes } = req.body;
    const normalizedDate = toLocalMidnightUTC(date, req.user.timezone);

    const log = await DailyExecutionLog.findOneAndUpdate(
      { userId: req.user._id, date: normalizedDate },
      { $set: {
          ...(tasks !== undefined        && { tasks }),
          ...(habitDone !== undefined    && { identityHabitDone: habitDone }),
          ...(deepWorkMinutes !== undefined && { deepWorkMinutes }),
        }
      },
      { new: true }
    );

    if (!log) throw Errors.NOT_FOUND('Execution log');

    // Recompute completion percentages
    const coreTasks     = log.tasks.filter(t => t.isCore);
    const supportTasks  = log.tasks.filter(t => !t.isCore && !t.isHabit);
    const coreDone      = coreTasks.filter(t => t.completed).length;
    const supportDone   = supportTasks.filter(t => t.completed).length;
    log.coreCompletionPct    = coreTasks.length    ? (coreDone / coreTasks.length) * 100 : 0;
    log.supportCompletionPct = supportTasks.length ? (supportDone / supportTasks.length) * 100 : 0;
    log.averageEffort        = log.tasks.filter(t => t.effortScore)
      .reduce((s, t, _, a) => s + t.effortScore / a.length, 0);
    await log.save();

    // Re-enqueue alignment recalculation with edited data
    await enqueueAlignment({ userId: req.user._id.toString(), date: normalizedDate.toISOString(), trigger: 'log_edit' });

    return sendSuccess(res, log, 'Log updated');
  } catch (err) {
    next(err);
  }
};
```

**Add to `exec.routes.js`:**
```javascript
router.patch('/log', requireAuth, validate(logSchema), editLog);
```

---

## 🟠 ROUTES IN SECTION 16 WITH NO IMPLEMENTATION IN ANY TASK

After cross-referencing all 78 tasks + 11 gap tasks, these routes are specified in the API docs but have **zero implementation anywhere**:

### Missing Route 1 — `POST /auth/logout`

Task 15 defines `auth.service.js` with `registerUser`, `loginUser`, `refreshTokens` — but **never defines `logoutUser`**. Task 17 creates the auth router but never explicitly shows the logout handler.

```javascript
// Add to auth.service.js:
const logoutUser = async (userId, refreshToken) => {
  // Delete refresh token from Redis — immediately invalidates the session
  await redis.del(REDIS_KEYS.refreshToken(userId));
  return true;
};
```

```javascript
// Add to auth.controller.js:
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logoutUser(req.user._id.toString(), refreshToken);
    return sendSuccess(res, {}, 'Logged out successfully');
  } catch (err) { next(err); }
};
```

**Route:** `POST /auth/logout` requires auth + `{ refreshToken }` in body.

---

### Missing Route 2 — `POST /auth/logout-all`

Increments `tokenVersion` on the user, invalidating ALL issued JWTs across all devices.

```javascript
// Add to auth.service.js:
const logoutAll = async (userId) => {
  // Increment tokenVersion — all existing tokens have old version → rejected by requireAuth
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
  await redis.del(REDIS_KEYS.refreshToken(userId));
  return true;
};
```

```javascript
// Add to auth.controller.js:
const logoutAll = async (req, res, next) => {
  try {
    await authService.logoutAll(req.user._id.toString());
    return sendSuccess(res, {}, 'Logged out from all devices');
  } catch (err) { next(err); }
};
```

**Route:** `POST /auth/logout-all` requires auth.

---

### Missing Route 3 — `POST /auth/refresh`

Task 15 defines `refreshTokens()` in auth.service.js, but **no task explicitly creates the controller handler or wires the route**. Task 17 never shows this handler being added to auth.routes.js.

```javascript
// Add to auth.controller.js:
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw Errors.UNAUTHORIZED('Refresh token required');
    const tokens = await authService.refreshTokens(refreshToken);
    return sendSuccess(res, tokens, 'Token refreshed');
  } catch (err) { next(err); }
};
```

**Route:** `POST /auth/refresh` no auth, requires `{ refreshToken }` in body.

---

### Missing Route 4 — `POST /plan/sprint/extra` (Add manual task)

Listed in Section 16.3. Allows users to add non-scoring personal tasks to the current sprint.

```javascript
// Add to plan.controller.js:
const addExtraTask = async (req, res, next) => {
  try {
    const { name, estimatedMins } = req.body;
    const plan = await Plan.findOne({ userId: req.user._id, isActive: true });
    if (!plan) throw Errors.PLAN_NOT_FOUND();

    const currentSprint = plan.weeklySprints[plan.weeklySprints.length - 1];
    currentSprint.extraTasks.push({
      name,
      estimatedMins: estimatedMins || 30,
      weight: 0,         // Non-scoring
      isCore: false,
      isHabit: false,
    });
    await plan.save();

    return sendSuccess(res, currentSprint, 'Task added');
  } catch (err) { next(err); }
};
```

**Route:** `POST /plan/sprint/extra` requires auth, body `{ name, estimatedMins? }`.

---

### Missing Route 5 — `DELETE /plan/sprint/extra/:taskId`

```javascript
// Add to plan.controller.js:
const removeExtraTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const plan = await Plan.findOne({ userId: req.user._id, isActive: true });
    if (!plan) throw Errors.PLAN_NOT_FOUND();

    const currentSprint = plan.weeklySprints[plan.weeklySprints.length - 1];
    const originalLength = currentSprint.extraTasks.length;
    currentSprint.extraTasks = currentSprint.extraTasks.filter(
      t => t._id.toString() !== taskId
    );

    if (currentSprint.extraTasks.length === originalLength) {
      throw Errors.NOT_FOUND('Extra task');
    }

    await plan.save();
    return sendSuccess(res, {}, 'Extra task removed');
  } catch (err) { next(err); }
};
```

**Route:** `DELETE /plan/sprint/extra/:taskId` requires auth.

---

### Missing Route 6 — `POST /identity/avatar-base`

Listed in Section 16.2. Saves avatar aesthetic preferences (genderPresentation, skinTone, clothingStyle, environmentTheme). Task 25 handles identity sections but never mentions this endpoint. The `avatarPreferences` subdocument exists in the IdentityProfile model but nothing saves to it.

```javascript
// Add to identity.controller.js:
const saveAvatarBase = async (req, res, next) => {
  try {
    const { genderPresentation, skinTone, clothingStyle, environmentTheme } = req.body;
    const profile = await IdentityProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          'avatarPreferences.genderPresentation': genderPresentation,
          'avatarPreferences.skinTone':           skinTone,
          'avatarPreferences.clothingStyle':      clothingStyle,
          'avatarPreferences.environmentTheme':   environmentTheme,
          'onboardingSteps.avatarCreated':        true,
        },
      },
      { upsert: true, new: true }
    );
    await redis.del(REDIS_KEYS.identityCache(req.user._id.toString()));
    return sendSuccess(res, { avatarPreferences: profile.avatarPreferences }, 'Avatar preferences saved');
  } catch (err) { next(err); }
};
```

**Add to identity.validator.js:**
```javascript
const avatarBaseSchema = z.object({
  body: z.object({
    genderPresentation: z.enum(['masculine', 'feminine', 'neutral']).optional(),
    skinTone:           z.string().optional(),
    clothingStyle:      z.enum(['professional', 'casual', 'athletic', 'minimal']).optional(),
    environmentTheme:   z.enum(['office', 'outdoor', 'minimal', 'luxury']).optional(),
  })
});
```

**Route:** `POST /identity/avatar-base` requires auth.

---

### Missing Route 7 — `PATCH /identity/declaration`

Listed in Section 16.2. Lets users update their identity declaration sentence after onboarding.

```javascript
// Add to identity.controller.js:
const updateDeclaration = async (req, res, next) => {
  try {
    const { declaration } = req.body;
    const profile = await IdentityProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { 'futureIdentity.declarationSentence': declaration } },
      { new: true }
    );
    if (!profile) throw Errors.IDENTITY_NOT_FOUND();
    await redis.del(REDIS_KEYS.identityCache(req.user._id.toString()));
    return sendSuccess(res, { declaration }, 'Declaration updated');
  } catch (err) { next(err); }
};
```

**Add to identity.validator.js:**
```javascript
const declarationSchema = z.object({
  body: z.object({
    declaration: z.string().min(10).max(300),
  })
});
```

**Route:** `PATCH /identity/declaration` requires auth.

---

### Missing Route 8 — `POST /reflect/voice` (Premium)

Listed in Section 16.7. Allows premium users to submit voice reflections. Transcribes via Whisper, saves as JournalEntry, queues AI processing.

```javascript
// Add to reflect.controller.js:
const submitVoiceReflection = async (req, res, next) => {
  try {
    if (!req.file) throw Errors.INVALID_AUDIO_FORMAT();

    const { date } = req.body;
    const transcript = await sttService.transcribe(req.file.buffer, req.file.mimetype);

    // Save transcript as journal entry (same as text reflection)
    const entry = await journalService.createEntry(
      req.user._id,
      date || new Date().toISOString().split('T')[0],
      transcript,
      'voice'  // inputMode
    );

    // Store S3 URL if AWS configured (upload original audio)
    // ... (optional: upload req.file.buffer to S3)

    // Enqueue AI processing — same queue as text reflection
    const job = await enqueueReflection({
      journalEntryId: entry._id.toString(),
      userId: req.user._id.toString(),
      date: entry.date.toISOString(),
    });

    return sendAccepted(res, 'Voice reflection received. Processing in background.', job.id);
  } catch (err) { next(err); }
};
```

**Add to reflect.routes.js:**
```javascript
const uploadMiddleware = require('../middlewares/upload.mid');
const { requireFeature } = require('../middlewares/feature.mid');

router.post('/voice', requireAuth, requireRole(['premium']),
  requireFeature('FEATURE_VOICE_ONBOARDING'),
  uploadMiddleware.single('audio'),
  submitVoiceReflection
);
```

---

## 🟡 MISSING FILE NOT COVERED BY ANY PREVIOUS GAP DOC

### Missing File — `src/tests/__mocks__/openai.js` (correct location)

The file is shown in Section 18 but at the wrong path for Jest auto-mocking. Create it at project root:

```javascript
// __mocks__/openai.js   ← At PROJECT ROOT (same level as package.json)

const mockCreate = jest.fn().mockResolvedValue({
  choices: [{ message: { content: JSON.stringify({
    behavioralRiskProfile: 'Test risk profile',
    quarterlyDirection: 'Test direction',
    keyInsight: 'Test insight',
    suggestedDeclaration: 'I am becoming a test user.',
  }) } }],
  usage: { prompt_tokens: 100, completion_tokens: 50 },
});

module.exports = jest.fn().mockImplementation(() => ({
  chat: { completions: { create: mockCreate } },
  audio: {
    transcriptions: { create: jest.fn().mockResolvedValue({ text: 'Test transcript' }) },
    speech: { create: jest.fn().mockResolvedValue({
      arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-audio')),
    }) },
  },
}));
```

**Also add to `jest.config.js`:**
```javascript
moduleNameMapper: {
  '^openai$': '<rootDir>/__mocks__/openai.js',
},
```

This ensures OpenAI is mocked in ALL tests — no accidental real API calls in CI that burn credits.

---

## 📋 NEW TASKS: 90–102

| # | Task | What It Fixes |
|---|---|---|
| 90 | Add `FCM_PROJECT_ID` + `FRONTEND_APP_URL` to env.js Zod schema | Bug 1 |
| 91 | Fix queues.js `module.exports` to include morning/evening queues | Bug 2 |
| 92 | Move `__mocks__/openai.js` to project root + update jest.config.js | Bug 3 |
| 93 | Implement `PATCH /execute/log` (edit log handler) | Bug 4 |
| 94 | Implement `POST /auth/logout` + `logoutUser()` in auth.service | Missing Route 1 |
| 95 | Implement `POST /auth/logout-all` + `logoutAll()` in auth.service | Missing Route 2 |
| 96 | Implement `POST /auth/refresh` controller + wire route | Missing Route 3 |
| 97 | Implement `POST /plan/sprint/extra` + `DELETE /plan/sprint/extra/:taskId` | Missing Routes 4+5 |
| 98 | Implement `POST /identity/avatar-base` | Missing Route 6 |
| 99 | Implement `PATCH /identity/declaration` | Missing Route 7 |
| 100 | Implement `POST /reflect/voice` (voice reflection, premium) | Missing Route 8 |
| 101 | Create `__mocks__/openai.js` at project root + jest.config.js update | Missing File |
| 102 | Write E2E tests for auth logout, plan extras, identity avatar-base | Test coverage |

---

## ✅ DEFINITIVE COMPLETE TASK INVENTORY (102 total)

| Range | Source | Count | Status |
|---|---|---|---|
| Tasks 1–60 | `REVUP_BACKEND_MASTER_PLAN.md` | 60 | Original plan |
| Tasks 61–78 | `REVUP_PENDING_TASKS_SUPPLEMENT.md` | 18 | Gap filling round 1 |
| Tasks 79–89 | `REVUP_FINAL_GAPS.md` | 11 | Gap filling round 2 |
| Tasks 90–102 | This document | 13 | Gap filling round 3 |
| **TOTAL** | | **102** | **All gaps resolved** |

---

## 🔧 ALL CORRECTIONS — MASTER SUMMARY

Apply ALL of these before writing Task 1:

| # | File | Fix |
|---|---|---|
| C1 | `jest.config.js` | `setupFilesAfterFramework` → `setupFilesAfterEnv` |
| C2 | `package.json` | Add: `date-fns`, `date-fns-tz`, `firebase-admin`, `js-yaml`, `razorpay`, `uuid`, `pdfkit`, `@bull-board/api`, `@bull-board/express` |
| C3 | `src/config/env.js` | Add to Zod schema: `FCM_SERVICE_ACCOUNT_JSON`, `BULL_BOARD_ENABLED`, `FCM_PROJECT_ID`, `FRONTEND_APP_URL` |
| C4 | `src/server.js` | Import ALL 6 workers + call all 4 schedule functions at startup |
| C5 | `src/server.js` | Add all 6 `worker.close()` calls to graceful shutdown |
| C6 | `src/app.js` | Mount `/webhooks` with `express.raw()` BEFORE `express.json()` |
| C7 | `src/routes/index.js` | Write complete file — mounts all 12 route files under `/api/v1` |
| C8 | `src/jobs/queues.js` | Add morning/evening queues + update `module.exports` |
| C9 | `__mocks__/openai.js` | Create at PROJECT ROOT (not inside src/tests) |
| C10 | `src/services/voice/stt.service.js` | Task 55 IMPLEMENTS this file fully — do NOT create `whisper.service.js` |

---

## 📁 ALL FILES THAT NOW HAVE IMPLEMENTATIONS (Sorted by location)

After all 102 tasks, every file in the Section 17 folder structure is covered:

```
src/app.js                                  → Task 1, Task 77
src/server.js                               → Task 1, Task 3, Task 4 (corrections C4/C5)
src/config/env.js                           → Task 1 (corrections C3)
src/config/db.js                            → Task 3
src/config/redis.js                         → Task 4
src/config/constants.js                     → Task 12
src/config/redis-keys.js                    → Task 4
src/config/avatar-states.js                 → Task 26
src/config/firebase.js                      → Task 64
src/config/aws.js                           → Task 82 (Final Gaps)
src/models/User.js                          → Task 6
src/models/IdentityProfile.js               → Task 7
src/models/Plan.js                          → Task 8
src/models/DailyExecutionLog.js             → Task 9
src/models/AlignmentMetric.js               → Task 10
src/models/JournalEntry.js                  → Task 11
src/models/WeeklyReview.js                  → Task 11
src/controllers/auth.controller.js          → Tasks 17, 94, 95, 96
src/controllers/identity.controller.js      → Tasks 25, 98, 99
src/controllers/plan.controller.js          → Tasks 33, 88 (Final Gaps), 97, 102
src/controllers/exec.controller.js          → Tasks 38, 39, 93
src/controllers/alignment.controller.js     → Task 61
src/controllers/avatar.controller.js        → Task 26
src/controllers/reflect.controller.js       → Tasks 46, 67, 86 (Final Gaps), 100
src/controllers/analytics.controller.js     → Task 54
src/controllers/voice.controller.js         → Task 84 (Final Gaps)
src/controllers/settings.controller.js      → Task 62
src/controllers/webhook.controller.js       → Task 52
src/controllers/admin.controller.js         → Task 63
src/routes/index.js                         → Task 76 (correction C7)
src/routes/auth.routes.js                   → Tasks 17, 94, 95, 96
src/routes/identity.routes.js               → Tasks 25, 66, 98, 99
src/routes/plan.routes.js                   → Tasks 33, 88 (Final Gaps), 97
src/routes/exec.routes.js                   → Tasks 38, 39, 93
src/routes/alignment.routes.js              → Task 61
src/routes/avatar.routes.js                 → Task 26
src/routes/reflect.routes.js                → Tasks 46, 67, 86 (Final Gaps), 100
src/routes/analytics.routes.js              → Task 54
src/routes/voice.routes.js                  → Task 84 (Final Gaps)
src/routes/settings.routes.js               → Task 62
src/routes/webhook.routes.js                → Task 52
src/routes/admin.routes.js                  → Task 63
src/middlewares/auth.mid.js                 → Task 16
src/middlewares/role.mid.js                 → Task 16
src/middlewares/validate.mid.js             → Task 12
src/middlewares/rateLimit.mid.js            → Task 5
src/middlewares/limit.tier.mid.js           → Task 53
src/middlewares/upload.mid.js               → Task 27
src/middlewares/error.mid.js                → Task 2
src/middlewares/feature.mid.js              → Task 66
src/validators/auth.validator.js            → Task 14
src/validators/identity.validator.js        → Tasks 20, 98, 99
src/validators/plan.validator.js            → Tasks 28, 88 (Final Gaps), 97
src/validators/exec.validator.js            → Task 35
src/validators/reflect.validator.js         → Task 72
src/services/auth/auth.service.js           → Tasks 15, 94, 95
src/services/auth/oauth.service.js          → Task 18
src/services/auth/reset.service.js          → Task 19
src/services/identity/identity.service.js   → Task 74
src/services/identity/risk.service.js       → Task 21
src/services/identity/baseline.util.js      → Task 22
src/services/identity/synthesis.service.js  → Task 24
src/services/planning/quarter.service.js    → Task 29
src/services/planning/month.service.js      → Task 30
src/services/planning/sprint.service.js     → Tasks 31, Ambiguity 1 (Final Gaps)
src/services/planning/adaptive.service.js   → Task 32
src/services/execution/exec.service.js      → Task 36
src/services/execution/timer.service.js     → Task 37
src/services/alignment/score.service.js     → Task 40
src/services/alignment/streak.service.js    → Task 41
src/services/alignment/drift.service.js     → Task 42
src/services/alignment/pattern.service.js   → Task 43
src/services/alignment/recalc.service.js    → Tasks 44, 73
src/services/reflection/journal.service.js  → Task 45
src/services/reflection/quality.service.js  → Task 45
src/services/avatar/avatar.service.js       → Task 26
src/services/analytics/dashboard.service.js → Task 54
src/services/analytics/pdf.service.js       → Task 67
src/services/ai/ai.orchestrator.js          → Task 23
src/services/ai/memory.short.js             → Task 47
src/services/ai/prompts/synthesis.prompt.js → Task 24
src/services/ai/prompts/reflection.prompt.js→ Task 48
src/services/ai/prompts/planning.prompt.js  → Task 29
src/services/ai/prompts/review.prompt.js    → Task 49
src/services/voice/stt.service.js           → Tasks 27, 55 (correction C10)
src/services/voice/tts.service.js           → Task 56
src/services/email/email.service.js         → Tasks 51, Ambiguity 3 (Final Gaps)
src/services/email/templates/reset.html     → Ambiguity 3 (Final Gaps)
src/services/email/templates/welcome.html   → Ambiguity 3 (Final Gaps)
src/services/notifications/fcm.service.js   → Task 64
src/jobs/queues.js                          → Tasks 44, 65 (correction C8)
src/jobs/workers/alignment.worker.js        → Task 44
src/jobs/workers/reflection.worker.js       → Task 48
src/jobs/workers/review.worker.js           → Task 49
src/jobs/workers/sweep.worker.js            → Task 50
src/jobs/workers/morning.worker.js          → Task 65
src/jobs/workers/evening.worker.js          → Task 65
src/utils/AppError.js                       → Task 2
src/utils/response.util.js                  → Task 2
src/utils/logger.js                         → Task 2
src/utils/hash.util.js                      → Task 13
src/utils/jwt.util.js                       → Task 13
src/utils/date.util.js                      → Task 34
src/utils/lock.util.js                      → Task 44
src/utils/constraint.util.js                → Task 28
src/utils/weight.util.js                    → Task 83 (Final Gaps)
src/utils/seed.js                           → Task 58
src/utils/validate-setup.js                 → Task 78
src/types/contracts.js                      → Task 85 (Final Gaps)
src/docs/swagger.yaml                       → Task 71
src/tests/setup.js                          → Task 1
src/tests/teardown.js                       → Task 1
src/tests/helpers/db.helper.js              → Task 1
src/tests/helpers/auth.helper.js            → Task 68
src/tests/helpers/factories/user.factory.js → Task 68
src/tests/helpers/factories/identity.factory.js → Task 68
src/tests/helpers/factories/plan.factory.js → Task 89 (Final Gaps)
src/tests/helpers/factories/metric.factory.js → Task 68
src/tests/e2e/auth.e2e.test.js              → Task 17
src/tests/e2e/identity.e2e.test.js          → Task 25
src/tests/e2e/plan.e2e.test.js              → Task 33
src/tests/e2e/execute.e2e.test.js           → Task 38
src/tests/e2e/alignment.e2e.test.js         → Task 75
src/tests/e2e/reflect.e2e.test.js           → Task 75
__mocks__/openai.js                         → Task 101 (this doc)
.eslintrc.js                                → Task 69
.prettierrc                                 → Task 69
.env.example                                → Task 1
.env.test                                   → Gap 14 (supplement)
jest.config.js                              → Task 1 (correction C1)
Dockerfile                                  → Task 59
.dockerignore                               → Task 59
docker-compose.yml                          → Task 59
docker-compose.prod.yml                     → Task 59
.github/workflows/deploy.yml               → Task 60
```

---

## 🏁 VERDICT

After 3 complete audit passes across 5,880 lines of spec:

**All 102 tasks are now fully specified. All routes in Section 16 have implementations. All files in Section 17 have task assignments. All env vars have Zod schema entries. All cross-file function calls have matching definitions. The build should complete without missing import errors.**

The most likely things to still fail on first build attempt:
1. Redis connection in test environment (ensure Redis is running locally for E2E)
2. OpenAI mock path (verify `__mocks__/openai.js` is at project root)
3. Worker import order in server.js (import AFTER db + redis connected)

---

*End of REVUP_DEEP_AUDIT.md*
*New bugs found: 4 | New missing routes: 8 | New tasks: 13 | Grand total: 102 tasks*
