'use strict';

jest.mock('../../services/ai/ai.orchestrator');
jest.mock('../../models/IdentityProfile');

const { callLLM } = require('../../services/ai/ai.orchestrator');
const IdentityProfile = require('../../models/IdentityProfile');

const VALID_AI_RESPONSE = {
  behavioralRiskProfile: 'High procrastination risk based on avoidance patterns.',
  quarterlyDirection:    'Focus on shipping one core product in 90 days.',
  keyInsight:            'The gap between dreaming and executing is your identity.',
  suggestedDeclaration:  'I am becoming a founder who executes with discipline every day.',
};

const MOCK_PROFILE = {
  userId: 'user123',
  currentIdentity: { role: 'developer', energyLevel: 7, executionGap: 'consistency', executionGapSeverity: 3, strengths: ['focus'], weaknesses: ['consistency'] },
  futureIdentity:  { desiredRole: 'CTO', incomeRange: '$200k', skillGoals: ['leadership'], lifestyleVision: 'remote freedom' },
  riskProfile:     { stabilityScore: 60, procrastinationIndex: 40, driftProbability: 0.3 },
  priorityPillars: ['career', 'health'],
};

describe('synthesis.service', () => {
  let synthesizeIdentity;

  beforeAll(() => {
    ({ synthesizeIdentity } = require('../../services/identity/synthesis.service'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    IdentityProfile.findOneAndUpdate = jest.fn().mockResolvedValue({ ...MOCK_PROFILE, blueprint: VALID_AI_RESPONSE });
  });

  it('should return synthesis result with blueprint fields', async () => {
    callLLM.mockResolvedValue(VALID_AI_RESPONSE);

    const result = await synthesizeIdentity(MOCK_PROFILE);
    expect(result).toHaveProperty('behavioralRiskProfile');
    expect(result).toHaveProperty('quarterlyDirection');
    expect(result).toHaveProperty('keyInsight');
    expect(result).toHaveProperty('suggestedDeclaration');
  });

  it('should call findOneAndUpdate with synthesized flag and baselineAlignmentScore', async () => {
    callLLM.mockResolvedValue(VALID_AI_RESPONSE);

    await synthesizeIdentity(MOCK_PROFILE);
    expect(IdentityProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: MOCK_PROFILE.userId },
      expect.objectContaining({
        $set: expect.objectContaining({
          'onboardingSteps.synthesized': true,
          'blueprint.behavioralRiskProfile': VALID_AI_RESPONSE.behavioralRiskProfile,
        }),
      }),
      expect.any(Object),
    );
  });

  it('should throw aiUnavailable when AI response fails Zod validation', async () => {
    callLLM.mockResolvedValue({ wrong: 'shape' });

    await expect(synthesizeIdentity(MOCK_PROFILE)).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
  });
});
