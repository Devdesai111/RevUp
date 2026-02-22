'use strict';

const { z } = require('zod');
const { callLLM } = require('../ai/ai.orchestrator');
const { buildSynthesisPrompt } = require('../ai/prompts/synthesis.prompt');
const { calcBaselineScore } = require('./baseline.util');
const IdentityProfile = require('../../models/IdentityProfile');
const env = require('../../config/env');
const logger = require('../../utils/logger');
const { Errors } = require('../../utils/AppError');

const synthesisResponseSchema = z.object({
  behavioralRiskProfile: z.string(),
  quarterlyDirection:    z.string(),
  keyInsight:            z.string(),
  suggestedDeclaration:  z.string(),
});

const callAndValidate = async (prompt) => {
  const raw = await callLLM({
    model:        env.OPENAI_MODEL_SYNTHESIS,
    systemPrompt: prompt.system,
    userPrompt:   prompt.user,
    maxTokens:    1000,
  });

  const result = synthesisResponseSchema.safeParse(raw);
  if (!result.success) {
    logger.warn({ issues: result.error.issues }, 'Synthesis response failed Zod validation');
    return null;
  }
  return result.data;
};

/**
 * synthesizeIdentity — calls AI, validates, saves blueprint + baseline to DB.
 * @param {object} identityProfile — the populated IdentityProfile document (or plain object)
 * @returns {object} The validated synthesis result
 * @throws {AppError} Errors.aiUnavailable() if AI or validation fails after retry
 */
const synthesizeIdentity = async (identityProfile) => {
  const prompt = buildSynthesisPrompt(identityProfile);

  let synthesis = await callAndValidate(prompt);

  // Retry once if Zod validation failed
  if (!synthesis) {
    synthesis = await callAndValidate(prompt);
  }

  if (!synthesis) {
    throw Errors.aiUnavailable('AI returned invalid synthesis structure after retry');
  }

  const { baselineScore } = calcBaselineScore({
    energyLevel:          identityProfile.currentIdentity.energyLevel ?? 5,
    executionGapSeverity: identityProfile.currentIdentity.executionGapSeverity ?? 0,
    driftProbability:     identityProfile.riskProfile.driftProbability ?? 0,
  });

  await IdentityProfile.findOneAndUpdate(
    { userId: identityProfile.userId },
    {
      $set: {
        'blueprint.behavioralRiskProfile': synthesis.behavioralRiskProfile,
        'blueprint.quarterlyDirection':    synthesis.quarterlyDirection,
        'blueprint.keyInsight':            synthesis.keyInsight,
        'blueprint.synthesizedAt':         new Date(),
        'onboardingSteps.synthesized':     true,
        baselineAlignmentScore:            baselineScore,
      },
    },
    { new: true, upsert: false },
  );

  logger.info({ userId: identityProfile.userId, baselineScore }, 'Identity synthesized');
  return synthesis;
};

module.exports = { synthesizeIdentity };
