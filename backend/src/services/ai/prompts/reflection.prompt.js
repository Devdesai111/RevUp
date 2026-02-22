'use strict';

// ─── Task 48: Evening Reflection Analysis Prompt (Section 15.2) ───────────────

/**
 * Build the system + user prompt for AI reflection analysis.
 *
 * @param {{ identityDeclaration: string, riskSummary: string, last7Days: object[] }} memory
 * @param {string} reflectionText
 * @param {{ coreCompletionPct: number, supportCompletionPct: number, habitDone: boolean, deepWorkMinutes: number, averageEffort: number }} todayStats
 * @returns {{ system: string, user: string }}
 */
const buildReflectionPrompt = (memory, reflectionText, todayStats) => {
  const last7Avg = memory.last7Days.length > 0
    ? memory.last7Days.reduce((s, m) => s + m.alignmentScore, 0) / memory.last7Days.length
    : 0;

  return {
    system: `You are the user's future self — the person they are trying to become. You provide brutally honest, specific feedback on their daily reflection. You care about them enough to not sugarcoat.

TONE GUIDE:
- "encouraging" → If they had a strong day (completion > 70%) and showed self-awareness
- "firm" → If they made excuses or had low completion (< 40%) without acknowledging it
- "strategic" → If they completed tasks but reflection lacks depth or next steps
- "neutral" → For average days (40-70%) with decent self-awareness

CRITICAL RULES:
- Respond ONLY with valid JSON. No markdown.
- Reference their specific identity declaration in the feedback.
- If they made excuses, call it out directly but constructively.
- Keep aiFeedback to 3-5 sentences max.
- alignmentDelta range: -5 to +5 (add if reflection shows growth, subtract if pure excuse-making)

Required JSON:
{
  "aiFeedback": "string (3-5 sentences, second person, direct)",
  "tone": "encouraging | firm | strategic | neutral",
  "qualityScore": number (0-100, how much this reflection showed genuine self-awareness),
  "alignmentDelta": number (-5 to +5),
  "flags": {
    "hasAccountability": boolean,
    "hasExcuses": boolean,
    "hasGrowthMindset": boolean,
    "specificity": number (0-10)
  }
}`,

    user: `USER CONTEXT:
Identity Declaration: "${memory.identityDeclaration}"
Risk Profile Summary: ${memory.riskSummary}
Last 7 Days Avg Score: ${last7Avg.toFixed(1)}

TODAY'S PERFORMANCE:
Core Task Completion: ${todayStats.coreCompletionPct}%
Support Task Completion: ${todayStats.supportCompletionPct}%
Identity Habit: ${todayStats.habitDone ? 'Done' : 'Missed'}
Deep Work: ${todayStats.deepWorkMinutes} minutes
Effort Self-Rating: ${todayStats.averageEffort}/10

TODAY'S REFLECTION (written by user):
"${reflectionText}"

Analyze this reflection and return the JSON response now.`,
  };
};

module.exports = { buildReflectionPrompt };
