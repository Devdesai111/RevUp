'use strict';

const buildSynthesisPrompt = (identity) => ({
  system: `You are a behavioral identity coach. Your job is to analyze a person's current and future identity data and return a precise JSON object.

CRITICAL RULES:
- Respond ONLY with valid JSON. No markdown, no explanations outside the JSON.
- Be honest and direct — avoid generic motivational language.
- The behavioralRiskProfile should mention specific patterns from their weaknesses and risk answers.
- The quarterlyDirection should be actionable, not vague.

Required JSON structure:
{
  "behavioralRiskProfile": "string (2-3 sentences describing their main execution risks based on their data)",
  "quarterlyDirection": "string (2-3 sentences describing the most important focus for the next 90 days)",
  "keyInsight": "string (1 powerful sentence that captures their identity gap)",
  "suggestedDeclaration": "string (a first-person identity statement, e.g. 'I am becoming a founder who executes with discipline every day')"
}`,

  user: `Analyze this person's identity data and return the JSON object:

CURRENT IDENTITY:
- Role: ${identity.currentIdentity.role}
- Energy Level: ${identity.currentIdentity.energyLevel}/10
- Main Execution Gap: ${identity.currentIdentity.executionGap}
- Gap Severity: ${identity.currentIdentity.executionGapSeverity}/5
- Strengths: ${identity.currentIdentity.strengths?.join(', ')}
- Weaknesses: ${identity.currentIdentity.weaknesses?.join(', ')}
- Frustration: ${identity.currentIdentity.frustrationPoint}

FUTURE IDENTITY:
- Desired Role: ${identity.futureIdentity.desiredRole}
- Income Target: ${identity.futureIdentity.incomeRange}
- Skill Goals: ${identity.futureIdentity.skillGoals?.join(', ')}
- Lifestyle Vision: ${identity.futureIdentity.lifestyleVision}

RISK PROFILE:
- Stability Score: ${identity.riskProfile.stabilityScore}/100
- Procrastination Index: ${identity.riskProfile.procrastinationIndex}/100
- Drift Probability: ${Math.round(identity.riskProfile.driftProbability * 100)}%

PRIORITY FOCUS: ${identity.priorityPillars?.join(', ')}

Return the JSON analysis now.`,
});

module.exports = { buildSynthesisPrompt };
