# 🔧 REVUP BACKEND — PENDING TASKS SUPPLEMENT
> **Continues from:** `REVUP_BACKEND_MASTER_PLAN.md` (60 tasks)  
> **This file:** Tasks 61–78 + critical corrections to the original plan  
> **Purpose:** Fill every gap identified by auditing the 60-task plan against its own references  

---

## ⚠️ CRITICAL AUDIT FINDINGS

The original 60-task plan references files, constants, and services that have **no corresponding task** to implement them. Claude Code will hit dead ends unless these are resolved. Every gap below was found by cross-referencing Section 16 (API spec), Section 17 (folder structure), Section 4 (constants), and the 60 task definitions.

---

## 🐛 GAP 1 — PACKAGE.JSON IS MISSING DEPENDENCIES

> **Action:** Update `package.json` before starting any task. All packages below are referenced in existing tasks but absent from the dependencies list.

```json
{
  "dependencies": {
    "@aws-sdk/client-s3":              "^3.525.0",
    "@aws-sdk/s3-request-presigner":   "^3.525.0",
    "bcrypt":                          "^5.1.1",
    "bullmq":                          "^5.1.6",
    "cors":                            "^2.8.5",
    "date-fns":                        "^3.3.1",
    "date-fns-tz":                     "^3.1.3",
    "dotenv":                          "^16.4.1",
    "express":                         "^4.18.2",
    "express-rate-limit":              "^7.1.5",
    "firebase-admin":                  "^12.0.0",
    "helmet":                          "^7.1.0",
    "ioredis":                         "^5.3.2",
    "js-yaml":                         "^4.1.0",
    "jsonwebtoken":                    "^9.0.2",
    "mongoose":                        "^8.1.1",
    "multer":                          "^1.4.5-lts.1",
    "openai":                          "^4.26.0",
    "pino":                            "^8.18.0",
    "pino-http":                       "^9.0.0",
    "rate-limit-redis":                "^4.2.0",
    "razorpay":                        "^2.9.2",
    "resend":                          "^3.2.0",
    "stripe":                          "^14.17.0",
    "swagger-ui-express":              "^5.0.0",
    "uuid":                            "^9.0.1",
    "zod":                             "^3.22.4"
  },
  "devDependencies": {
    "@types/jest":                     "^29.5.11",
    "eslint":                          "^8.57.0",
    "jest":                            "^29.7.0",
    "mongodb-memory-server":           "^9.1.6",
    "nodemon":                         "^3.0.3",
    "prettier":                        "^3.2.4",
    "supertest":                       "^6.3.4"
  }
}
```

**Missing packages and why they're needed:**

| Package | Referenced In | Reason |
|---|---|---|
| `date-fns` | Task 34, Task 53 | `getISOWeek()` for Redis week keys |
| `date-fns-tz` | Task 34 | Timezone-aware date normalization |
| `firebase-admin` | Folder structure, NOTIFICATION_TYPES | FCM push notifications |
| `js-yaml` | Task 57 | Parse `swagger.yaml` for Swagger UI |
| `razorpay` | Task 52, Section 16.11 | Razorpay webhook signature verification |
| `uuid` | Task 27, Task 55 | Generate temp file names for audio |

---

## 🐛 GAP 2 — ALIGNMENT DASHBOARD ROUTES NEVER WIRED

> **Problem:** Tasks 40–44 implement the alignment math services but **no task creates the HTTP layer** for the alignment routes defined in Section 16.5.
> `src/controllers/alignment.controller.js` and `src/routes/alignment.routes.js` appear in the folder structure but have no implementation task.

**See Task 61 below.**

---

## 🐛 GAP 3 — SETTINGS ROUTES HAVE NO IMPLEMENTATION TASK

> **Problem:** Section 16.10 defines `PATCH /settings/notifications`, `PATCH /settings/fcm-token`, `GET /settings/subscription`. These routes appear in the folder structure and API spec but **no task builds them**.

**See Task 62 below.**

---

## 🐛 GAP 4 — ADMIN ROUTES HAVE NO IMPLEMENTATION TASK

> **Problem:** Section 16.12 defines admin-only routes. `src/controllers/admin.controller.js` and `src/routes/admin.routes.js` are in the folder structure but **no task implements them**.

**See Task 63 below.**

---

## 🐛 GAP 5 — FCM PUSH NOTIFICATION SERVICE NEVER BUILT

> **Problem:** `NOTIFICATION_TYPES` constants are fully defined. `fcm.service.js` is in the folder structure. `FCM_SERVER_KEY` and `FCM_PROJECT_ID` are in env. `firebase-admin` would be installed. But **no task implements the actual FCM service** or schedules morning/evening notification jobs.
> `QUEUES.MORNING` and `QUEUES.EVENING` are defined in constants and have no workers.

**See Tasks 64–65 below.**

---

## 🐛 GAP 6 — FEATURE FLAG MIDDLEWARE NEVER BUILT

> **Problem:** `src/middlewares/feature.mid.js` is listed in the folder structure. `FEATURE_VOICE_ONBOARDING` and `FEATURE_TTS_RESPONSE` flags are in env config. But **no task implements this middleware**.
> Task 27 creates voice routes without checking the feature flag.

**See Task 66 below.**

---

## 🐛 GAP 7 — PDF EXPORT IS A LISTED PREMIUM FEATURE WITH ZERO IMPLEMENTATION

> **Problem:** `GET /reflect/export/pdf` appears in Section 16.7. "PDF export" is listed as a premium feature in Section 2. But there is no task, no library, no implementation plan for it.

**See Task 67 below.**

---

## 🐛 GAP 8 — TEST FACTORY FILES NEVER BUILT

> **Problem:** The folder structure lists test factories:
> - `src/tests/helpers/auth.helper.js`
> - `src/tests/helpers/factories/user.factory.js`
> - `src/tests/helpers/factories/identity.factory.js`
> - `src/tests/helpers/factories/plan.factory.js`
> - `src/tests/helpers/factories/metric.factory.js`
>
> The E2E tests (Tasks 17, 25, 38, 46, etc.) all assume these exist. Without them, every E2E test will have duplicated setup code or fail entirely.

**See Task 68 below.**

---

## 🐛 GAP 9 — ESLINT + PRETTIER CONFIGS NEVER SPECIFIED

> **Problem:** `.eslintrc.js` and `.prettierrc` appear in the root folder structure. The `lint` and `lint:fix` npm scripts reference ESLint. But no task creates these config files, so `npm run lint` will crash.

**See Task 69 below.**

---

## 🐛 GAP 10 — BULL BOARD QUEUE MONITORING MISSING

> **Problem:** BullMQ queues run async in production. Without a monitoring dashboard, there is no way to observe failed jobs, retried jobs, or queue backlogs. The plan has no task for this critical operational tool.

**See Task 70 below.**

---

## 🐛 GAP 11 — MISSING JEST CONFIG KEY (`setupFilesAfterFramework` TYPO)

> **Problem:** In Section 18, `jest.config.js` contains a **typo**:
> ```js
> setupFilesAfterFramework: ['./src/tests/helpers/db.helper.js'],
> ```
> The correct Jest key is `setupFilesAfterFramework` → should be `setupFilesAfterEnv`.
> This will silently fail — db.helper.js will never run, and all E2E tests will fail with "Cannot connect to MongoDB" errors.

**Correction — replace in `jest.config.js`:**
```javascript
// ❌ Wrong (from original plan)
setupFilesAfterFramework: ['./src/tests/helpers/db.helper.js'],

// ✅ Correct
setupFilesAfterEnv: ['./src/tests/helpers/db.helper.js'],
```

---

## 🐛 GAP 12 — WORKER STARTUP NEVER WIRED TO SERVER

> **Problem:** BullMQ workers (alignment.worker.js, reflection.worker.js, review.worker.js, sweep.worker.js) are created in Phase 7/8 but **`server.js` never starts them**. Workers must be imported and instantiated at startup or they'll never process jobs.

**Correction — add to `src/server.js`:**
```javascript
// After DB and Redis connect, before app.listen:
const alignmentWorker  = require('./jobs/workers/alignment.worker');
const reflectionWorker = require('./jobs/workers/reflection.worker');
const reviewWorker     = require('./jobs/workers/review.worker');
const sweepWorker      = require('./jobs/workers/sweep.worker');

// Also schedule repeatable jobs on startup
const { scheduleWeeklyReviews, scheduleMidnightSweep } = require('./jobs/queues');
await scheduleWeeklyReviews();
await scheduleMidnightSweep();
```

---

## 🐛 GAP 13 — GRACEFUL WORKER SHUTDOWN MISSING

> **Problem:** `server.js` has graceful shutdown for MongoDB and Redis, but BullMQ workers must also be closed gracefully or jobs get orphaned mid-process.

**Add to graceful shutdown in `server.js`:**
```javascript
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received — shutting down`);
  
  // 1. Stop accepting new HTTP requests
  server.close();
  
  // 2. Close BullMQ workers (waits for in-flight jobs to complete)
  await Promise.all([
    alignmentWorker.close(),
    reflectionWorker.close(),
    reviewWorker.close(),
    sweepWorker.close(),
  ]);
  
  // 3. Close DB and Redis
  await mongoose.connection.close();
  await redis.quit();
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
```

---

## 🐛 GAP 14 — MISSING `.env.test` FILE SPEC

> **Problem:** The folder structure lists `.env.test` but it's never specified. The test setup sets vars via `process.env.X = '...'` in `setup.js`. However, if Claude Code creates a `.env.test` file and dotenv loads it, it might override the programmatic test setup, causing issues.

**Correct approach — `.env.test` should only contain:**
```bash
NODE_ENV=test
# All other vars are set programmatically in src/tests/setup.js
# Do NOT put real secrets here
PORT=3001
MONGO_URI=will_be_overridden_by_setup.js
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=test-access-secret-min-32-characters-long
JWT_REFRESH_SECRET=test-refresh-secret-min-32-characters-long
OPENAI_API_KEY=test-key-never-used
```

---

## 🐛 GAP 15 — SWAGGER SPEC FILE IS A PLACEHOLDER

> **Problem:** Task 57 says "Define all routes from Section 16 in OpenAPI 3.0 format" but provides no actual YAML. Claude Code cannot write a full swagger.yaml from scratch without a scaffold. This will result in either an empty spec or a hallucinated incorrect one.

**See Task 71 below (Swagger scaffold).**

---

## 🐛 GAP 16 — NO REFLECT VALIDATOR DEFINED

> **Problem:** The folder structure lists `src/validators/reflect.validator.js`. Task 46 creates reflection routes but references this file with no definition of what the Zod schema looks like. The evening reflection POST needs validation.

**Reflection Validator Schema** (add to Task 46 or handle in Task 77):
```javascript
// src/validators/reflect.validator.js

const { z } = require('zod');

const eveningReflectionSchema = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    text: z.string().min(10, 'Reflection too short').max(5000, 'Reflection too long'),
    tags: z.array(
      z.enum(['win', 'failure', 'insight', 'focus', 'energy', 'gratitude'])
    ).max(3).optional(),
  }),
});

const journalSearchSchema = z.object({
  query: z.object({
    q: z.string().min(2, 'Search query too short').max(100),
    page: z.string().optional().transform(Number),
    limit: z.string().optional().transform(Number),
  }),
});

module.exports = { eveningReflectionSchema, journalSearchSchema };
```

---

---

## 📋 NEW TASKS: 61–78

> Implement these AFTER completing Tasks 1–60. They are ordered by dependency.

---

### 🔴 TASK 61: Alignment Dashboard Controller & Routes
- **Fixes:** GAP 2
- **Depends On:** Task 10, Task 44, Task 4
- **Files:** `src/controllers/alignment.controller.js`, `src/routes/alignment.routes.js`
- **Goal:** Wire HTTP layer for all alignment endpoints defined in Section 16.5

**Implementation:**

```javascript
// src/controllers/alignment.controller.js

const AlignmentMetric = require('../models/AlignmentMetric');
const DailyExecutionLog = require('../models/DailyExecutionLog');
const { sendSuccess } = require('../utils/response.util');
const { Errors } = require('../utils/AppError');
const redis = require('../config/redis');
const REDIS_KEYS = require('../config/redis-keys');
const { getLocalDayBounds } = require('../utils/date.util');

/**
 * GET /alignment/dashboard
 * Returns current score, drift, streak, stateLevel, sevenDayAverage, patternFlags
 */
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    // Check cache first
    const cached = await redis.get(REDIS_KEYS.dashboardCache(userId));
    if (cached) {
      return sendSuccess(res, JSON.parse(cached));
    }

    // Fetch latest metric
    const latestMetric = await AlignmentMetric
      .findOne({ userId })
      .sort({ date: -1 });

    // Check if user logged today
    const { startUTC, endUTC } = getLocalDayBounds(req.user.timezone);
    const todayLog = await DailyExecutionLog.findOne({
      userId,
      date: { $gte: startUTC, $lte: endUTC },
    });

    const data = latestMetric
      ? {
          currentScore:    latestMetric.alignmentScore,
          driftIndex:      latestMetric.driftIndex,
          streakCount:     latestMetric.streakCount,
          stateLevel:      latestMetric.stateLevel,
          sevenDayAverage: latestMetric.sevenDayAverage,
          patternFlags:    latestMetric.patternFlags,
          today: {
            date:   new Date().toISOString().split('T')[0],
            logged: Boolean(todayLog),
          },
        }
      : {
          currentScore:    req.user.baselineAlignmentScore || 50,
          driftIndex:      0,
          streakCount:     0,
          stateLevel:      2,
          sevenDayAverage: 50,
          patternFlags:    [],
          today: { date: new Date().toISOString().split('T')[0], logged: false },
        };

    // Cache for 30 min
    await redis.setex(REDIS_KEYS.dashboardCache(userId), 1800, JSON.stringify(data));

    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /alignment/trend
 * Returns last 30 days of scores as array (null for missing days)
 */
const getTrend = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metrics = await AlignmentMetric.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    })
      .sort({ date: 1 })
      .select('date alignmentScore driftIndex stateLevel');

    return sendSuccess(res, metrics);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /alignment/patterns
 * Returns current pattern flags with descriptions
 */
const getPatterns = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const latest = await AlignmentMetric
      .findOne({ userId })
      .sort({ date: -1 })
      .select('patternFlags date');

    const descriptions = {
      MIDWEEK_DRIFT:    'Your Wednesday scores consistently drop 15+ points from Monday.',
      EFFORT_INFLATION: 'You rate your effort high but task completion stays low.',
      OVERCOMMITMENT:   'You are completing fewer than 40% of tasks most days.',
      STREAK_BREAK:     'You recently broke a strong streak. Rebuild momentum.',
    };

    const flags = latest?.patternFlags || [];
    const data = flags.map(f => ({
      flag:        f,
      description: descriptions[f] || f,
    }));

    return sendSuccess(res, { patterns: data, detectedAt: latest?.date });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getTrend, getPatterns };
```

```javascript
// src/routes/alignment.routes.js
const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth.mid');
const { getDashboard, getTrend, getPatterns } = require('../controllers/alignment.controller');

router.use(requireAuth);
router.get('/dashboard', getDashboard);
router.get('/trend',     getTrend);
router.get('/patterns',  getPatterns);

module.exports = router;
// Mount in src/routes/index.js: router.use('/alignment', alignmentRoutes);
```

- **Test (E2E):** GET /alignment/dashboard returns score object. New user without metrics returns baseline defaults. Cache hit on second request.

---

### 🟡 TASK 62: Settings Controller & Routes
- **Fixes:** GAP 3
- **Depends On:** Task 6, Task 16
- **Files:** `src/controllers/settings.controller.js`, `src/routes/settings.routes.js`
- **Goal:** User preferences, FCM token management, subscription status

```javascript
// src/controllers/settings.controller.js

const User = require('../models/User');
const redis = require('../config/redis');
const REDIS_KEYS = require('../config/redis-keys');
const { sendSuccess } = require('../utils/response.util');

const updateNotifications = async (req, res, next) => {
  try {
    const { morning, evening, drift, streak } = req.body;
    const update = {};
    if (morning  !== undefined) update['notificationPreferences.morning']  = morning;
    if (evening  !== undefined) update['notificationPreferences.evening']  = evening;
    if (drift    !== undefined) update['notificationPreferences.drift']    = drift;
    if (streak   !== undefined) update['notificationPreferences.streak']   = streak;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true }
    );
    return sendSuccess(res, { notificationPreferences: user.notificationPreferences });
  } catch (err) {
    next(err);
  }
};

const updateFcmToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    await User.findByIdAndUpdate(req.user._id, { $set: { fcmToken: token } });
    // Also cache in Redis for fast notification lookup
    await redis.setex(REDIS_KEYS.fcmToken(req.user._id.toString()), 86400 * 30, token);
    return sendSuccess(res, { message: 'FCM token updated' });
  } catch (err) {
    next(err);
  }
};

const getSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('subscriptionTier stripeCustomerId');
    return sendSuccess(res, {
      tier:             user.subscriptionTier,
      stripeCustomerId: user.stripeCustomerId,
      isPremium:        user.subscriptionTier === 'premium',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { updateNotifications, updateFcmToken, getSubscription };
```

```javascript
// src/routes/settings.routes.js — Zod validators inline
const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth.mid');
const { validate } = require('../middlewares/validate.mid');
const z = require('zod');
const ctrl = require('../controllers/settings.controller');

const notifSchema = z.object({ body: z.object({
  morning: z.boolean().optional(), evening: z.boolean().optional(),
  drift:   z.boolean().optional(), streak:  z.boolean().optional(),
})});
const fcmSchema = z.object({ body: z.object({ token: z.string().min(10) }) });

router.use(requireAuth);
router.patch('/notifications', validate(notifSchema), ctrl.updateNotifications);
router.patch('/fcm-token',     validate(fcmSchema),   ctrl.updateFcmToken);
router.get(  '/subscription',                          ctrl.getSubscription);

module.exports = router;
```

- **Test (E2E):** PATCH /settings/notifications with `{ morning: false }` → user preference updated. GET /settings/subscription returns tier.

---

### 🟠 TASK 63: Admin Controller & Routes
- **Fixes:** GAP 4
- **Depends On:** Task 6, Task 10, Task 16, Task 44
- **Files:** `src/controllers/admin.controller.js`, `src/routes/admin.routes.js`
- **Goal:** Admin-only platform management endpoints with `requireAdmin` guard

```javascript
// src/controllers/admin.controller.js

const User = require('../models/User');
const AlignmentMetric = require('../models/AlignmentMetric');
const { enqueueAlignment } = require('../jobs/queues');
const { sendSuccess, sendPaginated } = require('../utils/response.util');
const { PAGINATION } = require('../config/constants');

// POST /admin/calibrate/:userId — Force alignment recalculation
const calibrateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const date = new Date().toISOString();
    await enqueueAlignment({ userId, date, trigger: 'admin_calibrate' });
    return sendSuccess(res, { message: 'Recalculation queued', userId });
  } catch (err) {
    next(err);
  }
};

// GET /admin/users — Paginated user list with filters
const listUsers = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const tier  = req.query.tier;
    const skip  = (page - 1) * limit;

    const filter = {};
    if (tier) filter.subscriptionTier = tier;

    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).select('-passwordHash'),
      User.countDocuments(filter),
    ]);

    return sendPaginated(res, users, total, page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /admin/metrics — Platform-wide stats
const getPlatformMetrics = async (req, res, next) => {
  try {
    const [totalUsers, premiumUsers, totalMetrics, avgScore] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ subscriptionTier: 'premium', isActive: true }),
      AlignmentMetric.countDocuments({}),
      AlignmentMetric.aggregate([{ $group: { _id: null, avg: { $avg: '$alignmentScore' } } }]),
    ]);

    return sendSuccess(res, {
      totalActiveUsers: totalUsers,
      premiumUsers,
      totalAlignmentMetrics: totalMetrics,
      platformAverageScore: avgScore[0]?.avg?.toFixed(2) || 0,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { calibrateUser, listUsers, getPlatformMetrics };
```

```javascript
// src/routes/admin.routes.js
const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth.mid');
const { requireAdmin } = require('../middlewares/role.mid');
const ctrl = require('../controllers/admin.controller');

router.use(requireAuth, requireAdmin);
router.post('/calibrate/:userId', ctrl.calibrateUser);
router.get('/users',              ctrl.listUsers);
router.get('/metrics',            ctrl.getPlatformMetrics);

module.exports = router;
```

- **Test (E2E):** Non-admin user → 403. Admin user: GET /admin/metrics returns platform stats object.

---

### 🔵 TASK 64: FCM Push Notification Service
- **Fixes:** GAP 5 (part 1)
- **Depends On:** Task 4, Task 6
- **Files:** `src/services/notifications/fcm.service.js`, `src/config/firebase.js`
- **Goal:** Firebase Admin SDK setup + send push notification to a user

```javascript
// src/config/firebase.js
const admin = require('firebase-admin');
const env = require('./env');
const logger = require('../utils/logger');

let firebaseApp;

const getFirebaseApp = () => {
  if (firebaseApp) return firebaseApp;

  if (!env.FCM_SERVER_KEY || !env.FCM_PROJECT_ID) {
    logger.warn('Firebase credentials not configured — push notifications disabled');
    return null;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   env.FCM_PROJECT_ID,
        privateKey:  env.FCM_SERVER_KEY.replace(/\\n/g, '\n'),
        // Note: In production, use a full service account JSON file
        // Set FCM_SERVICE_ACCOUNT_JSON in env and parse it here
      }),
    });
    return firebaseApp;
  } catch (err) {
    logger.error({ err }, 'Failed to initialize Firebase — push notifications disabled');
    return null;
  }
};

module.exports = { getFirebaseApp, admin };
```

```javascript
// src/services/notifications/fcm.service.js

const { admin, getFirebaseApp } = require('../../config/firebase');
const redis = require('../../config/redis');
const REDIS_KEYS = require('../../config/redis-keys');
const logger = require('../../utils/logger');
const { NOTIFICATION_TYPES } = require('../../config/constants');

/**
 * Send a push notification to a user.
 * Silently no-ops if Firebase is not configured or user has no FCM token.
 *
 * @param {string} userId
 * @param {{ title: string, body: string, type: string, data?: object }} notification
 */
const sendPushToUser = async (userId, notification) => {
  try {
    const app = getFirebaseApp();
    if (!app) return; // Firebase not configured — skip silently

    // Get FCM token from cache or DB
    let fcmToken = await redis.get(REDIS_KEYS.fcmToken(userId));
    if (!fcmToken) {
      const User = require('../../models/User');
      const user = await User.findById(userId).select('fcmToken notificationPreferences');
      if (!user?.fcmToken) return;
      fcmToken = user.fcmToken;
      await redis.setex(REDIS_KEYS.fcmToken(userId), 86400, fcmToken);
    }

    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body:  notification.body,
      },
      data: {
        type: notification.type,
        ...(notification.data || {}),
      },
      android: { priority: 'high' },
      apns:    { payload: { aps: { sound: 'default' } } },
    };

    await admin.messaging().send(message);
    logger.info({ userId, type: notification.type }, 'Push notification sent');
  } catch (err) {
    // Log but never crash — notification failure is non-critical
    logger.error({ err, userId }, 'Failed to send push notification');
  }
};

// ─── Pre-built Notification Templates ─────────────────────────────────────

const sendMorningReminder = (userId) =>
  sendPushToUser(userId, {
    title: '🌅 Good morning. Time to set your intent.',
    body:  'What will you accomplish today to become who you said you would be?',
    type:  NOTIFICATION_TYPES.MORNING_REMINDER,
  });

const sendEveningReminder = (userId) =>
  sendPushToUser(userId, {
    title: '🌙 Evening check-in time.',
    body:  'Log your progress and reflect on today.',
    type:  NOTIFICATION_TYPES.EVENING_REMINDER,
  });

const sendDriftAlert = (userId, score) =>
  sendPushToUser(userId, {
    title: '⚠️ Alignment drift detected.',
    body:  `Your score has dropped to ${score}. Your future self needs you now.`,
    type:  NOTIFICATION_TYPES.DRIFT_ALERT,
    data:  { score: String(score) },
  });

const sendStreakMilestone = (userId, streakCount) =>
  sendPushToUser(userId, {
    title: `🔥 ${streakCount}-day streak!`,
    body:  'You are building real momentum. Keep going.',
    type:  NOTIFICATION_TYPES.STREAK_MILESTONE,
    data:  { streakCount: String(streakCount) },
  });

module.exports = {
  sendPushToUser,
  sendMorningReminder,
  sendEveningReminder,
  sendDriftAlert,
  sendStreakMilestone,
};
```

**Also add to `.env.example`:**
```bash
# Firebase Service Account (paste full JSON as escaped string, or use file path)
FCM_SERVICE_ACCOUNT_JSON=
```

- **Test (Unit, mocked Firebase):** `sendPushToUser` called with no token → no-ops. Firebase error → caught, logged, never throws.

---

### 🟢 TASK 65: Morning & Evening Notification Workers
- **Fixes:** GAP 5 (part 2)
- **Depends On:** Task 64, Task 4, Task 6
- **Files:** `src/jobs/workers/morning.worker.js`, `src/jobs/workers/evening.worker.js`
- **Goal:** BullMQ workers that send daily push reminders based on user timezone

```javascript
// src/jobs/workers/morning.worker.js

const { Worker } = require('bullmq');
const redis = require('../../config/redis');
const { QUEUES, JOBS } = require('../../config/constants');
const { sendMorningReminder } = require('../../services/notifications/fcm.service');
const User = require('../../models/User');
const logger = require('../../utils/logger');

// Sends morning reminder to all users whose local time is 7:00 AM ±30 min
const processMorningJob = async (job) => {
  const now = new Date();

  // Find users whose timezone puts them at 7AM right now (within 30min window)
  const users = await User.find({ isActive: true, 'notificationPreferences.morning': true });

  const eligible = users.filter(u => {
    try {
      const localTime = new Date(now.toLocaleString('en-US', { timeZone: u.timezone || 'UTC' }));
      const hour = localTime.getHours();
      const min  = localTime.getMinutes();
      return hour === 7 && min < 30; // 7:00 - 7:29 AM local time
    } catch {
      return false;
    }
  });

  logger.info({ count: eligible.length }, 'Sending morning reminders');

  // Send in parallel batches of 50
  for (let i = 0; i < eligible.length; i += 50) {
    const batch = eligible.slice(i, i + 50);
    await Promise.allSettled(batch.map(u => sendMorningReminder(u._id.toString())));
  }
};

const morningWorker = new Worker(QUEUES.MORNING, processMorningJob, { connection: redis });

morningWorker.on('failed', (job, err) => {
  logger.error({ err, jobId: job.id }, 'Morning reminder job failed');
});

module.exports = morningWorker;
```

```javascript
// src/jobs/workers/evening.worker.js — same pattern but hour === 21 (9 PM local)
const { Worker } = require('bullmq');
const redis = require('../../config/redis');
const { QUEUES } = require('../../config/constants');
const { sendEveningReminder } = require('../../services/notifications/fcm.service');
const User = require('../../models/User');
const logger = require('../../utils/logger');

const processEveningJob = async (job) => {
  const now = new Date();
  const users = await User.find({ isActive: true, 'notificationPreferences.evening': true });
  const eligible = users.filter(u => {
    try {
      const localTime = new Date(now.toLocaleString('en-US', { timeZone: u.timezone || 'UTC' }));
      return localTime.getHours() === 21 && localTime.getMinutes() < 30;
    } catch { return false; }
  });

  for (let i = 0; i < eligible.length; i += 50) {
    const batch = eligible.slice(i, i + 50);
    await Promise.allSettled(batch.map(u => sendEveningReminder(u._id.toString())));
  }
};

const eveningWorker = new Worker(QUEUES.EVENING, processEveningJob, { connection: redis });
module.exports = eveningWorker;
```

**Add to `src/jobs/queues.js`:**
```javascript
const morningQueue = new Queue(QUEUES.MORNING, { connection: redis });
const eveningQueue = new Queue(QUEUES.EVENING, { connection: redis });

// Schedule to run every 30 minutes (checks if any timezone is at 7AM or 9PM)
const scheduleMorningReminders = () =>
  morningQueue.add(JOBS.SEND_MORNING, {}, { ...defaultJobOpts, repeat: { cron: '*/30 * * * *' } });

const scheduleEveningReminders = () =>
  eveningQueue.add(JOBS.SEND_EVENING, {}, { ...defaultJobOpts, repeat: { cron: '*/30 * * * *' } });
```

**Add to `server.js` worker startup block:**
```javascript
const morningWorker = require('./jobs/workers/morning.worker');
const eveningWorker = require('./jobs/workers/evening.worker');
await scheduleMorningReminders();
await scheduleEveningReminders();
```

- **Test (Unit):** User in UTC+5:30 (IST) at 7:00 AM → eligible for morning reminder. User in UTC-5 at 7:00 AM IST → NOT eligible.

---

### 🟣 TASK 66: Feature Flag Middleware
- **Fixes:** GAP 6
- **Depends On:** None
- **Files:** `src/middlewares/feature.mid.js`
- **Goal:** Block routes when the feature is disabled via env flags

```javascript
// src/middlewares/feature.mid.js

const env = require('../config/env');
const { Errors } = require('../utils/AppError');

/**
 * Factory: returns middleware that checks if a feature flag is enabled.
 * 
 * Usage: router.post('/voice', requireFeature('FEATURE_VOICE_ONBOARDING'), handler)
 * 
 * @param {'FEATURE_VOICE_ONBOARDING' | 'FEATURE_TTS_RESPONSE'} flagName
 */
const requireFeature = (flagName) => (req, res, next) => {
  if (!env[flagName]) {
    return next(new Errors.FORBIDDEN(`Feature '${flagName}' is currently disabled`));
  }
  next();
};

module.exports = { requireFeature };
```

**Apply to voice routes in `src/routes/identity.routes.js`:**
```javascript
const { requireFeature } = require('../middlewares/feature.mid');

// Block voice onboarding unless feature is enabled
router.post('/voice', requireAuth, requireRole(['premium']), requireFeature('FEATURE_VOICE_ONBOARDING'), voiceHandler);
```

**Apply to TTS in `src/jobs/workers/reflection.worker.js`:**
```javascript
const { FEATURE_TTS_RESPONSE } = require('../../config/env');
// In worker, after saving AI feedback:
if (FEATURE_TTS_RESPONSE && user.subscriptionTier === 'premium') {
  await ttsService.generateTTSAndUpload(aiFeedback, userId, journalEntryId);
}
```

- **Test (Unit):** Feature flag `false` → middleware returns 403. Feature flag `true` → calls next().

---

### 🟤 TASK 67: PDF Monthly Report Export (Premium)
- **Fixes:** GAP 7
- **Depends On:** Task 11, Task 10, Task 16
- **Files:** `src/services/analytics/pdf.service.js`, `src/controllers/reflect.controller.js`
- **Goal:** Generate and stream a monthly PDF report for premium users

**Add to `package.json` dependencies:**
```json
"pdfkit": "^0.15.0"
```

```javascript
// src/services/analytics/pdf.service.js

const PDFDocument = require('pdfkit');
const AlignmentMetric = require('../../models/AlignmentMetric');
const JournalEntry = require('../../models/JournalEntry');
const IdentityProfile = require('../../models/IdentityProfile');

/**
 * Generate a monthly identity report PDF and pipe it to a stream.
 * 
 * @param {string} userId
 * @param {number} year   - e.g. 2025
 * @param {number} month  - 1-12
 * @param {import('http').ServerResponse} res - Express response object (we pipe directly)
 */
const generateMonthlyPDF = async (userId, year, month, res) => {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd   = new Date(year, month, 0, 23, 59, 59);

  const [metrics, entries, identity] = await Promise.all([
    AlignmentMetric.find({ userId, date: { $gte: monthStart, $lte: monthEnd } }).sort({ date: 1 }),
    JournalEntry.find({ userId, date: { $gte: monthStart, $lte: monthEnd } }).sort({ date: 1 }),
    IdentityProfile.findOne({ userId }),
  ]);

  const avgScore = metrics.length
    ? (metrics.reduce((s, m) => s + m.alignmentScore, 0) / metrics.length).toFixed(1)
    : 0;

  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="revup-${year}-${String(month).padStart(2,'0')}.pdf"`);
  doc.pipe(res);

  // ── Cover ──────────────────────────────────────────────────────────────
  doc.fontSize(28).font('Helvetica-Bold').text('RevUp Identity Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(14).font('Helvetica').text(
    `${monthStart.toLocaleString('en-US', { month: 'long' })} ${year}`,
    { align: 'center' }
  );
  doc.moveDown(1);

  // ── Identity Declaration ───────────────────────────────────────────────
  if (identity?.futureIdentity?.declarationSentence) {
    doc.fontSize(12).font('Helvetica-Bold').text('Identity Declaration');
    doc.fontSize(11).font('Helvetica-Oblique')
      .text(`"${identity.futureIdentity.declarationSentence}"`);
    doc.moveDown(1);
  }

  // ── Monthly Summary ────────────────────────────────────────────────────
  doc.fontSize(14).font('Helvetica-Bold').text('Monthly Summary');
  doc.moveDown(0.3);
  doc.fontSize(11).font('Helvetica');
  doc.text(`Average Alignment Score: ${avgScore}/100`);
  doc.text(`Days Tracked: ${metrics.length}`);
  doc.text(`Reflections Written: ${entries.length}`);

  if (metrics.length > 0) {
    const best = metrics.reduce((b, m) => m.alignmentScore > b.alignmentScore ? m : b);
    const worst = metrics.reduce((w, m) => m.alignmentScore < w.alignmentScore ? m : w);
    doc.text(`Best Day: ${best.alignmentScore} on ${best.date.toDateString()}`);
    doc.text(`Lowest Day: ${worst.alignmentScore} on ${worst.date.toDateString()}`);
  }
  doc.moveDown(1);

  // ── Pattern Flags ──────────────────────────────────────────────────────
  const allFlags = [...new Set(metrics.flatMap(m => m.patternFlags))];
  if (allFlags.length > 0) {
    doc.fontSize(14).font('Helvetica-Bold').text('Behavioral Patterns Detected');
    doc.moveDown(0.3);
    allFlags.forEach(f => doc.fontSize(11).font('Helvetica').text(`• ${f}`));
    doc.moveDown(1);
  }

  // ── Journal Excerpts (last 5 entries) ─────────────────────────────────
  if (entries.length > 0) {
    doc.fontSize(14).font('Helvetica-Bold').text('Recent Reflections');
    doc.moveDown(0.3);
    entries.slice(-5).forEach(e => {
      doc.fontSize(10).font('Helvetica-Bold')
        .text(e.date.toDateString());
      doc.fontSize(10).font('Helvetica')
        .text(e.reflectionText?.substring(0, 300) + (e.reflectionText?.length > 300 ? '...' : ''));
      doc.moveDown(0.5);
    });
  }

  doc.end();
};

module.exports = { generateMonthlyPDF };
```

**Add to `reflect.controller.js`:**
```javascript
const { generateMonthlyPDF } = require('../services/analytics/pdf.service');

// GET /reflect/export/pdf?year=2025&month=1
const exportPDF = async (req, res, next) => {
  try {
    const year  = parseInt(req.query.year)  || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    await generateMonthlyPDF(req.user._id.toString(), year, month, res);
  } catch (err) {
    next(err);
  }
};
```

- **Test (Unit):** `generateMonthlyPDF` pipes PDF bytes to response. Empty month → PDF with summary sections only (no crash).

---

### 🟢 TASK 68: Test Factory Helpers
- **Fixes:** GAP 8
- **Depends On:** Tasks 6–11
- **Files:** `src/tests/helpers/auth.helper.js`, `src/tests/helpers/factories/user.factory.js`, `src/tests/helpers/factories/identity.factory.js`, `src/tests/helpers/factories/plan.factory.js`, `src/tests/helpers/factories/metric.factory.js`
- **Goal:** Reusable factory functions for all E2E tests

```javascript
// src/tests/helpers/auth.helper.js
const User = require('../../../models/User');
const { hashPassword } = require('../../../utils/hash.util');
const { generateAccessToken, generateRefreshToken } = require('../../../utils/jwt.util');

/**
 * Create a test user and return tokens.
 * @param {object} overrides - Field overrides
 * @returns {{ user, accessToken, refreshToken }}
 */
const createTestUser = async (overrides = {}) => {
  const defaults = {
    email:        `test-${Date.now()}@revup.app`,
    passwordHash: await hashPassword('Password123!'),
    subscriptionTier: 'free',
    timezone: 'UTC',
    ...overrides,
  };
  const user = await User.create(defaults);
  return {
    user,
    accessToken:  generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
};

const createPremiumUser = (overrides = {}) =>
  createTestUser({ subscriptionTier: 'premium', ...overrides });

const createAdminUser = (overrides = {}) =>
  createTestUser({ isAdmin: true, subscriptionTier: 'premium', ...overrides });

module.exports = { createTestUser, createPremiumUser, createAdminUser };
```

```javascript
// src/tests/helpers/factories/user.factory.js
const User = require('../../../../models/User');
const { hashPassword } = require('../../../../utils/hash.util');

const buildUser = async (overrides = {}) => ({
  email:        `user-${Date.now()}@test.com`,
  passwordHash: await hashPassword('Password123!'),
  timezone:     'UTC',
  ...overrides,
});

const createUser = async (overrides = {}) => User.create(await buildUser(overrides));

module.exports = { buildUser, createUser };
```

```javascript
// src/tests/helpers/factories/identity.factory.js
const IdentityProfile = require('../../../../models/IdentityProfile');

const buildIdentity = (userId, overrides = {}) => ({
  userId,
  currentIdentity: {
    role: 'Software Engineer', energyLevel: 6,
    executionGap: 'focus', executionGapSeverity: 3,
    strengths: ['coding', 'problem solving'],
    weaknesses: ['consistency', 'distraction'],
    frustrationPoint: 'Starting tasks I never finish',
  },
  futureIdentity: {
    desiredRole: 'Senior Engineering Manager',
    incomeRange: '₹50L-1Cr',
    skillGoals: ['leadership', 'system design'],
    healthTarget: 8,
    confidenceTarget: 9,
    lifestyleVision: 'Location independent',
    declarationSentence: 'I am becoming a leader who executes with discipline.',
  },
  riskProfile: {
    stabilityScore: 55, procrastinationIndex: 40, driftProbability: 0.35,
    rawAnswers: [3, 2, 3, 4, 2, 3],
  },
  priorityPillars: ['career', 'health', 'finances'],
  timeConstraints: { availableHoursPerDay: 4, sleepHours: 7 },
  baselineAlignmentScore: 58,
  onboardingSteps: {
    currentIdentityDone: true, futureIdentityDone: true,
    constraintsDone: true, riskAssessmentDone: true,
    pillarsSelected: true, synthesized: true, avatarCreated: false,
  },
  ...overrides,
});

const createIdentity = (userId, overrides = {}) =>
  IdentityProfile.create(buildIdentity(userId, overrides));

module.exports = { buildIdentity, createIdentity };
```

```javascript
// src/tests/helpers/factories/metric.factory.js
const AlignmentMetric = require('../../../../models/AlignmentMetric');

/**
 * Create N days of AlignmentMetrics for a user.
 * @param {string} userId
 * @param {number} days - How many days back to create
 * @param {object} overrides - Applied to each metric
 */
const createMetricHistory = async (userId, days = 7, overrides = {}) => {
  const metrics = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    metrics.push({
      userId,
      date,
      alignmentScore:  Math.floor(Math.random() * 30) + 55, // 55-85
      rawScore:        Math.floor(Math.random() * 30) + 50,
      streakMultiplier: 1.0,
      streakCount:     Math.max(0, days - i - 1),
      driftIndex:      (Math.random() * 0.4) - 0.2,
      sevenDayAverage: 68,
      stateLevel:      2,
      patternFlags:    [],
      components: {
        coreCompletion: 70, supportCompletion: 60,
        habitCompletion: 100, effortNormalized: 60,
        reflectionQuality: 0,
      },
      ...overrides,
    });
  }
  return AlignmentMetric.insertMany(metrics);
};

module.exports = { createMetricHistory };
```

- **Test (Self-test):** `createTestUser()` creates user and returns valid JWT. `createMetricHistory(userId, 7)` creates 7 documents sorted correctly.

---

### 🔴 TASK 69: ESLint + Prettier Config
- **Fixes:** GAP 9
- **Depends On:** None
- **Files:** `.eslintrc.js`, `.prettierrc`, `.eslintignore`
- **Goal:** Code quality enforcement. `npm run lint` must succeed on a clean codebase.

```javascript
// .eslintrc.js
module.exports = {
  env: {
    node:  true,
    es2021: true,
    jest:  true,
  },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 'latest' },
  rules: {
    'no-console':          'error',   // Use logger instead
    'no-unused-vars':      ['error', { argsIgnorePattern: '^_' }],
    'no-process-exit':     'off',     // Allowed in server.js for fatal errors
    'prefer-const':        'error',
    'no-var':              'error',
    'eqeqeq':             ['error', 'always'],
    'curly':              'error',
  },
};
```

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

```
// .eslintignore
node_modules/
coverage/
src/docs/
```

- **Test:** `npm run lint` on a freshly created file returns no errors.

---

### 🟡 TASK 70: Bull Board Queue Monitoring
- **Fixes:** GAP 10
- **Depends On:** Tasks 8, 44, 48
- **Files:** `src/app.js` (addition only)
- **Goal:** Web UI for monitoring BullMQ queues in development/staging

**Add to `package.json` dependencies:**
```json
"@bull-board/express": "^5.15.2",
"@bull-board/api":     "^5.15.2"
```

```javascript
// Add to src/app.js (AFTER all other route mounting, BEFORE error handler)

const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter }   = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter }  = require('@bull-board/express');
const {
  alignmentQueue, reflectionQueue,
  reviewQueue, sweepQueue,
} = require('./jobs/queues');
const env = require('./config/env');

// Only mount in non-production OR if BULL_BOARD_ENABLED=true
if (env.NODE_ENV !== 'production' || process.env.BULL_BOARD_ENABLED === 'true') {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullMQAdapter(alignmentQueue),
      new BullMQAdapter(reflectionQueue),
      new BullMQAdapter(reviewQueue),
      new BullMQAdapter(sweepQueue),
    ],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());
  logger.info('Bull Board mounted at /admin/queues');
}
```

**Add to `.env.example`:**
```bash
BULL_BOARD_ENABLED=false   # Set to true in staging to monitor queues
```

- **Acceptance:** Browse `http://localhost:3000/admin/queues` → Bull Board UI shows all 4 queues with job counts.

---

### 🟠 TASK 71: Swagger YAML Scaffold
- **Fixes:** GAP 15 (Swagger spec is a placeholder with no actual content)
- **Depends On:** Task 1, all routes
- **Files:** `src/docs/swagger.yaml`
- **Goal:** Complete OpenAPI 3.0 spec for all routes. Must be valid YAML parseable by `js-yaml`.

```yaml
# src/docs/swagger.yaml
openapi: "3.0.3"
info:
  title: RevUp Identity Alignment API
  version: "1.0.0"
  description: Backend API for the RevUp Identity Alignment System

servers:
  - url: http://localhost:3000/api/v1
    description: Local development

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    SuccessResponse:
      type: object
      properties:
        success: { type: boolean, example: true }
        message: { type: string }
        data:    { type: object }

    ErrorResponse:
      type: object
      properties:
        success: { type: boolean, example: false }
        message: { type: string }
        code:    { type: string }
        errors:  { type: array, items: { type: object } }

    User:
      type: object
      properties:
        _id:              { type: string }
        email:            { type: string, format: email }
        subscriptionTier: { type: string, enum: [free, premium] }
        timezone:         { type: string }
        createdAt:        { type: string, format: date-time }

    Tokens:
      type: object
      properties:
        accessToken:  { type: string }
        refreshToken: { type: string }

    AlignmentDashboard:
      type: object
      properties:
        currentScore:    { type: number, minimum: 0, maximum: 100 }
        driftIndex:      { type: number, minimum: -1, maximum: 1 }
        streakCount:     { type: number }
        stateLevel:      { type: number, enum: [1, 2, 3] }
        sevenDayAverage: { type: number }
        patternFlags:    { type: array, items: { type: string } }

security:
  - BearerAuth: []

paths:
  /health:
    get:
      tags: [Health]
      security: []
      summary: Health check
      responses:
        "200":
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status: { type: string, example: ok }
                  mongo:  { type: string, example: connected }
                  redis:  { type: string, example: connected }

  /auth/register:
    post:
      tags: [Auth]
      security: []
      summary: Register with email and password
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:    { type: string, format: email }
                password: { type: string, minLength: 8 }
      responses:
        "201":
          description: User registered successfully
          content:
            application/json:
              schema:
                allOf:
                  - $ref: "#/components/schemas/SuccessResponse"
                  - properties:
                      data:
                        type: object
                        properties:
                          user:         { $ref: "#/components/schemas/User" }
                          accessToken:  { type: string }
                          refreshToken: { type: string }
        "409":
          description: Email already exists
          content:
            application/json:
              schema: { $ref: "#/components/schemas/ErrorResponse" }

  /auth/login:
    post:
      tags: [Auth]
      security: []
      summary: Login with email and password
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:    { type: string, format: email }
                password: { type: string }
      responses:
        "200":
          description: Login successful
        "401":
          description: Invalid credentials

  /auth/me:
    get:
      tags: [Auth]
      summary: Get current user
      responses:
        "200":
          description: User profile
          content:
            application/json:
              schema:
                allOf:
                  - $ref: "#/components/schemas/SuccessResponse"
                  - properties:
                      data: { $ref: "#/components/schemas/User" }
        "401":
          description: Unauthorized

  /alignment/dashboard:
    get:
      tags: [Alignment]
      summary: Get current alignment dashboard data
      responses:
        "200":
          description: Dashboard data
          content:
            application/json:
              schema:
                allOf:
                  - $ref: "#/components/schemas/SuccessResponse"
                  - properties:
                      data: { $ref: "#/components/schemas/AlignmentDashboard" }

  /alignment/trend:
    get:
      tags: [Alignment]
      summary: Get 30-day alignment score trend
      responses:
        "200":
          description: Array of daily metrics

  /alignment/patterns:
    get:
      tags: [Alignment]
      summary: Get current behavioral pattern flags
      responses:
        "200":
          description: Pattern flags with descriptions

  /execute/log:
    post:
      tags: [Execution]
      summary: Log daily task completions
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [date, tasks, habitDone]
              properties:
                date:           { type: string, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }
                habitDone:      { type: boolean }
                deepWorkMinutes:{ type: number, minimum: 0, maximum: 720 }
                tasks:
                  type: array
                  items:
                    type: object
                    properties:
                      taskId:     { type: string }
                      taskName:   { type: string }
                      weight:     { type: number }
                      isCore:     { type: boolean }
                      completed:  { type: boolean }
                      effortScore:{ type: number, minimum: 1, maximum: 10 }
      responses:
        "200":
          description: Log saved, alignment recalc enqueued
        "202":
          description: Accepted

  /reflect/evening:
    post:
      tags: [Reflection]
      summary: Submit evening reflection (async AI processing)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [date, text]
              properties:
                date: { type: string, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }
                text: { type: string, minLength: 10, maxLength: 5000 }
                tags:
                  type: array
                  maxItems: 3
                  items:
                    type: string
                    enum: [win, failure, insight, focus, energy, gratitude]
      responses:
        "202":
          description: Reflection accepted — AI processing in background

  /reflect/history:
    get:
      tags: [Reflection]
      summary: Get paginated journal history
      parameters:
        - name: page;  in: query; schema: { type: integer }
        - name: limit; in: query; schema: { type: integer }
        - name: tags;  in: query; schema: { type: string }
      responses:
        "200":
          description: Paginated journal entries

  /reflect/export/pdf:
    get:
      tags: [Reflection]
      summary: Export monthly PDF report (Premium)
      parameters:
        - name: year;  in: query; schema: { type: integer }
        - name: month; in: query; schema: { type: integer, minimum: 1, maximum: 12 }
      responses:
        "200":
          description: PDF file stream
          content:
            application/pdf:
              schema: { type: string, format: binary }
        "403":
          description: Premium required

  /avatar/state:
    get:
      tags: [Avatar]
      summary: Get current avatar state and visual config
      responses:
        "200":
          description: Avatar state

  /settings/notifications:
    patch:
      tags: [Settings]
      summary: Update notification preferences
      responses:
        "200":
          description: Preferences updated

  /settings/fcm-token:
    patch:
      tags: [Settings]
      summary: Update Firebase push notification token
      responses:
        "200":
          description: Token updated

  /settings/subscription:
    get:
      tags: [Settings]
      summary: Get subscription status
      responses:
        "200":
          description: Subscription info

  /webhooks/stripe:
    post:
      tags: [Webhooks]
      security: []
      summary: Stripe billing webhook
      responses:
        "200":
          description: Event processed
        "400":
          description: Invalid signature

  /admin/users:
    get:
      tags: [Admin]
      summary: List all users (admin only)
      parameters:
        - name: tier;  in: query; schema: { type: string }
        - name: page;  in: query; schema: { type: integer }
        - name: limit; in: query; schema: { type: integer }
      responses:
        "200":
          description: Paginated user list
        "403":
          description: Admin required

  /admin/metrics:
    get:
      tags: [Admin]
      summary: Platform-wide usage stats (admin only)
      responses:
        "200":
          description: Platform metrics
```

- **Acceptance:** `GET /api-docs` renders Swagger UI with all routes listed. Each route shows request/response schemas.

---

### 🟢 TASK 72: Reflect Validator (Missing from original plan)
- **Fixes:** GAP 16
- **Depends On:** Task 12
- **Files:** `src/validators/reflect.validator.js`
- **Goal:** Zod schemas for all reflection routes

```javascript
// src/validators/reflect.validator.js
const { z } = require('zod');

const eveningReflectionSchema = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
    text: z.string().min(10, 'Too short').max(5000, 'Too long'),
    tags: z.array(
      z.enum(['win', 'failure', 'insight', 'focus', 'energy', 'gratitude'])
    ).max(3).optional().default([]),
  }),
});

const historyQuerySchema = z.object({
  query: z.object({
    page:  z.string().optional().transform(v => v ? parseInt(v) : 1),
    limit: z.string().optional().transform(v => v ? parseInt(v) : 20),
    tags:  z.string().optional(),
  }),
});

const searchQuerySchema = z.object({
  query: z.object({
    q:     z.string().min(2).max(100),
    page:  z.string().optional().transform(v => parseInt(v) || 1),
    limit: z.string().optional().transform(v => parseInt(v) || 20),
  }),
});

const exportPDFQuerySchema = z.object({
  query: z.object({
    year:  z.string().optional().transform(v => parseInt(v) || new Date().getFullYear()),
    month: z.string().optional().transform(v => {
      const m = parseInt(v);
      return (m >= 1 && m <= 12) ? m : new Date().getMonth() + 1;
    }),
  }),
});

module.exports = {
  eveningReflectionSchema,
  historyQuerySchema,
  searchQuerySchema,
  exportPDFQuerySchema,
};
```

**Update `src/routes/reflect.routes.js` to use validators:**
```javascript
const { validate } = require('../middlewares/validate.mid');
const {
  eveningReflectionSchema,
  historyQuerySchema,
  searchQuerySchema,
  exportPDFQuerySchema,
} = require('../validators/reflect.validator');

router.post('/evening', requireAuth, checkAILimit, validate(eveningReflectionSchema), postEvening);
router.get('/history',  requireAuth, validate(historyQuerySchema),  getHistory);
router.get('/search',   requireAuth, validate(searchQuerySchema),   searchJournal);
router.get('/export/pdf', requireAuth, requireRole(['premium']), validate(exportPDFQuerySchema), exportPDF);
```

- **Test (Unit):** `text` < 10 chars rejected. Invalid `tags` value rejected.

---

### 🔵 TASK 73: Drift Alert Integration (Connect FCM to Alignment Engine)
- **Depends On:** Task 44 (recalc.service.js), Task 64 (FCM service)
- **Files:** `src/services/alignment/recalc.service.js` (addition only)
- **Goal:** Send drift alert push notification when score drops dangerously

**Add to `recalc.service.js` after upsert (step 11):**
```javascript
const { sendDriftAlert, sendStreakMilestone } = require('../notifications/fcm.service');
const REDIS_KEYS = require('../../config/redis-keys');

// After AlignmentMetric upsert:

// Drift alert — send if state dropped to 1 AND we haven't sent an alert in 7 days
if (result.stateLevel === 1) {
  const alerted = await redis.get(REDIS_KEYS.lastDriftAlert(userId));
  if (!alerted) {
    await sendDriftAlert(userId, result.alignmentScore);
    await redis.setex(REDIS_KEYS.lastDriftAlert(userId), 86400 * 7, '1');
  }
}

// Streak milestone — celebrate 7, 14, 30 day streaks
const milestones = [7, 14, 30, 60, 90];
if (milestones.includes(result.streakCount)) {
  await sendStreakMilestone(userId, result.streakCount);
}
```

- **Test (Unit):** State 1 → drift alert sent. Second state 1 within 7 days → alert suppressed (Redis key exists). Streak = 7 → milestone notification sent.

---

### 🟣 TASK 74: `src/services/identity/identity.service.js` (Gap — never specified)
- **Depends On:** Task 7, Task 21, Task 22, Task 24
- **Files:** `src/services/identity/identity.service.js`
- **Goal:** Business logic that identity.controller.js calls. The original plan has Task 25 (controller/routes) but never defines what goes in `identity.service.js` itself.

```javascript
// src/services/identity/identity.service.js

const IdentityProfile = require('../../models/IdentityProfile');
const { calculateRiskScores } = require('./risk.service');
const { calculateBaselineScore } = require('./baseline.util');
const { synthesizeIdentity } = require('./synthesis.service');
const redis = require('../../config/redis');
const REDIS_KEYS = require('../../config/redis-keys');
const { Errors } = require('../../utils/AppError');

const CACHE_TTL = 3600; // 1 hour

/** Get or create identity profile for user */
const getOrCreate = async (userId) => {
  // Check cache
  const cached = await redis.get(REDIS_KEYS.identityCache(userId));
  if (cached) return JSON.parse(cached);

  let profile = await IdentityProfile.findOne({ userId });
  if (!profile) {
    profile = await IdentityProfile.create({ userId });
  }

  await redis.setex(REDIS_KEYS.identityCache(userId), CACHE_TTL, JSON.stringify(profile));
  return profile;
};

/** Upsert a section of the identity profile */
const upsertSection = async (userId, section, data) => {
  const update = {};
  for (const [key, value] of Object.entries(data)) {
    update[`${section}.${key}`] = value;
  }

  const stepFlags = {
    currentIdentity: 'onboardingSteps.currentIdentityDone',
    futureIdentity:  'onboardingSteps.futureIdentityDone',
    timeConstraints: 'onboardingSteps.constraintsDone',
    riskProfile:     'onboardingSteps.riskAssessmentDone',
    priorityPillars: 'onboardingSteps.pillarsSelected',
  };

  if (stepFlags[section]) {
    update[stepFlags[section]] = true;
  }

  const profile = await IdentityProfile.findOneAndUpdate(
    { userId },
    { $set: update },
    { upsert: true, new: true }
  );

  // Invalidate cache
  await redis.del(REDIS_KEYS.identityCache(userId));
  return profile;
};

/** Process risk answers → calculate scores → save */
const processRiskAssessment = async (userId, answers) => {
  const riskScores = calculateRiskScores(answers);
  return upsertSection(userId, 'riskProfile', {
    ...riskScores,
    rawAnswers: answers,
  });
};

/** Update priority pillars */
const setPillars = async (userId, pillars) => {
  const profile = await IdentityProfile.findOneAndUpdate(
    { userId },
    { $set: { priorityPillars: pillars, 'onboardingSteps.pillarsSelected': true } },
    { upsert: true, new: true }
  );
  await redis.del(REDIS_KEYS.identityCache(userId));
  return profile;
};

/** Run AI synthesis — BLOCKING */
const synthesize = async (userId) => {
  const profile = await IdentityProfile.findOne({ userId });
  if (!profile) throw Errors.IDENTITY_NOT_FOUND();

  const requiredSteps = ['currentIdentityDone', 'futureIdentityDone', 'riskAssessmentDone', 'pillarsSelected'];
  for (const step of requiredSteps) {
    if (!profile.onboardingSteps[step]) {
      throw new Error(`Complete ${step} before synthesizing`);
    }
  }

  const synthesis = await synthesizeIdentity(profile);
  const baseline  = calculateBaselineScore({
    energyLevel:         profile.currentIdentity.energyLevel,
    executionGapSeverity: profile.currentIdentity.executionGapSeverity,
    driftProbability:     profile.riskProfile.driftProbability,
  });

  const updated = await IdentityProfile.findOneAndUpdate(
    { userId },
    {
      $set: {
        'blueprint.behavioralRiskProfile': synthesis.behavioralRiskProfile,
        'blueprint.quarterlyDirection':    synthesis.quarterlyDirection,
        'blueprint.keyInsight':            synthesis.keyInsight,
        'blueprint.synthesizedAt':         new Date(),
        'futureIdentity.declarationSentence': synthesis.suggestedDeclaration,
        baselineAlignmentScore:            baseline,
        'onboardingSteps.synthesized':     true,
      },
    },
    { new: true }
  );

  await redis.del(REDIS_KEYS.identityCache(userId));
  return { ...synthesis, baselineAlignmentScore: baseline };
};

/** Compute onboarding completion percentage */
const getOnboardingStatus = async (userId) => {
  const profile = await IdentityProfile.findOne({ userId });
  if (!profile) return { completionPct: 0, steps: {} };

  const steps = profile.onboardingSteps.toObject();
  const completed = Object.values(steps).filter(Boolean).length;
  const total = Object.keys(steps).length;

  return {
    completionPct: Math.round((completed / total) * 100),
    steps,
  };
};

module.exports = { getOrCreate, upsertSection, processRiskAssessment, setPillars, synthesize, getOnboardingStatus };
```

- **Test (Unit):** `upsertSection('currentIdentity', data)` sets `onboardingSteps.currentIdentityDone = true`. `synthesize` without prior steps throws.

---

### 🟤 TASK 75: E2E Test File Stubs (Alignment, Reflect)
- **Depends On:** Task 68, Task 61, Task 46
- **Files:** `src/tests/e2e/alignment.e2e.test.js`, `src/tests/e2e/reflect.e2e.test.js`
- **Goal:** Core E2E tests for the two most critical feature areas

```javascript
// src/tests/e2e/alignment.e2e.test.js
const request = require('supertest');
const app = require('../../../app');
const { createTestUser } = require('../helpers/auth.helper');
const { createMetricHistory } = require('../helpers/factories/metric.factory');

describe('Alignment Dashboard E2E', () => {
  let accessToken, userId;

  beforeEach(async () => {
    const { user, accessToken: token } = await createTestUser();
    accessToken = token;
    userId = user._id.toString();
  });

  test('GET /alignment/dashboard — new user returns baseline defaults', async () => {
    const res = await request(app)
      .get('/api/v1/alignment/dashboard')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stateLevel).toBe(2);
    expect(res.body.data.streakCount).toBe(0);
    expect(res.body.data.today.logged).toBe(false);
  });

  test('GET /alignment/dashboard — with metric history returns real scores', async () => {
    await createMetricHistory(userId, 7);

    const res = await request(app)
      .get('/api/v1/alignment/dashboard')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.currentScore).toBeGreaterThan(0);
  });

  test('GET /alignment/trend — returns array of metrics', async () => {
    await createMetricHistory(userId, 10);

    const res = await request(app)
      .get('/api/v1/alignment/trend')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(10);
  });

  test('GET /alignment/patterns — returns empty patterns for new user', async () => {
    const res = await request(app)
      .get('/api/v1/alignment/patterns')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.patterns)).toBe(true);
  });

  test('GET /alignment/dashboard — unauthenticated returns 401', async () => {
    const res = await request(app).get('/api/v1/alignment/dashboard');
    expect(res.status).toBe(401);
  });
});
```

```javascript
// src/tests/e2e/reflect.e2e.test.js
const request = require('supertest');
const app = require('../../../app');
const { createTestUser, createPremiumUser } = require('../helpers/auth.helper');

describe('Reflection Routes E2E', () => {
  let freeToken, premiumToken;

  beforeEach(async () => {
    const free    = await createTestUser();
    const premium = await createPremiumUser();
    freeToken    = free.accessToken;
    premiumToken = premium.accessToken;
  });

  test('POST /reflect/evening — returns 202 immediately', async () => {
    const res = await request(app)
      .post('/api/v1/reflect/evening')
      .set('Authorization', `Bearer ${freeToken}`)
      .send({ date: '2025-01-15', text: 'Today I worked on several tasks and made progress on my goals. I felt productive and focused for most of the day. Tomorrow I will continue.' });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Processing');
  });

  test('POST /reflect/evening — text < 10 chars returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/reflect/evening')
      .set('Authorization', `Bearer ${freeToken}`)
      .send({ date: '2025-01-15', text: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('GET /reflect/export/pdf — free user returns 403', async () => {
    const res = await request(app)
      .get('/api/v1/reflect/export/pdf')
      .set('Authorization', `Bearer ${freeToken}`);

    expect(res.status).toBe(403);
  });

  test('GET /reflect/history — returns paginated empty results', async () => {
    const res = await request(app)
      .get('/api/v1/reflect/history')
      .set('Authorization', `Bearer ${freeToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(0);
  });
});
```

- **Test (Self-test):** All tests in both files pass when run with `npm run test:e2e`.

---

### 🔴 TASK 76: Complete `src/routes/index.js` with All Routes Mounted
- **Depends On:** All route files
- **Files:** `src/routes/index.js`
- **Goal:** The original plan never specifies the complete `index.js` content. Without this, routes won't be mounted.

```javascript
// src/routes/index.js

const router = require('express').Router();

// ─── Route Imports ────────────────────────────────────────────────────────
const authRoutes      = require('./auth.routes');
const identityRoutes  = require('./identity.routes');
const planRoutes      = require('./plan.routes');
const execRoutes      = require('./exec.routes');
const alignmentRoutes = require('./alignment.routes');
const avatarRoutes    = require('./avatar.routes');
const reflectRoutes   = require('./reflect.routes');
const analyticsRoutes = require('./analytics.routes');
const voiceRoutes     = require('./voice.routes');
const settingsRoutes  = require('./settings.routes');
const webhookRoutes   = require('./webhook.routes');
const adminRoutes     = require('./admin.routes');

// ─── Health Check ─────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const redis    = require('../config/redis');

router.get('/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  let redisStatus = 'disconnected';
  try {
    await redis.ping();
    redisStatus = 'connected';
  } catch { /* no-op */ }

  const isHealthy = mongoStatus === 'connected' && redisStatus === 'connected';
  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    mongo:  mongoStatus,
    redis:  redisStatus,
  });
});

// ─── Route Mounting ───────────────────────────────────────────────────────
router.use('/auth',      authRoutes);
router.use('/identity',  identityRoutes);
router.use('/plan',      planRoutes);
router.use('/execute',   execRoutes);
router.use('/alignment', alignmentRoutes);
router.use('/avatar',    avatarRoutes);
router.use('/reflect',   reflectRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/voice',     voiceRoutes);
router.use('/settings',  settingsRoutes);
router.use('/webhooks',  webhookRoutes);
router.use('/admin',     adminRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code:    'ROUTE_NOT_FOUND',
  });
});

module.exports = router;
```

**`src/app.js` must mount this at `/api/v1`:**
```javascript
const apiRoutes = require('./routes/index');
app.use('/api/v1', apiRoutes);
```

- **Test (E2E):** GET /api/v1/nonexistent-route → 404 with `ROUTE_NOT_FOUND` code.

---

### 🟡 TASK 77: Complete `src/app.js` Specification
- **Depends On:** All middleware tasks
- **Files:** `src/app.js`
- **Goal:** The original plan defines middlewares and routes in separate tasks but never specifies the complete, ordered `app.js`. Order matters — a wrong middleware sequence causes security or parsing issues.

```javascript
// src/app.js — Complete, final version

'use strict';

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const pino    = require('pino-http');

const env          = require('./config/env');
const logger       = require('./utils/logger');
const apiRoutes    = require('./routes/index');
const errorHandler = require('./middlewares/error.mid');
const { globalLimiter } = require('./middlewares/rateLimit.mid');

const app = express();

// ─── 1. Security Headers (must be first) ──────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,  // API server — no CSP needed
}));

// ─── 2. CORS ──────────────────────────────────────────────────────────────
const allowedOrigins = env.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS: Origin not allowed'));
  },
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ─── 3. Request Logging (pino-http) ───────────────────────────────────────
app.use(pino({ logger }));

// ─── 4. Body Parsers ──────────────────────────────────────────────────────
// NOTE: Webhook routes need express.raw() — they are mounted BEFORE express.json()
app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }));
// All other routes get JSON parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── 5. Global Rate Limiter ───────────────────────────────────────────────
app.use(globalLimiter);

// ─── 6. Swagger UI (development only) ─────────────────────────────────────
if (env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const yaml      = require('js-yaml');
  const fs        = require('fs');
  const path      = require('path');
  const swaggerDoc = yaml.load(fs.readFileSync(path.join(__dirname, 'docs/swagger.yaml'), 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  logger.info('Swagger UI available at /api-docs');
}

// ─── 7. API Routes ────────────────────────────────────────────────────────
app.use('/api/v1', apiRoutes);

// ─── 8. Bull Board (non-production only — see Task 70) ────────────────────
// (Bull Board setup is added here in Task 70)

// ─── 9. Global Error Handler (must be LAST) ───────────────────────────────
app.use(errorHandler);

module.exports = app;
```

- **Test:** App starts without errors. Webhook route receives raw body. JSON routes receive parsed body. Error from any route reaches `errorHandler`.

---

### 🟢 TASK 78: Final Integration Validation Script
- **Depends On:** All 77 tasks
- **Files:** `src/utils/validate-setup.js`
- **Goal:** A CLI script that validates the entire backend is wired correctly before running tests. Run with `node src/utils/validate-setup.js`.

```javascript
// src/utils/validate-setup.js
// Run: node src/utils/validate-setup.js
// Checks all critical files exist and all configs parse

const fs   = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'src/app.js', 'src/server.js',
  'src/config/env.js', 'src/config/db.js', 'src/config/redis.js',
  'src/config/constants.js', 'src/config/redis-keys.js', 'src/config/avatar-states.js',
  'src/utils/AppError.js', 'src/utils/response.util.js', 'src/utils/logger.js',
  'src/utils/hash.util.js', 'src/utils/jwt.util.js', 'src/utils/date.util.js',
  'src/utils/lock.util.js', 'src/utils/constraint.util.js', 'src/utils/seed.js',
  'src/models/User.js', 'src/models/IdentityProfile.js', 'src/models/Plan.js',
  'src/models/DailyExecutionLog.js', 'src/models/AlignmentMetric.js',
  'src/models/JournalEntry.js', 'src/models/WeeklyReview.js',
  'src/middlewares/auth.mid.js', 'src/middlewares/role.mid.js',
  'src/middlewares/validate.mid.js', 'src/middlewares/rateLimit.mid.js',
  'src/middlewares/limit.tier.mid.js', 'src/middlewares/upload.mid.js',
  'src/middlewares/error.mid.js', 'src/middlewares/feature.mid.js',
  'src/routes/index.js',
  'src/services/alignment/score.service.js', 'src/services/alignment/streak.service.js',
  'src/services/alignment/drift.service.js', 'src/services/alignment/pattern.service.js',
  'src/services/alignment/recalc.service.js',
  'src/jobs/queues.js',
  'src/jobs/workers/alignment.worker.js', 'src/jobs/workers/reflection.worker.js',
  'src/jobs/workers/review.worker.js', 'src/jobs/workers/sweep.worker.js',
  'src/jobs/workers/morning.worker.js', 'src/jobs/workers/evening.worker.js',
  'src/docs/swagger.yaml',
  '.env.example', 'jest.config.js', 'docker-compose.yml', '.eslintrc.js',
];

let allGood = true;

console.log('🔍 RevUp Setup Validation\n');

// Check all required files exist
REQUIRED_FILES.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ MISSING: ${file}`);
    allGood = false;
  }
});

// Check jest.config.js has correct key
const jestConfig = fs.readFileSync(path.join(process.cwd(), 'jest.config.js'), 'utf8');
if (jestConfig.includes('setupFilesAfterFramework')) {
  console.log('\n  ❌ TYPO in jest.config.js: "setupFilesAfterFramework" should be "setupFilesAfterEnv"');
  allGood = false;
} else {
  console.log('\n  ✅ jest.config.js key is correct');
}

// Check .env.example has all required vars
const envExample = fs.readFileSync(path.join(process.cwd(), '.env.example'), 'utf8');
const requiredVars = ['MONGO_URI', 'REDIS_URL', 'JWT_ACCESS_SECRET', 'OPENAI_API_KEY', 'STRIPE_SECRET_KEY'];
requiredVars.forEach(v => {
  if (envExample.includes(v)) {
    console.log(`  ✅ .env.example has ${v}`);
  } else {
    console.log(`  ❌ .env.example missing ${v}`);
    allGood = false;
  }
});

console.log('\n' + (allGood ? '✅ All checks passed!' : '❌ Fix missing files before running tests'));
process.exit(allGood ? 0 : 1);
```

**Add to `package.json` scripts:**
```json
"validate": "node src/utils/validate-setup.js"
```

- **Acceptance:** `npm run validate` on a complete repo outputs all green checkmarks and exits with code 0.

---

## 📊 COMPLETE TASK STATUS TRACKER

| Phase | Tasks | Description |
|---|---|---|
| Phase 1 | 1–5 | Core infrastructure |
| Phase 2 | 6–12 | Database models & validation |
| Phase 3 | 13–19 | Authentication system |
| Phase 4 | 20–27 | Identity & onboarding |
| Phase 5 | 28–34 | Planning engine |
| Phase 6 | 35–39 | Execution & logging |
| Phase 7 | 40–44 | Alignment scoring brain |
| Phase 8 | 45–50 | Reflection, AI & async jobs |
| Phase 9 | 51–60 | Production readiness |
| **Phase 10** | **61–78** | **Gap-filling (this file)** |

**Total: 78 tasks. All gaps resolved.**

---

## 🔧 CORRECTIONS SUMMARY (Apply to Original Plan Before Building)

| # | File | Problem | Fix |
|---|---|---|---|
| 1 | `jest.config.js` | `setupFilesAfterFramework` is a typo | Change to `setupFilesAfterEnv` |
| 2 | `package.json` | Missing 6 packages | Add `date-fns`, `date-fns-tz`, `firebase-admin`, `js-yaml`, `razorpay`, `uuid` |
| 3 | `server.js` | Workers never started | Import all workers + call schedule functions at startup |
| 4 | `server.js` | SIGTERM handler missing workers | Add `worker.close()` calls to graceful shutdown |
| 5 | `.env.test` | Not specified | Create minimal file — let `setup.js` handle most vars |
| 6 | `app.js` | Webhook body parser order wrong | Mount `/webhooks` with `express.raw()` BEFORE `express.json()` |
| 7 | All routes | `index.js` router mount never written | Write complete `index.js` (Task 76) |

---

*End of REVUP_PENDING_TASKS_SUPPLEMENT.md*  
*Gaps resolved: 16 | New tasks added: 18 (Tasks 61–78) | Critical corrections: 7*
