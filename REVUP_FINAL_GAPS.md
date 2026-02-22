# 🔍 REVUP — FINAL GAPS ANALYSIS
> **This is the third and final document in the series.**  
> Read after: `REVUP_BACKEND_MASTER_PLAN.md` (Tasks 1–60) and `REVUP_PENDING_TASKS_SUPPLEMENT.md` (Tasks 61–78)  
> **Total tasks across all 3 docs: 78 + 11 new = 89 tasks**

---

## AUDIT METHOD

Every file referenced in imports, every route listed in Section 16, every folder listed in Section 17, and every env var used in code was checked against every task definition. The gaps below are items that **still have no implementation task** after both previous documents.

---

## 🔴 CRITICAL BUGS STILL IN THE PLAN

### Bug A — `package.json` still missing 3 packages

The supplement's GAP 1 added 6 missing packages but missed 3 more that are used in supplement tasks:

```json
{
  "dependencies": {
    "pdfkit":              "^0.15.0",
    "@bull-board/api":     "^5.15.2",
    "@bull-board/express": "^5.15.2"
  }
}
```

| Package | Used In | If missing |
|---|---|---|
| `pdfkit` | Task 67 (PDF export service) | `require('pdfkit')` crashes at runtime |
| `@bull-board/api` | Task 70 (Bull Board monitoring) | Queue dashboard crashes |
| `@bull-board/express` | Task 70 (Bull Board monitoring) | Queue dashboard crashes |

---

### Bug B — `env.js` Zod schema missing 2 new env vars

Task 64 adds `FCM_SERVICE_ACCOUNT_JSON` to `.env.example`. Task 70 adds `BULL_BOARD_ENABLED`. Neither is added to `src/config/env.js` Zod schema. The app will crash at startup because Zod's schema is exhaustive.

**Add to the Zod schema in `src/config/env.js`:**
```javascript
FCM_SERVICE_ACCOUNT_JSON: z.string().optional(),
BULL_BOARD_ENABLED: z.string().default('false').transform(v => v === 'true'),
```

---

### Bug C — `stt.service.js` vs `whisper.service.js` naming conflict

Task 27 creates `src/services/voice/stt.service.js` (scaffold).  
Task 55 creates `src/services/voice/whisper.service.js` (full implementation).  

`routes/index.js` (Task 76) mounts `voice.routes.js`. The voice controller (yet to be defined) must decide which file to import. The voice route `POST /voice/transcribe` needs a clear chain.

**Resolution — canonical naming:**
```
src/services/voice/stt.service.js       ← Task 27 creates this as a thin wrapper
src/services/voice/whisper.service.js   ← DOES NOT EXIST — remove from Task 55
```
Task 55 should IMPLEMENT `stt.service.js` fully (replacing the scaffold), not create a second file. The voice controller always imports `stt.service.js`.

---

### Bug D — `src/config/aws.js` referenced but never created

Task 56 contains:
```javascript
const { S3Client } = require('@aws-sdk/client-s3');
// ... referenced via require('../../config/aws.js')
```
No task creates `src/config/aws.js`. The TTS service will crash on import.

**Implementation (add to Task 56 or create standalone):**
```javascript
// src/config/aws.js
const { S3Client } = require('@aws-sdk/client-s3');
const env = require('./env');

let s3Client;

const getS3Client = () => {
  if (s3Client) return s3Client;

  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    return null; // AWS not configured — S3 features disabled
  }

  s3Client = new S3Client({
    region:      env.AWS_REGION,
    credentials: {
      accessKeyId:     env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
  return s3Client;
};

module.exports = { getS3Client };
```

---

## 🟠 MISSING FILES WITH NO IMPLEMENTATION TASK

### Gap A — `src/utils/weight.util.js` (completely undefined)

Listed in the folder structure (Section 17). Referenced in Task 31 as a dependency of `sprint.service.js`. But what it actually does is **never described anywhere** in either document.

**What it should do** (inferred from context — sprint generation needs this):
```javascript
// src/utils/weight.util.js

const { TASK_WEIGHTS } = require('../config/constants');

/**
 * Calculate the weighted score contribution of a set of tasks.
 * Used to validate that sprint task weights are correctly assigned.
 */
const getTaskWeight = (task) => {
  if (task.isHabit) return TASK_WEIGHTS.HABIT;    // 1.5
  if (task.isCore)  return TASK_WEIGHTS.CORE;     // 3
  return TASK_WEIGHTS.SUPPORT;                     // 1
};

/**
 * Calculate total weighted hours for a sprint.
 * Used by constraint checker.
 * @param {Array} tasks - Array of task objects with estimatedMins
 * @returns {number} Total weighted hours
 */
const getTotalWeightedHours = (tasks) => {
  return tasks.reduce((total, task) => {
    const weight = getTaskWeight(task);
    const hours  = (task.estimatedMins || 60) / 60;
    return total + (hours * weight);
  }, 0);
};

/**
 * Assign correct weight and flags to a task based on its type.
 * @param {'core' | 'support' | 'habit'} type
 * @returns {{ weight: number, isCore: boolean, isHabit: boolean }}
 */
const assignTaskWeight = (type) => {
  switch (type) {
    case 'core':    return { weight: TASK_WEIGHTS.CORE,    isCore: true,  isHabit: false };
    case 'habit':   return { weight: TASK_WEIGHTS.HABIT,   isCore: false, isHabit: true  };
    case 'support':
    default:        return { weight: TASK_WEIGHTS.SUPPORT, isCore: false, isHabit: false };
  }
};

module.exports = { getTaskWeight, getTotalWeightedHours, assignTaskWeight };
```

- **Test (Unit):** Core task returns weight 3. Habit task returns 1.5. Support returns 1.

---

### Gap B — `src/routes/voice.routes.js` and `src/controllers/voice.controller.js` (no task creates them)

`routes/index.js` (Task 76) mounts `voice.routes.js`:
```javascript
const voiceRoutes = require('./voice.routes');
router.use('/voice', voiceRoutes);
```

But **neither Task 27 nor Task 55 creates** `voice.routes.js` or `voice.controller.js`. The only voice endpoint is `POST /voice/transcribe`.

**Implementation:**
```javascript
// src/controllers/voice.controller.js

const sttService = require('../services/voice/stt.service');
const { sendSuccess } = require('../utils/response.util');

const transcribeAudio = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(require('../utils/AppError').Errors.INVALID_AUDIO_FORMAT());
    }
    const transcript = await sttService.transcribe(req.file.buffer, req.file.mimetype);
    const wordCount  = transcript.trim().split(/\s+/).filter(Boolean).length;
    return sendSuccess(res, { transcript, wordCount });
  } catch (err) {
    next(err);
  }
};

module.exports = { transcribeAudio };
```

```javascript
// src/routes/voice.routes.js

const router    = require('express').Router();
const { requireAuth }     = require('../middlewares/auth.mid');
const uploadMiddleware     = require('../middlewares/upload.mid');
const { transcribeAudio } = require('../controllers/voice.controller');

router.post('/transcribe', requireAuth, uploadMiddleware.single('audio'), transcribeAudio);

module.exports = router;
```

- **Test (E2E):** POST /voice/transcribe without file → 400. With valid audio → transcript returned.

---

### Gap C — `src/types/contracts.js` has no creation task

Section 10 defines this file with JSDoc types. It's referenced as "import types for IDE support" in service files. No task creates it. While optional at runtime, it should exist for IDE autocomplete.

**Action:** Add to Task 10 (DB Models) or create standalone:
```javascript
// src/types/contracts.js
// This file contains JSDoc type definitions only — no runtime code.
// Import in service files with: const { AlignmentInput } = require('../../types/contracts');

/**
 * @typedef {Object} AlignmentInput
 * @property {string}           userId
 * @property {string}           date
 * @property {DailyExecSummary} executionLog
 * @property {Object[]}         previousMetrics
 * @property {number}           reflectionQuality
 */

// ... (copy full content from Section 10 of master plan)

module.exports = {}; // Empty export — types are JSDoc only
```

---

## 🟡 MISSING ROUTES WITH NO IMPLEMENTATION TASK

The following routes appear in **Section 16 (API spec)** and are mounted in `routes/index.js` but have **no implementation task** in any of the 78 tasks:

### Gap D — `GET /reflect/audio/:journalId` (Premium)

Listed in Section 16.7. Returns presigned S3 URL for the AI TTS audio response.

**Add to `reflect.controller.js`:**
```javascript
// GET /reflect/audio/:journalId — Returns S3 presigned URL for TTS audio
const getAudioUrl = async (req, res, next) => {
  try {
    const { journalId } = req.params;
    const entry = await JournalEntry.findOne({
      _id:    journalId,
      userId: req.user._id,
    }).select('aiAudioUrl processingStatus');

    if (!entry) throw Errors.NOT_FOUND('Journal entry');
    if (!entry.aiAudioUrl) {
      return sendSuccess(res, { audioUrl: null, message: 'Audio not yet generated' });
    }

    return sendSuccess(res, { audioUrl: entry.aiAudioUrl });
  } catch (err) {
    next(err);
  }
};
```

**Add to `reflect.routes.js`:**
```javascript
router.get('/audio/:journalId', requireAuth, requireRole(['premium']), getAudioUrl);
```

---

### Gap E — `GET /reflect/weekly-card`

Listed in Section 16.7. Returns the latest weekly progress card.

**Add to `reflect.controller.js`:**
```javascript
const WeeklyReview = require('../models/WeeklyReview');

// GET /reflect/weekly-card — Returns latest weekly review
const getWeeklyCard = async (req, res, next) => {
  try {
    const review = await WeeklyReview
      .findOne({ userId: req.user._id })
      .sort({ weekStartDate: -1 });

    if (!review) {
      return sendSuccess(res, { card: null, message: 'No weekly review yet. Check back after Sunday.' });
    }

    return sendSuccess(res, {
      weekStartDate:   review.weekStartDate,
      weekEndDate:     review.weekEndDate,
      progressCard:    review.progressCard,
      behavioralInsight: review.behavioralInsight,
      averageScore:    review.averageAlignmentScore,
      driftTrend:      review.driftTrend,
      patternsSeen:    review.patternsSeen,
    });
  } catch (err) {
    next(err);
  }
};
```

**Add to `reflect.routes.js`:**
```javascript
router.get('/weekly-card', requireAuth, getWeeklyCard);
```

---

### Gap F — `DELETE /auth/account` (GDPR account deletion)

Listed in Section 16.1. No task implements it. This must delete all user data across all collections.

**Add to `auth.service.js`:**
```javascript
const deleteAccount = async (userId) => {
  // Import all models
  const IdentityProfile   = require('../../models/IdentityProfile');
  const Plan              = require('../../models/Plan');
  const DailyExecutionLog = require('../../models/DailyExecutionLog');
  const AlignmentMetric   = require('../../models/AlignmentMetric');
  const JournalEntry      = require('../../models/JournalEntry');
  const WeeklyReview      = require('../../models/WeeklyReview');
  const User              = require('../../models/User');

  // Delete all user data across all collections (GDPR right to erasure)
  await Promise.all([
    IdentityProfile.deleteOne({ userId }),
    Plan.deleteMany({ userId }),
    DailyExecutionLog.deleteMany({ userId }),
    AlignmentMetric.deleteMany({ userId }),
    JournalEntry.deleteMany({ userId }),
    WeeklyReview.deleteMany({ userId }),
  ]);

  // Finally delete the user
  await User.deleteOne({ _id: userId });

  // Clear all Redis keys for this user
  const REDIS_KEYS = require('../../config/redis-keys');
  const redis = require('../../config/redis');
  await Promise.all([
    redis.del(REDIS_KEYS.refreshToken(userId)),
    redis.del(REDIS_KEYS.identityCache(userId)),
    redis.del(REDIS_KEYS.avatarStateCache(userId)),
    redis.del(REDIS_KEYS.dashboardCache(userId)),
    redis.del(REDIS_KEYS.fcmToken(userId)),
  ]);
};
```

**Add to `auth.controller.js`:**
```javascript
const deleteAccount = async (req, res, next) => {
  try {
    await authService.deleteAccount(req.user._id.toString());
    return sendSuccess(res, {}, 'Account permanently deleted');
  } catch (err) {
    next(err);
  }
};
```

**Add to `auth.routes.js`:**
```javascript
router.delete('/account', requireAuth, deleteAccount);
```

---

### Gap G — `DELETE /identity/reset` (Premium)

Listed in Section 16.2. Allows premium users to completely reset their identity profile and restart onboarding.

**Add to `identity.service.js`:**
```javascript
const resetIdentity = async (userId) => {
  // Delete existing identity profile
  await IdentityProfile.deleteOne({ userId });
  // Delete existing plans (they were based on old identity)
  const Plan = require('../../models/Plan');
  await Plan.updateMany({ userId }, { $set: { isActive: false, archivedAt: new Date() } });
  // Clear cache
  await redis.del(REDIS_KEYS.identityCache(userId));
  await redis.del(REDIS_KEYS.planCache(userId));
};
```

**Add to `identity.routes.js`:**
```javascript
router.delete('/reset', requireAuth, requireRole(['premium']), async (req, res, next) => {
  try {
    await identityService.resetIdentity(req.user._id.toString());
    return sendSuccess(res, {}, 'Identity profile reset. Start onboarding again.');
  } catch (err) {
    next(err);
  }
});
```

---

### Gap H — `GET /plan/history` and `PATCH /plan/sprint`

Both listed in Section 16.3 but Task 33 doesn't implement them.

**Add to `plan.controller.js`:**
```javascript
// GET /plan/history — Paginated archived plans
const getPlanHistory = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const [plans, total] = await Promise.all([
      Plan.find({ userId: req.user._id, isActive: false })
          .sort({ archivedAt: -1 })
          .skip(skip).limit(limit)
          .select('quarterTheme quarterStartDate quarterEndDate archivedAt'),
      Plan.countDocuments({ userId: req.user._id, isActive: false }),
    ]);

    return sendPaginated(res, plans, total, page, limit);
  } catch (err) {
    next(err);
  }
};

// PATCH /plan/sprint — Edit sprint task names (not structure, just names)
const editSprint = async (req, res, next) => {
  try {
    const { taskId, name } = req.body;
    const plan = await Plan.findOne({ userId: req.user._id, isActive: true });
    if (!plan) throw Errors.PLAN_NOT_FOUND();

    // Find and update the task name in the current sprint
    const currentSprint = plan.weeklySprints[plan.weeklySprints.length - 1];
    const allTasks = [
      ...currentSprint.coreActions,
      ...currentSprint.supportingActions,
      currentSprint.identityHabit,
    ].filter(Boolean);

    const task = allTasks.find(t => t._id.toString() === taskId);
    if (!task) throw Errors.NOT_FOUND('Task');
    task.name = name;

    await plan.save();
    // Invalidate plan cache
    const weekKey = require('../utils/date.util').getISOWeekKey(new Date());
    await redis.del(REDIS_KEYS.planCache(req.user._id.toString(), weekKey));

    return sendSuccess(res, currentSprint, 'Sprint task updated');
  } catch (err) {
    next(err);
  }
};
```

**Add to `plan.routes.js`:**
```javascript
router.get('/history',  requireAuth, getPlanHistory);
router.patch('/sprint', requireAuth, validate(editSprintSchema), editSprint);
```

**Add to `plan.validator.js`:**
```javascript
const editSprintSchema = z.object({
  body: z.object({
    taskId: z.string().min(1),
    name:   z.string().min(3).max(200),
  }),
});
```

---

## 🟢 MISSING TEST FACTORY

### Gap I — `src/tests/helpers/factories/plan.factory.js`

Listed in folder structure (Section 17). Supplement (Task 68) added user, identity, and metric factories but **missed the plan factory**. E2E tests for planning need this.

```javascript
// src/tests/helpers/factories/plan.factory.js

const Plan = require('../../../../models/Plan');

const buildWeeklySprint = (weekOffset = 0) => {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1));
  weekStart.setDate(weekStart.getDate() - (weekOffset * 7));
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return {
    weekStartDate: weekStart,
    weekEndDate:   weekEnd,
    coreActions: [
      { name: 'Core Task 1', weight: 3, isCore: true,  isHabit: false, estimatedMins: 60 },
      { name: 'Core Task 2', weight: 3, isCore: true,  isHabit: false, estimatedMins: 60 },
      { name: 'Core Task 3', weight: 3, isCore: true,  isHabit: false, estimatedMins: 60 },
    ],
    supportingActions: [
      { name: 'Support Task 1', weight: 1, isCore: false, isHabit: false, estimatedMins: 30 },
      { name: 'Support Task 2', weight: 1, isCore: false, isHabit: false, estimatedMins: 30 },
    ],
    identityHabit: { name: 'Daily Habit', weight: 1.5, isCore: false, isHabit: true, estimatedMins: 20 },
    rerollCount:   0,
    adaptiveLevel: 1,
  };
};

const buildPlan = (userId, overrides = {}) => ({
  userId,
  quarterTheme:     'Build and Ship',
  quarterStartDate: new Date(),
  quarterEndDate:   new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  macroObjectives:  ['Launch MVP', 'Build audience', 'Improve health'],
  monthlyPlans:     [{ month: new Date(), objectives: ['Ship first feature', 'Get 10 users'] }],
  weeklySprints:    [buildWeeklySprint(0)],
  isActive:         true,
  ...overrides,
});

const createPlan = (userId, overrides = {}) =>
  Plan.create(buildPlan(userId, overrides));

const createPlanWithHistory = async (userId, weeks = 4) => {
  const sprints = Array.from({ length: weeks }, (_, i) => buildWeeklySprint(weeks - i - 1));
  return Plan.create({ ...buildPlan(userId), weeklySprints: sprints });
};

module.exports = { buildPlan, buildWeeklySprint, createPlan, createPlanWithHistory };
```

- **Test:** `createPlan(userId)` creates plan with 3 core tasks. `createPlanWithHistory(userId, 4)` creates 4 sprints.

---

## 🔵 AMBIGUITIES THAT NEED EXPLICIT RESOLUTION

### Ambiguity 1 — Sprint task name generation (AI vs non-AI)

Task 31 says: *"Task names can be AI-generated OR derived from monthly objectives (preferred)"*

This is the most dangerous ambiguity in the entire plan. If Claude Code decides to use AI here, it:
- Adds a blocking AI call to sprint generation
- Violates the spirit of async-only AI
- Adds unexpected cost

**Resolution — ALWAYS derive from objectives, never use AI for sprint task names:**

```javascript
// In src/services/planning/sprint.service.js

/**
 * Generate weekly sprint task names from monthly objectives.
 * NO AI CALLS HERE — task names derived from objectives deterministically.
 *
 * Algorithm:
 * 1. Take current month's objectives (strings like "Ship first feature")
 * 2. Map each to an actionable task name with an action verb
 * 3. Fill remaining slots with identity-aligned default tasks
 *
 * @param {string[]} monthlyObjectives - Current month's objective strings
 * @param {string} desiredRole - User's future role (for context)
 * @param {string[]} skillGoals - User's skill goals
 * @returns {{ coreTasks: string[], supportTasks: string[], habitName: string }}
 */
function deriveSprintTaskNames(monthlyObjectives, desiredRole, skillGoals) {
  const actionVerbs = ['Build', 'Complete', 'Ship', 'Finalize', 'Publish', 'Execute', 'Launch'];

  // Core tasks: map from objectives or generate role-aligned defaults
  const coreTasks = monthlyObjectives.slice(0, 3).map((obj, i) => {
    const verb = actionVerbs[i % actionVerbs.length];
    // Trim long objectives to fit as task names
    const shortObj = obj.length > 50 ? obj.substring(0, 47) + '...' : obj;
    return `${verb}: ${shortObj}`;
  });

  // Fill remaining core task slots if < 3 objectives
  while (coreTasks.length < 3) {
    coreTasks.push(`${actionVerbs[coreTasks.length]}: Priority work for ${desiredRole || 'your goals'}`);
  }

  // Support tasks: skill-building activities
  const supportTasks = (skillGoals || []).slice(0, 2).map(skill =>
    `Practice: ${skill}`
  );
  while (supportTasks.length < 2) {
    supportTasks.push('Review progress and adjust approach');
  }

  // Habit: from first skill goal or generic
  const habitName = skillGoals?.[0]
    ? `Daily ${skillGoals[0]} practice`
    : 'Identity habit: 30-min deep work session';

  return { coreTasks, supportTasks, habitName };
}
```

---

### Ambiguity 2 — Razorpay webhook signature verification

Task 52 says "Razorpay: similar pattern with Razorpay SDK signature validation" but provides no code. The Razorpay signature method is different from Stripe.

**Resolution:**
```javascript
// In webhook.controller.js, Razorpay handler:

const handleRazorpay = async (req, res, next) => {
  try {
    const crypto    = require('crypto');
    const signature = req.headers['x-razorpay-signature'];
    const body      = req.body; // raw buffer (express.raw middleware)

    if (!env.RAZORPAY_KEY_SECRET) {
      return sendError(res, 'Razorpay not configured', 503, 'SERVICE_UNAVAILABLE');
    }

    // Razorpay uses HMAC-SHA256 with the webhook secret
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return sendError(res, 'Invalid Razorpay signature', 400, 'INVALID_SIGNATURE');
    }

    const event = JSON.parse(body.toString());

    // Handle Razorpay events
    if (event.event === 'subscription.activated') {
      const email = event.payload?.subscription?.entity?.notes?.email;
      if (email) {
        await User.findOneAndUpdate({ email }, { $set: { subscriptionTier: 'premium' } });
      }
    }

    if (event.event === 'subscription.cancelled' || event.event === 'subscription.completed') {
      const email = event.payload?.subscription?.entity?.notes?.email;
      if (email) {
        await User.findOneAndUpdate({ email }, { $set: { subscriptionTier: 'free' } });
      }
    }

    return sendSuccess(res, { received: true });
  } catch (err) {
    next(err);
  }
};
```

---

### Ambiguity 3 — Email HTML template content

Task 51 says "HTML templates must be valid email HTML" but the actual HTML for `reset.html` and `welcome.html` is never written.

**`src/services/email/templates/reset.html`:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your RevUp Password</title>
</head>
<body style="margin:0;padding:0;background-color:#0F0F1E;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0F0F1E;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1A1A2E;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:40px;text-align:center;">
              <h1 style="color:#6B8EFF;font-size:28px;margin:0 0 8px;">RevUp</h1>
              <p style="color:#888;font-size:13px;margin:0 0 32px;">Identity Alignment System</p>
              <h2 style="color:#FFFFFF;font-size:22px;margin:0 0 16px;">Reset Your Password</h2>
              <p style="color:#AAAAAA;font-size:15px;line-height:1.6;margin:0 0 32px;">
                You requested a password reset. Click the button below to create a new password.
                This link expires in 1 hour.
              </p>
              <a href="{{RESET_LINK}}" 
                 style="display:inline-block;background-color:#6B8EFF;color:#FFFFFF;text-decoration:none;
                        padding:14px 32px;border-radius:6px;font-size:16px;font-weight:bold;">
                Reset Password
              </a>
              <p style="color:#666;font-size:12px;margin:32px 0 0;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

**`src/services/email/templates/welcome.html`:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to RevUp</title>
</head>
<body style="margin:0;padding:0;background-color:#0F0F1E;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0F0F1E;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1A1A2E;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:40px;text-align:center;">
              <h1 style="color:#6B8EFF;font-size:28px;margin:0 0 8px;">RevUp</h1>
              <p style="color:#888;font-size:13px;margin:0 0 32px;">Identity Alignment System</p>
              <h2 style="color:#FFFFFF;font-size:22px;margin:0 0 16px;">Your identity is set. Time to execute.</h2>
              <p style="color:#AAAAAA;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Welcome, {{NAME}}. Your 90-day identity alignment journey starts now.
              </p>
              <p style="color:#FFD700;font-size:16px;font-style:italic;margin:0 0 32px;">
                "{{DECLARATION}}"
              </p>
              <a href="{{APP_URL}}" 
                 style="display:inline-block;background-color:#6B8EFF;color:#FFFFFF;text-decoration:none;
                        padding:14px 32px;border-radius:6px;font-size:16px;font-weight:bold;">
                Open RevUp
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Update `email.service.js` to use templates:**
```javascript
const fs   = require('fs');
const path = require('path');

const renderTemplate = (templateName, vars) => {
  const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
  let html = fs.readFileSync(templatePath, 'utf8');
  for (const [key, value] of Object.entries(vars)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }
  return html;
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetLink = `${env.FRONTEND_WEB_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  const html = renderTemplate('reset', { RESET_LINK: resetLink });
  await resend.emails.send({
    from:    env.EMAIL_FROM,
    to:      email,
    subject: 'Reset your RevUp password',
    html,
  });
};

const sendWelcomeEmail = async (email, name, declaration) => {
  const html = renderTemplate('welcome', {
    NAME:        name || email.split('@')[0],
    DECLARATION: declaration || 'I am becoming who I was meant to be.',
    APP_URL:     env.FRONTEND_APP_URL,
  });
  await resend.emails.send({
    from:    env.EMAIL_FROM,
    to:      email,
    subject: 'Your identity is set. Time to execute.',
    html,
  });
};
```

---

### Ambiguity 4 — `GET /auth/me` vs `PATCH /auth/me` never written

Task 17 mentions these exist but no code is given. Only `POST /register` and `POST /login` have implicit implementation from auth.service.js.

**Add to `auth.controller.js`:**
```javascript
const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, req.user); // req.user attached by requireAuth middleware
  } catch (err) { next(err); }
};

const updateMe = async (req, res, next) => {
  try {
    const { timezone, notificationPreferences } = req.body;
    const update = {};
    if (timezone)               update.timezone = timezone;
    if (notificationPreferences) {
      for (const [k, v] of Object.entries(notificationPreferences)) {
        update[`notificationPreferences.${k}`] = v;
      }
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true });
    return sendSuccess(res, user, 'Profile updated');
  } catch (err) { next(err); }
};
```

---

## 📋 NEW TASKS: 79–89

| # | Task | Gap Fixed | Files |
|---|---|---|---|
| 79 | Add pdfkit + bull-board to package.json | Bug A | `package.json` |
| 80 | Add missing vars to env.js Zod schema | Bug B | `src/config/env.js` |
| 81 | Resolve stt.service.js naming — implement fully in Task 55 | Bug C | `src/services/voice/stt.service.js` |
| 82 | Create `src/config/aws.js` | Bug D | `src/config/aws.js` |
| 83 | Create `src/utils/weight.util.js` | Gap A | `src/utils/weight.util.js` |
| 84 | Create voice.routes.js + voice.controller.js | Gap B | Both files above |
| 85 | Create `src/types/contracts.js` | Gap C | `src/types/contracts.js` |
| 86 | Implement reflect/audio, reflect/weekly-card routes | Gaps D+E | `reflect.controller.js`, `reflect.routes.js` |
| 87 | Implement DELETE /auth/account + DELETE /identity/reset | Gaps F+G | `auth.service.js`, `identity.service.js`, routes |
| 88 | Implement GET /plan/history + PATCH /plan/sprint | Gap H | `plan.controller.js`, `plan.routes.js` |
| 89 | Create `plan.factory.js` test helper | Gap I | `src/tests/helpers/factories/plan.factory.js` |

---

## ✅ COMPLETE TASK INVENTORY (89 total)

| Range | Source | Count |
|---|---|---|
| Tasks 1–60 | `REVUP_BACKEND_MASTER_PLAN.md` | 60 |
| Tasks 61–78 | `REVUP_PENDING_TASKS_SUPPLEMENT.md` | 18 |
| Tasks 79–89 | This document (`REVUP_FINAL_GAPS.md`) | 11 |
| **TOTAL** | | **89 tasks** |

---

## 🏁 WHAT IS NOW FULLY COVERED

After all 3 documents, the following are completely specified with code:

✅ All 7 Mongoose models  
✅ All alignment math (score, streak, drift, patterns)  
✅ All AI prompts  
✅ All BullMQ queue/worker contracts  
✅ All Redis key conventions  
✅ All standard response helpers  
✅ All error factories  
✅ All avatar state configs  
✅ Complete app.js middleware order  
✅ Complete routes/index.js  
✅ All env vars with Zod validation  
✅ Docker + CI/CD  
✅ All test factories  
✅ Swagger YAML scaffold  
✅ FCM push notifications  
✅ PDF export  
✅ Feature flags  
✅ Bull Board monitoring  
✅ Account deletion (GDPR)  
✅ Email templates with HTML  
✅ Razorpay webhook verification  
✅ Voice routes and controller  
✅ Missing utility files (weight.util, aws.js, types/contracts)  
✅ Sprint task generation algorithm (deterministic, no AI)  

---

## 🔧 FINAL CORRECTIONS SUMMARY

| # | File | Fix |
|---|---|---|
| 1 | `package.json` | Add pdfkit, @bull-board/api, @bull-board/express |
| 2 | `src/config/env.js` | Add FCM_SERVICE_ACCOUNT_JSON and BULL_BOARD_ENABLED to Zod schema |
| 3 | `src/services/voice/stt.service.js` | Task 55 should implement this file fully — do NOT create whisper.service.js |
| 4 | `src/config/aws.js` | Create this file before Task 56 (TTS) |
| 5 | Sprint generation | Task names ALWAYS derived from objectives — never call AI in sprint.service.js |

---

*End of REVUP_FINAL_GAPS.md*  
*Additional gaps found: 9 | New tasks: 11 (Tasks 79–89) | Additional corrections: 5*  
*Grand total: 89 tasks across 3 documents*
