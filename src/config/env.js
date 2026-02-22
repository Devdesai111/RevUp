'use strict';

const path = require('path');
const { z } = require('zod');

// Load the correct .env file before validation
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
require('dotenv').config({ path: path.resolve(process.cwd(), envFile) });

// ─── Zod schema ──────────────────────────────────────────────────────────────

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production', 'staging']).default('development'),
  PORT: z.string().transform(Number).default('3000'),

  // Database
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  MONGO_URI_TEST: z.string().optional().default(''),
  MONGO_MAX_POOL_SIZE: z.string().transform(Number).default('100'),

  // Redis
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL').default('redis://localhost:6379'),
  REDIS_KEY_PREFIX: z.string().default('revup:'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required').default('test-key'),
  OPENAI_MODEL_SYNTHESIS: z.string().default('gpt-4o'),
  OPENAI_MODEL_REFLECTION: z.string().default('gpt-4o-mini'),
  OPENAI_MODEL_PLANNING: z.string().default('gpt-4o-mini'),
  OPENAI_MODEL_TTS: z.string().default('tts-1'),
  OPENAI_MODEL_STT: z.string().default('whisper-1'),
  OPENAI_MAX_RETRIES: z.string().transform(Number).default('3'),
  OPENAI_TIMEOUT_MS: z.string().transform(Number).default('30000'),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(''),
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_S3_BUCKET: z.string().default('revup-voice-audio'),
  AWS_S3_URL_EXPIRY: z.string().transform(Number).default('3600'),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('noreply@revup.app'),
  EMAIL_SUPPORT: z.string().default('support@revup.app'),

  // Payments
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),

  // Firebase / Push Notifications (CORRECTION C3)
  FCM_SERVER_KEY: z.string().optional().default(''),
  FCM_PROJECT_ID: z.string().optional().default(''),
  FCM_SERVICE_ACCOUNT_JSON: z.string().optional().default(''),

  // Frontend URLs (CORRECTION C3)
  FRONTEND_WEB_URL: z.string().default('http://localhost:3001'),
  FRONTEND_APP_URL: z.string().default('exp://localhost:19000'),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3001,http://localhost:3000'),

  // Rate limits
  RATE_LIMIT_GLOBAL_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_GLOBAL_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_AUTH_MAX: z.string().transform(Number).default('5'),
  RATE_LIMIT_AUTH_WINDOW_MS: z.string().transform(Number).default('600000'),
  RATE_LIMIT_AI_FREE_DAILY: z.string().transform(Number).default('3'),

  // Feature flags (CORRECTION C3)
  FEATURE_VOICE_ONBOARDING: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  FEATURE_TTS_RESPONSE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  // Monitoring (CORRECTION C3)
  BULL_BOARD_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
});

// ─── Parse & export ───────────────────────────────────────────────────────────

const result = envSchema.safeParse(process.env);

if (!result.success) {
  // Use stderr so ESLint no-console rule is satisfied for startup messages
  process.stderr.write(
    `\n[env] Invalid environment configuration:\n${result.error.toString()}\n\n`
  );
  process.exit(1);
}

module.exports = result.data;
