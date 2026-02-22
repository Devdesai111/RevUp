'use strict';

const IdentityProfile = require('../models/IdentityProfile');
const { calcRiskProfile } = require('../services/identity/risk.service');
const { synthesizeIdentity } = require('../services/identity/synthesis.service');
const redis = require('../config/redis');
const REDIS_KEYS = require('../config/redis-keys');
const { sendSuccess } = require('../utils/response.util');
const { Errors } = require('../utils/AppError');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const upsertProfile = (userId, setFields) =>
  IdentityProfile.findOneAndUpdate(
    { userId },
    { $set: setFields },
    { upsert: true, new: true },
  );

const invalidateCache = (userId) => redis.del(REDIS_KEYS.identityCache(userId));

const computeCompletionPct = (steps) => {
  const flags = [
    steps.currentIdentityDone,
    steps.futureIdentityDone,
    steps.constraintsDone,
    steps.riskAssessmentDone,
    steps.pillarsSelected,
    steps.synthesized,
    steps.avatarCreated,
  ];
  const done = flags.filter(Boolean).length;
  return Math.round((done / flags.length) * 100);
};

// ─── Controllers ──────────────────────────────────────────────────────────────

exports.getMe = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const cacheKey = REDIS_KEYS.identityCache(userId);

    const cached = await redis.get(cacheKey);
    if (cached) {
      return sendSuccess(res, { data: JSON.parse(cached) });
    }

    const profile = await IdentityProfile.findOneAndUpdate(
      { userId },
      {},
      { upsert: true, new: true },
    );

    await redis.set(cacheKey, JSON.stringify(profile), 'EX', 3600);
    return sendSuccess(res, { data: profile });
  } catch (err) {
    return next(err);
  }
};

exports.getStatus = async (req, res, next) => {
  try {
    const profile = await IdentityProfile.findOneAndUpdate(
      { userId: req.user._id },
      {},
      { upsert: true, new: true },
    );
    const completionPct = computeCompletionPct(profile.onboardingSteps);
    return sendSuccess(res, { data: { completionPct, onboardingSteps: profile.onboardingSteps } });
  } catch (err) {
    return next(err);
  }
};

exports.saveCurrentIdentity = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const fields = {};
    for (const [k, v] of Object.entries(req.body)) {
      fields[`currentIdentity.${k}`] = v;
    }
    fields['onboardingSteps.currentIdentityDone'] = true;

    const profile = await upsertProfile(userId, fields);
    await invalidateCache(userId);
    return sendSuccess(res, { message: 'Current identity saved', data: profile });
  } catch (err) {
    return next(err);
  }
};

exports.saveFutureIdentity = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const fields = {};
    for (const [k, v] of Object.entries(req.body)) {
      fields[`futureIdentity.${k}`] = v;
    }
    fields['onboardingSteps.futureIdentityDone'] = true;

    const profile = await upsertProfile(userId, fields);
    await invalidateCache(userId);
    return sendSuccess(res, { message: 'Future identity saved', data: profile });
  } catch (err) {
    return next(err);
  }
};

exports.saveConstraints = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const fields = {};
    for (const [k, v] of Object.entries(req.body)) {
      fields[`timeConstraints.${k}`] = v;
    }
    fields['onboardingSteps.constraintsDone'] = true;

    const profile = await upsertProfile(userId, fields);
    await invalidateCache(userId);
    return sendSuccess(res, { message: 'Constraints saved', data: profile });
  } catch (err) {
    return next(err);
  }
};

exports.saveRisk = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const riskProfile = calcRiskProfile(req.body.answers);

    const profile = await upsertProfile(userId, {
      riskProfile,
      'onboardingSteps.riskAssessmentDone': true,
    });
    await invalidateCache(userId);
    return sendSuccess(res, { message: 'Risk profile computed', data: profile });
  } catch (err) {
    return next(err);
  }
};

exports.savePillars = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const profile = await upsertProfile(userId, {
      priorityPillars: req.body.pillars,
      'onboardingSteps.pillarsSelected': true,
    });
    await invalidateCache(userId);
    return sendSuccess(res, { message: 'Pillars saved', data: profile });
  } catch (err) {
    return next(err);
  }
};

exports.synthesize = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const profile = await IdentityProfile.findOne({ userId });
    if (!profile) {
      return next(Errors.identityNotFound());
    }

    const synthesis = await synthesizeIdentity(profile);

    // Re-fetch to get updated baselineAlignmentScore
    const updated = await IdentityProfile.findOne({ userId });

    await invalidateCache(userId);
    return sendSuccess(res, {
      message: 'Identity synthesized',
      data: {
        ...synthesis,
        baselineAlignmentScore: updated?.baselineAlignmentScore ?? 0,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.saveAvatarBase = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const fields = {};
    for (const [k, v] of Object.entries(req.body)) {
      fields[`avatarPreferences.${k}`] = v;
    }
    fields['onboardingSteps.avatarCreated'] = true;

    const profile = await upsertProfile(userId, fields);
    await invalidateCache(userId);
    return sendSuccess(res, { message: 'Avatar preferences saved', data: profile });
  } catch (err) {
    return next(err);
  }
};

exports.updateDeclaration = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const profile = await upsertProfile(userId, {
      'futureIdentity.declarationSentence': req.body.declaration,
    });
    await invalidateCache(userId);
    return sendSuccess(res, { message: 'Declaration updated', data: profile });
  } catch (err) {
    return next(err);
  }
};

exports.resetIdentity = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await IdentityProfile.findOneAndDelete({ userId });
    await invalidateCache(userId);
    return sendSuccess(res, { message: 'Identity profile reset' });
  } catch (err) {
    return next(err);
  }
};
