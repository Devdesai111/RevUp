# REVUP BACKEND — API ENDPOINTS REFERENCE
> All 55 endpoints across 13 route groups.
> Base URL: `/api/v1` | Auth header: `Authorization: Bearer <accessToken>`

---

## Standard Response Shapes

### Success
```json
{ "success": true, "message": "...", "data": {} }
```

### Error
```json
{ "success": false, "message": "...", "code": "ERROR_CODE", "errors": [] }
```

### Paginated
```json
{ "success": true, "data": [], "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }
```

### Accepted (202 async)
```json
{ "success": true, "message": "Processing", "data": { "jobId": "bull-job-id" } }
```

---

## Error Codes Reference

| Code | HTTP Status | When |
|------|------------|------|
| `VALIDATION_ERROR` | 400 | Invalid request body/params |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `TOKEN_EXPIRED` | 401 | Access token expired |
| `INVALID_TOKEN` | 401 | Tampered JWT |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `PREMIUM_REQUIRED` | 403 | Feature needs premium tier |
| `NOT_FOUND` | 404 | Resource not found |
| `USER_EXISTS` | 409 | Duplicate email |
| `DUPLICATE_KEY` | 409 | Mongoose duplicate key |
| `OVERCOMMIT` | 422 | Task hours exceed available time |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `AI_LIMIT_EXCEEDED` | 429 | Free tier AI quota exceeded |
| `AI_UNAVAILABLE` | 503 | OpenAI unavailable after retries |
| `INVALID_AUDIO_FORMAT` | 400 | Unsupported audio file type |
| `AUDIO_TOO_LARGE` | 400 | Audio file > 25MB |
| `INTERNAL_ERROR` | 500 | Unhandled exception |

---

## 1. Health Check

### GET /health
- **Auth:** None
- **Description:** Check if all services are running

**Response 200:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "mongo": "connected",
    "redis": "connected",
    "uptime": 3600
  }
}
```

---

## 2. Auth Routes — `/api/v1/auth`

### POST /auth/register
- **Auth:** None
- **Rate limit:** Yes (auth limiter: 5/10min per IP)

**Request body:**
```json
{ "email": "user@example.com", "password": "MinEight8!" }
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "email": "user@example.com", "subscriptionTier": "free", "timezone": "UTC" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Errors:** `VALIDATION_ERROR` (400), `USER_EXISTS` (409)

---

### POST /auth/login
- **Auth:** None
- **Rate limit:** Yes

**Request body:**
```json
{ "email": "user@example.com", "password": "MinEight8!" }
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "email": "...", "subscriptionTier": "free" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Errors:** `INVALID_CREDENTIALS` (401), `VALIDATION_ERROR` (400)

---

### POST /auth/google
- **Auth:** None

**Request body:**
```json
{ "idToken": "google-id-token-here" }
```

**Response 200:** Same as login response

---

### POST /auth/apple
- **Auth:** None

**Request body:**
```json
{ "idToken": "apple-id-token-here" }
```

**Response 200:** Same as login response

---

### GET /auth/me
- **Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "_id": "...", "email": "...", "subscriptionTier": "free",
    "timezone": "Asia/Kolkata", "notificationPreferences": { "morning": true, "evening": true, "drift": true, "streak": true },
    "isActive": true, "createdAt": "..."
  }
}
```

---

### PATCH /auth/me
- **Auth:** Required

**Request body (all fields optional):**
```json
{
  "timezone": "America/New_York",
  "notificationPreferences": { "morning": false }
}
```

**Response 200:** Updated user object

---

### POST /auth/refresh
- **Auth:** None (refresh token in body)

**Request body:**
```json
{ "refreshToken": "eyJ..." }
```

**Response 200:**
```json
{
  "success": true,
  "data": { "accessToken": "eyJ...", "refreshToken": "eyJ..." }
}
```

**Errors:** `INVALID_TOKEN` (401), `TOKEN_EXPIRED` (401)

---

### POST /auth/logout
- **Auth:** Required

**Request body:**
```json
{ "refreshToken": "eyJ..." }
```

**Response 200:** `{ "success": true, "message": "Logged out" }`

---

### POST /auth/logout-all
- **Auth:** Required

**Response 200:** `{ "success": true, "message": "All sessions invalidated" }`
> Increments `tokenVersion` — all existing access tokens become invalid immediately

---

### POST /auth/forgot
- **Auth:** None
- **Rate limit:** Yes

**Request body:**
```json
{ "email": "user@example.com" }
```

**Response 200:** Always `{ "success": true, "message": "If email exists, reset link sent" }` (never reveal existence)

---

### POST /auth/reset
- **Auth:** None

**Request body:**
```json
{ "token": "abc123...", "newPassword": "NewPass8!" }
```

**Response 200:** `{ "success": true, "message": "Password updated" }`

**Errors:** `VALIDATION_ERROR` (400 — wrong token), `NOT_FOUND` (404 — token expired/invalid)

---

### DELETE /auth/account
- **Auth:** Required

**Response 200:** `{ "success": true, "message": "Account deleted" }`
> Deletes ALL user data (GDPR). Irreversible.

---

## 3. Identity Routes — `/api/v1/identity`

### GET /identity/me
- **Auth:** Required
- **Cache:** Redis 1hr (`cache:identity:{userId}`)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "userId": "...",
    "currentIdentity": { "role": "...", "energyLevel": 6, ... },
    "futureIdentity": { "desiredRole": "...", "declarationSentence": "..." },
    "blueprint": { "behavioralRiskProfile": "...", "keyInsight": "..." },
    "riskProfile": { "stabilityScore": 65, "procrastinationIndex": 40, "driftProbability": 0.35 },
    "priorityPillars": ["career", "health", "finances"],
    "onboardingSteps": { "currentIdentityDone": true, "synthesized": true, ... },
    "baselineAlignmentScore": 58
  }
}
```

---

### GET /identity/status
- **Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "stepsComplete": 5,
    "totalSteps": 7,
    "percentComplete": 71,
    "nextStep": "synthesize",
    "steps": {
      "currentIdentityDone": true,
      "futureIdentityDone": true,
      "constraintsDone": true,
      "riskAssessmentDone": true,
      "pillarsSelected": true,
      "synthesized": false,
      "avatarCreated": false
    }
  }
}
```

---

### POST /identity/current
- **Auth:** Required

**Request body:**
```json
{
  "role": "Product Manager",
  "energyLevel": 6,
  "executionGap": "consistency",
  "executionGapSeverity": 3,
  "strengths": ["strategy", "communication"],
  "weaknesses": ["execution", "follow-through"],
  "frustrationPoint": "I start strong but lose momentum after week 2"
}
```

**Response 200:** Updated identity profile object

---

### POST /identity/future
- **Auth:** Required

**Request body:**
```json
{
  "desiredRole": "VP of Product",
  "incomeRange": "₹50L-1Cr",
  "skillGoals": ["OKR frameworks", "engineering communication"],
  "healthTarget": 8,
  "confidenceTarget": 9,
  "lifestyleVision": "Location independent, financially free by 35",
  "declarationSentence": "I am becoming a product leader who ships with discipline"
}
```

**Response 200:** Updated identity profile

---

### POST /identity/constraints
- **Auth:** Required

**Request body:**
```json
{
  "availableHoursPerDay": 4,
  "workHoursStart": "09:00",
  "workHoursEnd": "18:00",
  "sleepHours": 7,
  "focusWindowStart": "06:00",
  "focusWindowEnd": "07:30"
}
```

---

### POST /identity/risk
- **Auth:** Required

**Request body:**
```json
{
  "answers": [3, 2, 4, 1, 5, 3]
}
```
> Exactly 6 integers, each 1-5. Questions: (1) start not finish, (2) routine stability, (3) procrastination frequency, (4) habit commitment duration, (5) external derailment, (6) recovery from setback.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "stabilityScore": 65,
    "procrastinationIndex": 40,
    "driftProbability": 0.35
  }
}
```

---

### POST /identity/pillars
- **Auth:** Required

**Request body:**
```json
{ "pillars": ["career", "health", "finances"] }
```
> 2-3 items required

---

### POST /identity/synthesize
- **Auth:** Required
- **BLOCKING:** Waits for AI response (max 30s)

**Prerequisites:** All 5 onboarding steps must be completed

**Response 200:**
```json
{
  "success": true,
  "data": {
    "behavioralRiskProfile": "High procrastination tendency with fragile consistency...",
    "quarterlyDirection": "Next 90 days should focus on building one deep skill...",
    "keyInsight": "Your biggest gap is between intention and execution.",
    "suggestedDeclaration": "I am becoming a disciplined executor who finishes what I start.",
    "baselineAlignmentScore": 58
  }
}
```

**Errors:** `AI_UNAVAILABLE` (503), `VALIDATION_ERROR` if steps incomplete

---

### POST /identity/avatar-base
- **Auth:** Required

**Request body:**
```json
{
  "genderPresentation": "neutral",
  "skinTone": "#C68642",
  "clothingStyle": "professional",
  "environmentTheme": "office"
}
```

---

### PATCH /identity/declaration
- **Auth:** Required

**Request body:**
```json
{ "declaration": "I am becoming the most disciplined version of myself" }
```

---

### DELETE /identity/reset
- **Auth:** Required
- **Tier:** Premium only

**Response 200:** `{ "success": true, "message": "Identity reset. Start onboarding again." }`

---

### POST /identity/voice
- **Auth:** Required
- **Tier:** Premium only
- **Feature flag:** `FEATURE_VOICE_ONBOARDING`
- **Content-Type:** `multipart/form-data`

**Form fields:**
- `audio` (file): mp3/mp4/m4a/wav/webm, max 25MB

**Response 202:** Processing accepted

---

## 4. Plan Routes — `/api/v1/plan`

### POST /plan/quarter
- **Auth:** Required
- **Prerequisites:** IdentityProfile must be synthesized

**Request body:** `{}` (no body needed — uses identity profile)

**Response 202:**
```json
{
  "success": true,
  "message": "Quarter plan generating",
  "data": { "jobId": "..." }
}
```

---

### POST /plan/month
- **Auth:** Required

**Request body:**
```json
{ "monthNumber": 1 }
```
> 1 = first month of quarter, 2 = second, 3 = third

---

### POST /plan/sprint
- **Auth:** Required

**Request body:**
```json
{ "weekStartDate": "2025-01-13" }
```
> Automatically normalized to Monday midnight UTC

---

### GET /plan/current
- **Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "_id": "...", "quarterTheme": "Build with Discipline",
    "quarterStartDate": "...", "quarterEndDate": "...",
    "macroObjectives": ["Ship MVP", "Build consistency habit"],
    "weeklySprints": [
      {
        "weekStartDate": "...", "weekEndDate": "...",
        "coreActions": [
          { "_id": "...", "name": "Write 1000 words daily", "weight": 3, "isCore": true, "completed": false }
        ],
        "supportingActions": [...],
        "identityHabit": { "name": "30min deep work before email" }
      }
    ]
  }
}
```

---

### GET /plan/today
- **Auth:** Required
- **Timezone-aware:** Uses `req.user.timezone`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-15",
    "sprint": { "weekStartDate": "...", "weekEndDate": "..." },
    "tasks": [
      { "_id": "...", "name": "Write chapter outline", "isCore": true, "weight": 3, "estimatedMins": 90, "completed": false }
    ],
    "identityHabit": { "name": "Cold shower + 20 pushups", "isHabit": true }
  }
}
```

---

### GET /plan/history
- **Auth:** Required
- **Query params:** `page` (default: 1), `limit` (default: 20)

**Response 200:** Paginated list of archived plans

---

### GET /plan/stats
- **Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "currentSprint": {
      "totalTasks": 6, "totalHours": 8.5,
      "coreTaskCount": 3, "supportTaskCount": 2
    },
    "quarter": {
      "totalWeeks": 13, "completedWeeks": 4,
      "avgCompletionPct": 72
    }
  }
}
```

---

### PATCH /plan/sprint
- **Auth:** Required

**Request body:**
```json
{
  "sprintId": "...",
  "updates": [
    { "taskId": "...", "name": "Updated task name" }
  ]
}
```

---

### POST /plan/sprint/reroll
- **Auth:** Required
- **Limit:** Max 3 per week (Redis counter)

**Request body:**
```json
{ "sprintId": "..." }
```

**Response 202:** New sprint generating
**Errors:** `RATE_LIMIT_EXCEEDED` if > 3 rerolls this week

---

### POST /plan/sprint/extra
- **Auth:** Required

**Request body:**
```json
{
  "name": "Respond to all pending emails",
  "estimatedMins": 45
}
```

**Response 200:** Updated sprint with extra task added (weight=0, non-scoring)

---

### DELETE /plan/sprint/extra/:taskId
- **Auth:** Required

**Response 200:** Task removed from sprint

---

## 5. Execution Routes — `/api/v1/execute`

### POST /execute/intent
- **Auth:** Required

**Request body:**
```json
{
  "date": "2025-01-15",
  "commitmentText": "Today I will complete the first chapter and exercise for 30 minutes"
}
```

**Response 200:** `{ "success": true, "message": "Intent declared", "data": { "intentDeclaredAt": "..." } }`

---

### POST /execute/log
- **Auth:** Required

**Request body:**
```json
{
  "date": "2025-01-15",
  "tasks": [
    { "taskId": "mongo-id", "taskName": "Write chapter 1", "weight": 3, "isCore": true, "completed": true, "effortScore": 8 },
    { "taskId": "mongo-id", "taskName": "Read 30 pages", "weight": 1, "isCore": false, "completed": false, "effortScore": 0 }
  ],
  "habitDone": true,
  "deepWorkMinutes": 120
}
```

**Response 202:** Alignment score recalculation queued

---

### PATCH /execute/log
- **Auth:** Required

**Request body:** Same schema as POST /execute/log

**Response 202:** Log updated, recalculation queued

---

### POST /execute/timer
- **Auth:** Required

**Request body:**
```json
{ "date": "2025-01-15", "minutes": 90 }
```

**Response 200:** `{ "success": true, "data": { "deepWorkMinutes": 90 } }`

---

### POST /execute/commit-voice
- **Auth:** Required
- **Tier:** Premium only
- **Content-Type:** `multipart/form-data`

**Form fields:**
- `audio` (file): max 25MB

**Response 202:** Voice transcription processing

---

### GET /execute/today
- **Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-15",
    "intentDeclared": true,
    "tasks": [...],
    "identityHabitDone": true,
    "deepWorkMinutes": 90,
    "coreCompletionPct": 67,
    "supportCompletionPct": 50
  }
}
```

Returns `null` data if no log exists yet for today.

---

## 6. Alignment Routes — `/api/v1/alignment`

### GET /alignment/dashboard
- **Auth:** Required
- **Cache:** Redis 30min (`cache:dashboard:{userId}`)

**Response 200:**
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

New user (no metrics) returns: `{ currentScore: 50, driftIndex: 0, streakCount: 0, stateLevel: 2, sevenDayAverage: 50, patternFlags: [], today: { logged: false } }`

---

### GET /alignment/trend
- **Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "date": "2025-01-01", "alignmentScore": 65, "driftIndex": 0.02, "stateLevel": 2 },
    { "date": "2025-01-02", "alignmentScore": 71, "driftIndex": 0.09, "stateLevel": 2 }
  ]
}
```
> Returns last 30 days. Missing days are omitted (not null).

---

### GET /alignment/patterns
- **Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "patterns": [
      { "flag": "MIDWEEK_DRIFT", "description": "Your Wednesday scores consistently drop 15+ points from Monday." },
      { "flag": "EFFORT_INFLATION", "description": "You rate your effort high but task completion stays low." }
    ],
    "detectedAt": "2025-01-15T00:00:00.000Z"
  }
}
```

---

## 7. Avatar Routes — `/api/v1/avatar`

### GET /avatar/state
- **Auth:** Required
- **Cache:** Redis 30min (`cache:avatar:{userId}`)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "stateLevel": 2,
    "stateName": "Stable",
    "description": "You are maintaining alignment. Keep building.",
    "visual": {
      "posture": "neutral",
      "lighting": "warm",
      "lightingColor": "#E8C87A",
      "aura": "faint",
      "auraIntensity": 0.3,
      "auraColor": "#A0A8FF",
      "environment": "normal",
      "environmentHue": "#3A3A5E",
      "animation": "breathing",
      "breathingRate": 0.5,
      "shadowIntensity": 0.4
    },
    "tone": "neutral",
    "message": "Consistency compounds. Stay the course."
  }
}
```

---

## 8. Reflection Routes — `/api/v1/reflect`

### POST /reflect/evening
- **Auth:** Required
- **AI Limit:** Yes (free tier: 3/week)

**Request body:**
```json
{ "date": "2025-01-15", "text": "Today was hard but I pushed through. Completed my core task..." }
```
> text: min 10 chars, max 5000 chars

**Response 202:**
```json
{
  "success": true,
  "message": "Reflection received. AI analysis processing in background.",
  "data": { "jobId": "...", "entryId": "...", "baselineScore": 60, "wordCount": 87 }
}
```

---

### POST /reflect/voice
- **Auth:** Required
- **Tier:** Premium only
- **Feature flag:** `FEATURE_VOICE_ONBOARDING`
- **Content-Type:** `multipart/form-data`

**Form fields:**
- `audio` (file): max 25MB
- `date` (text): `YYYY-MM-DD`

**Response 202:** Same as evening reflection

---

### GET /reflect/history
- **Auth:** Required
- **Query params:** `page` (default: 1), `limit` (default: 20), `tags` (comma-separated filter)

**Response 200:** Paginated journal entries with AI feedback

---

### GET /reflect/search
- **Auth:** Required
- **Query params:** `q` (search text), `page`, `limit`

**Response 200:** Paginated full-text search results from `reflectionText`

---

### GET /reflect/weekly-card
- **Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "weekStartDate": "2025-01-13",
    "weekEndDate": "2025-01-19",
    "averageAlignmentScore": 68,
    "habitConsistencyPct": 71,
    "progressCard": "This week you maintained strong consistency...",
    "behavioralInsight": "Your best days correlate with morning intent declarations.",
    "driftTrend": "stable"
  }
}
```

---

### GET /reflect/audio/:journalId
- **Auth:** Required
- **Tier:** Premium only

**Response 200:**
```json
{
  "success": true,
  "data": {
    "audioUrl": "https://s3.amazonaws.com/...",
    "expiresAt": "2025-01-15T02:00:00.000Z"
  }
}
```

---

### GET /reflect/export/pdf
- **Auth:** Required
- **Tier:** Premium only
- **Query params:** `year` (default: current), `month` (default: current, 1-12)

**Response:** Binary PDF stream (`Content-Type: application/pdf`)

---

## 9. Analytics Routes — `/api/v1/analytics`

### GET /analytics/web-dashboard
- **Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "last90DayAvg": 68.4,
    "currentStreak": 8,
    "longestStreak": 14,
    "totalDeepWorkHours": 124,
    "habitCompletionRate": 73,
    "journalEntryCount": 45,
    "planProgress": {
      "quarterComplete": 31,
      "sprintsCompleted": 4,
      "sprintsTotal": 13
    }
  }
}
```

---

### GET /analytics/heatmap
- **Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "heatmap": [
      { "dayOfWeek": 0, "dayName": "Sunday",    "avgScore": 61 },
      { "dayOfWeek": 1, "dayName": "Monday",    "avgScore": 74 },
      { "dayOfWeek": 2, "dayName": "Tuesday",   "avgScore": 72 },
      { "dayOfWeek": 3, "dayName": "Wednesday", "avgScore": 58 },
      { "dayOfWeek": 4, "dayName": "Thursday",  "avgScore": 70 },
      { "dayOfWeek": 5, "dayName": "Friday",    "avgScore": 68 },
      { "dayOfWeek": 6, "dayName": "Saturday",  "avgScore": 63 }
    ]
  }
}
```

---

### GET /analytics/completion-graph
- **Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "weeks": [
      { "weekStart": "2025-01-06", "coreCompletionPct": 78, "supportCompletionPct": 60 },
      { "weekStart": "2025-01-13", "coreCompletionPct": 67, "supportCompletionPct": 50 }
    ]
  }
}
```

---

## 10. Voice Routes — `/api/v1/voice`

### POST /voice/transcribe
- **Auth:** Required
- **Content-Type:** `multipart/form-data`

**Form fields:**
- `audio` (file): mp3/mp4/m4a/wav/webm, max 25MB

**Response 200:**
```json
{
  "success": true,
  "data": {
    "transcript": "Today I completed my morning routine and worked on chapter one for ninety minutes..."
  }
}
```

**Errors:** `INVALID_AUDIO_FORMAT` (400), `AUDIO_TOO_LARGE` (400)

---

## 11. Settings Routes — `/api/v1/settings`

### PATCH /settings/notifications
- **Auth:** Required

**Request body (all optional):**
```json
{
  "morning": true,
  "evening": false,
  "drift": true,
  "streak": true
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "notificationPreferences": { "morning": true, "evening": false, "drift": true, "streak": true }
  }
}
```

---

### PATCH /settings/fcm-token
- **Auth:** Required

**Request body:**
```json
{ "token": "firebase-fcm-registration-token" }
```

**Response 200:** `{ "success": true, "message": "FCM token updated" }`

---

### GET /settings/subscription
- **Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "tier": "free",
    "isPremium": false,
    "stripeCustomerId": null
  }
}
```

---

## 12. Webhook Routes — `/api/v1/webhooks`

> **IMPORTANT:** These routes must receive `express.raw()` body (not JSON parsed).
> App.js must mount webhooks BEFORE `express.json()` middleware.

### POST /webhooks/stripe
- **Auth:** Stripe signature verification (`stripe-signature` header)
- **Body:** Raw bytes

**Handled events:**
- `customer.subscription.created` → set User.subscriptionTier = 'premium'
- `customer.subscription.updated` → update tier accordingly
- `customer.subscription.deleted` → set User.subscriptionTier = 'free'

**Response:** Always `{ "received": true }` (200)

---

### POST /webhooks/razorpay
- **Auth:** Razorpay HMAC-SHA256 signature
- **Body:** Raw bytes

**Handled events:**
- `payment.captured` → upgrade User to premium

**Response:** `{ "received": true }` (200)

---

## 13. Admin Routes — `/api/v1/admin`

> All routes require `requireAuth + requireAdmin`. Non-admins get 403.

### POST /admin/calibrate/:userId
- **Auth:** Admin only

**Response 202:**
```json
{
  "success": true,
  "data": { "message": "Recalculation queued", "userId": "..." }
}
```

---

### GET /admin/users
- **Auth:** Admin only
- **Query params:** `page`, `limit`, `tier` (filter by free/premium)

**Response 200:** Paginated user list

---

### GET /admin/metrics
- **Auth:** Admin only

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalActiveUsers": 1500,
    "premiumUsers": 250,
    "totalAlignmentMetrics": 45000,
    "platformAverageScore": "63.40"
  }
}
```

---

## Rate Limits Summary

| Route Group | Limit | Window |
|-------------|-------|--------|
| All routes (global) | 100 req | 1 minute |
| /auth/register, /login, /forgot, /reset | 5 req | 10 minutes |
| Free tier AI (reflect/evening, synthesize) | 3 calls | 1 week |
| Sprint reroll | 3 rerolls | 1 week |

---

## Middleware Application Order

```
POST /api/v1/webhooks/*   → express.raw() → signatureVerify → handler
All other routes          → express.json() → helmet → cors → rateLimitGlobal → [route-specific middlewares]
```

**Route-specific middleware chains:**
- Protected: `requireAuth → [validate] → [requireRole] → [requireFeature] → [limitTier] → controller`
- Premium only: `requireAuth → requireRole(['premium']) → controller`
- Admin only: `requireAuth → requireAdmin → controller`
- AI routes (free): `requireAuth → limitTier → controller`
- File upload: `requireAuth → upload.single('audio') → controller`
