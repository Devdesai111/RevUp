'use strict';

// ─── Task 78: Final Integration Validation Script ─────────────────────────────
// Run: node src/utils/validate-setup.js
// Checks all critical files exist and all configs parse correctly.

const fs   = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'src/app.js',
  'src/server.js',
  'src/config/env.js',
  'src/config/db.js',
  'src/config/redis.js',
  'src/config/constants.js',
  'src/config/redis-keys.js',
  'src/config/avatar-states.js',
  'src/config/firebase.js',
  'src/config/aws.js',
  'src/utils/AppError.js',
  'src/utils/response.util.js',
  'src/utils/logger.js',
  'src/utils/hash.util.js',
  'src/utils/jwt.util.js',
  'src/utils/date.util.js',
  'src/utils/lock.util.js',
  'src/utils/seed.js',
  'src/models/User.js',
  'src/models/IdentityProfile.js',
  'src/models/Plan.js',
  'src/models/DailyExecutionLog.js',
  'src/models/AlignmentMetric.js',
  'src/models/JournalEntry.js',
  'src/models/WeeklyReview.js',
  'src/middlewares/auth.mid.js',
  'src/middlewares/role.mid.js',
  'src/middlewares/validate.mid.js',
  'src/middlewares/rateLimit.mid.js',
  'src/middlewares/limit.tier.mid.js',
  'src/middlewares/upload.mid.js',
  'src/middlewares/error.mid.js',
  'src/middlewares/feature.mid.js',
  'src/routes/index.js',
  'src/routes/auth.routes.js',
  'src/routes/identity.routes.js',
  'src/routes/plan.routes.js',
  'src/routes/exec.routes.js',
  'src/routes/alignment.routes.js',
  'src/routes/avatar.routes.js',
  'src/routes/reflect.routes.js',
  'src/routes/analytics.routes.js',
  'src/routes/voice.routes.js',
  'src/routes/settings.routes.js',
  'src/routes/webhook.routes.js',
  'src/routes/admin.routes.js',
  'src/controllers/alignment.controller.js',
  'src/controllers/settings.controller.js',
  'src/controllers/admin.controller.js',
  'src/controllers/reflect.controller.js',
  'src/services/alignment/score.service.js',
  'src/services/alignment/streak.service.js',
  'src/services/alignment/drift.service.js',
  'src/services/alignment/pattern.service.js',
  'src/services/alignment/recalc.service.js',
  'src/services/notifications/fcm.service.js',
  'src/services/analytics/dashboard.service.js',
  'src/services/analytics/pdf.service.js',
  'src/services/identity/identity.service.js',
  'src/jobs/queues.js',
  'src/jobs/workers/alignment.worker.js',
  'src/jobs/workers/reflection.worker.js',
  'src/jobs/workers/review.worker.js',
  'src/jobs/workers/sweep.worker.js',
  'src/jobs/workers/morning.worker.js',
  'src/jobs/workers/evening.worker.js',
  'src/docs/swagger.yaml',
  '.env.example',
  'jest.config.js',
  '.eslintrc.js',
  'Dockerfile',
  '.dockerignore',
];

let allGood = true;

process.stdout.write('🔍 RevUp Setup Validation\n\n');

// ── Check all required files exist ────────────────────────────────────────────
REQUIRED_FILES.forEach((file) => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    process.stdout.write(`  ✅ ${file}\n`);
  } else {
    process.stdout.write(`  ❌ MISSING: ${file}\n`);
    allGood = false;
  }
});

// ── Check jest.config.js for typo ────────────────────────────────────────────
const jestConfigPath = path.join(process.cwd(), 'jest.config.js');
if (fs.existsSync(jestConfigPath)) {
  const jestConfig = fs.readFileSync(jestConfigPath, 'utf8');
  if (/^\s*setupFilesAfterFramework\s*:/m.test(jestConfig)) {
    process.stdout.write('\n  ❌ TYPO in jest.config.js: "setupFilesAfterFramework" should be "setupFilesAfterEnv"\n');
    allGood = false;
  } else {
    process.stdout.write('\n  ✅ jest.config.js key is correct\n');
  }
}

// ── Check .env.example has required vars ──────────────────────────────────────
const envExamplePath = path.join(process.cwd(), '.env.example');
if (fs.existsSync(envExamplePath)) {
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  const requiredVars = [
    'MONGO_URI',
    'REDIS_URL',
    'JWT_ACCESS_SECRET',
    'OPENAI_API_KEY',
    'STRIPE_SECRET_KEY',
  ];
  requiredVars.forEach((v) => {
    if (envExample.includes(v)) {
      process.stdout.write(`  ✅ .env.example has ${v}\n`);
    } else {
      process.stdout.write(`  ❌ .env.example missing ${v}\n`);
      allGood = false;
    }
  });
}

// ── Check swagger.yaml is valid YAML ──────────────────────────────────────────
const swaggerPath = path.join(process.cwd(), 'src/docs/swagger.yaml');
if (fs.existsSync(swaggerPath)) {
  try {
    const yaml = require('js-yaml');
    const doc  = yaml.load(fs.readFileSync(swaggerPath, 'utf8'));
    if (doc && doc.openapi) {
      process.stdout.write(`  ✅ swagger.yaml is valid OpenAPI ${doc.openapi}\n`);
    } else {
      process.stdout.write('  ❌ swagger.yaml missing openapi field\n');
      allGood = false;
    }
  } catch (e) {
    process.stdout.write(`  ❌ swagger.yaml parse error: ${e.message}\n`);
    allGood = false;
  }
}

process.stdout.write('\n' + (allGood
  ? '✅ All checks passed! Ready to run tests.\n'
  : '❌ Fix missing files/configs before running tests.\n'));

process.exit(allGood ? 0 : 1);
