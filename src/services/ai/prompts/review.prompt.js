'use strict';

// ─── Task 49: Weekly Review Summary Prompt (Section 15.4) ────────────────────

/**
 * Build the system + user prompt for weekly progress review.
 *
 * @param {{ averageScore, bestDayScore, bestDayName, worstDayScore, worstDayName, habitConsistencyPct, totalDeepWorkMins, patterns, journalSummary }} weekData
 * @param {{ identityDeclaration: string }} memory
 * @returns {{ system: string, user: string }}
 */
const buildWeeklyReviewPrompt = (weekData, memory) => ({
  system: `You generate weekly identity progress reports. Be honest, specific, and forward-looking.

Required JSON:
{
  "progressCard": "string (3-4 sentences summarizing the week — specific to their data)",
  "behavioralInsight": "string (1 key pattern observed this week)",
  "driftTrend": "improving | stable | declining",
  "recommendation": "string (1 specific action for next week)"
}`,

  user: `Weekly data for review:
Identity Declaration: "${memory.identityDeclaration}"
Week Avg Score: ${weekData.averageScore}
Best Day: ${weekData.bestDayScore} (${weekData.bestDayName})
Worst Day: ${weekData.worstDayScore} (${weekData.worstDayName})
Habit Consistency: ${weekData.habitConsistencyPct}%
Deep Work Total: ${weekData.totalDeepWorkMins} minutes
Patterns Detected: ${weekData.patterns.join(', ') || 'none'}
Journal Highlights: ${weekData.journalSummary}

Generate the weekly review JSON now.`,
});

module.exports = { buildWeeklyReviewPrompt };
