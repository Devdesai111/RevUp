'use strict';

// ─── Task 74: Identity Service ────────────────────────────────────────────────

const IdentityProfile  = require('../../models/IdentityProfile');
const { calcRiskProfile }    = require('./risk.service');
const { calcBaselineScore }  = require('./baseline.util');
const redis      = require('../../config/redis');
const REDIS_KEYS = require('../../config/redis-keys');
const { Errors } = require('../../utils/AppError');

const CACHE_TTL = 3600; // 1 hour

/**
 * Get or create identity profile for user.
 * @param {string} userId
 */
const getOrCreate = async (userId) => {
  const cached = await redis.get(REDIS_KEYS.identityCache(userId));
  if (cached) { return JSON.parse(cached); }

  let profile = await IdentityProfile.findOne({ userId });
  if (!profile) {
    profile = await IdentityProfile.create({ userId });
  }

  await redis.setex(REDIS_KEYS.identityCache(userId), CACHE_TTL, JSON.stringify(profile));
  return profile;
};

/**
 * Upsert a named section of the identity profile.
 * @param {string} userId
 * @param {string} section — e.g. 'currentIdentity', 'futureIdentity'
 * @param {object} data
 */
const upsertSection = async (userId, section, data) => {
  const update = {};
  for (const [key, value] of Object.entries(data)) {
    update[`${section}.${key}`] = value;
  }

  // Mark the corresponding onboarding step complete
  const stepFlags = {
    currentIdentity: 'onboardingComplete',
    futureIdentity:  'onboardingComplete',
    timeConstraints: 'onboardingComplete',
    riskProfile:     'onboardingComplete',
    priorityPillars: 'onboardingComplete',
  };

  if (stepFlags[section]) {
    update[stepFlags[section]] = true;
  }

  const profile = await IdentityProfile.findOneAndUpdate(
    { userId },
    { $set: update },
    { upsert: true, new: true },
  );

  await redis.del(REDIS_KEYS.identityCache(userId));
  return profile;
};

/**
 * Process risk assessment answers → calculate scores → save to profile.
 * @param {string} userId
 * @param {number[]} answers
 */
const processRiskAssessment = async (userId, answers) => {
  const riskScores = calcRiskProfile(answers);
  return upsertSection(userId, 'riskProfile', {
    ...riskScores,
    rawAnswers: answers,
  });
};

/**
 * Update priority pillars.
 * @param {string} userId
 * @param {string[]} pillars
 */
const setPillars = async (userId, pillars) => {
  const profile = await IdentityProfile.findOneAndUpdate(
    { userId },
    { $set: { priorityPillars: pillars } },
    { upsert: true, new: true },
  );
  await redis.del(REDIS_KEYS.identityCache(userId));
  return profile;
};

/**
 * Run AI synthesis — blocking. Requires prior onboarding steps.
 * @param {string} userId
 */
const synthesize = async (userId) => {
  const profile = await IdentityProfile.findOne({ userId });
  if (!profile) { throw Errors.notFound('Identity profile not found'); }

  const { synthesizeIdentity } = require('./synthesis.service');
  const synthesis = await synthesizeIdentity(profile);
  const baseline  = calcBaselineScore({
    energyLevel:          profile.currentIdentity?.energyLevel || 5,
    executionGapSeverity: profile.currentIdentity?.executionGapSeverity || 3,
    driftProbability:     profile.riskProfile?.driftProbability || 0.3,
  });

  const updated = await IdentityProfile.findOneAndUpdate(
    { userId },
    {
      $set: {
        'futureIdentity.declarationSentence': synthesis.suggestedDeclaration,
        baselineAlignmentScore:               baseline,
        synthesisDone:                        true,
      },
    },
    { new: true },
  );

  await redis.del(REDIS_KEYS.identityCache(userId));
  return { ...synthesis, baselineAlignmentScore: baseline, profile: updated };
};

/**
 * Compute onboarding completion percentage.
 * @param {string} userId
 */
const getOnboardingStatus = async (userId) => {
  const profile = await IdentityProfile.findOne({ userId });
  if (!profile) { return { completionPct: 0, steps: {} }; }

  const hasCurrent  = Boolean(profile.currentIdentity?.role);
  const hasFuture   = Boolean(profile.futureIdentity?.desiredRole);
  const hasRisk     = Boolean(profile.riskProfile?.stabilityScore);
  const hasPillars  = (profile.priorityPillars?.length || 0) > 0;
  const hasSynth    = Boolean(profile.synthesisDone);

  const steps = { hasCurrent, hasFuture, hasRisk, hasPillars, hasSynth };
  const completed = Object.values(steps).filter(Boolean).length;

  return {
    completionPct: Math.round((completed / Object.keys(steps).length) * 100),
    steps,
  };
};

module.exports = {
  getOrCreate,
  upsertSection,
  processRiskAssessment,
  setPillars,
  synthesize,
  getOnboardingStatus,
};
