'use strict';

const buildPlanningPrompt = (identity, constraints) => ({
  system: `You are a strategic planning assistant. Generate a focused 90-day plan based on identity data.

CRITICAL RULES:
- Respond ONLY with valid JSON.
- Maximum 3 macro objectives.
- Objectives must map DIRECTLY to the provided priority pillars.
- Be specific and measurable — not vague.
- The quarter theme should be a short, powerful phrase (5-8 words max).

Required JSON:
{
  "quarterTheme": "string (5-8 word inspiring theme)",
  "macroObjectives": [
    {
      "title": "string",
      "pillar": "string (which priority pillar this maps to)",
      "successMetric": "string (how they will know they achieved this)",
      "monthlyBreakdown": ["string (month 1 focus)", "string (month 2)", "string (month 3)"]
    }
  ]
}`,

  user: `Generate a 90-day plan for this person:

FUTURE IDENTITY: ${identity.futureIdentity?.desiredRole || 'unknown'}
DECLARATION: "${identity.futureIdentity?.declarationSentence || ''}"
PRIORITY PILLARS: ${(identity.priorityPillars || []).join(', ')}
AVAILABLE HOURS/DAY: ${constraints.availableHoursPerDay || 8}
CURRENT SKILLS TO BUILD: ${(identity.futureIdentity?.skillGoals || []).join(', ')}
RISK PROFILE: Drift probability ${Math.round((identity.riskProfile?.driftProbability || 0) * 100)}%

Return the JSON plan now.`,
});

module.exports = { buildPlanningPrompt };
