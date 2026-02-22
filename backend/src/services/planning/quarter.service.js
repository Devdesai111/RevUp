'use strict';

const { z } = require('zod');
const Plan = require('../../models/Plan');
const IdentityProfile = require('../../models/IdentityProfile');
const { callLLM } = require('../ai/ai.orchestrator');
const { buildPlanningPrompt } = require('../ai/prompts/planning.prompt');
const env = require('../../config/env');
const logger = require('../../utils/logger');
const { Errors } = require('../../utils/AppError');

const macroObjectiveSchema = z.object({
  title:          z.string(),
  pillar:         z.string(),
  successMetric:  z.string(),
  monthlyBreakdown: z.array(z.string()).length(3),
});

const quarterResponseSchema = z.object({
  quarterTheme:     z.string(),
  macroObjectives:  z.array(macroObjectiveSchema).min(1).max(3),
});

/**
 * generateQuarterPlan — AI-driven 90-day plan saved to DB.
 * @param {string|ObjectId} userId
 * @returns {object} Saved Plan document
 */
const generateQuarterPlan = async (userId) => {
  const identity = await IdentityProfile.findOne({ userId }).lean();
  if (!identity) { throw Errors.identityNotFound(); }
  if (!identity.onboardingSteps?.synthesized) {
    throw Errors.badRequest('Identity must be synthesized before generating a quarter plan');
  }

  const constraints = {
    availableHoursPerDay: identity.timeConstraints?.availableHoursPerDay ?? 8,
  };

  const prompt = buildPlanningPrompt(identity, constraints);
  const raw = await callLLM({
    model:        env.OPENAI_MODEL_PLANNING,
    systemPrompt: prompt.system,
    userPrompt:   prompt.user,
    maxTokens:    1500,
  });

  const parsed = quarterResponseSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.issues }, 'Quarter AI response invalid');
    throw Errors.aiUnavailable('AI returned invalid quarter plan structure');
  }

  // Validate all pillars map to user's priorityPillars
  const validPillars = new Set(identity.priorityPillars || []);
  const hallucinated = parsed.data.macroObjectives.filter(
    (obj) => validPillars.size > 0 && !validPillars.has(obj.pillar),
  );
  if (hallucinated.length > 0) {
    logger.warn({ hallucinated: hallucinated.map((h) => h.pillar) }, 'AI hallucinated pillars');
    // Re-map to valid pillars in order
    const pillarArr = [...validPillars];
    hallucinated.forEach((obj, i) => { obj.pillar = pillarArr[i % pillarArr.length]; });
  }

  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const quarterEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const plan = await Plan.findOneAndUpdate(
    { userId },
    {
      $set: {
        userId,
        quarterTheme:      parsed.data.quarterTheme,
        macroObjectives:   parsed.data.macroObjectives,
        quarterStartDate:  now,
        quarterEndDate:    quarterEnd,
        status:            'active',
      },
    },
    { upsert: true, new: true },
  );

  logger.info({ userId, theme: plan.quarterTheme }, 'Quarter plan generated');
  return plan;
};

module.exports = { generateQuarterPlan };
