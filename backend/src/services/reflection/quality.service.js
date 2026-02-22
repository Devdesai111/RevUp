'use strict';

// ─── Task 45: Reflection Quality Scoring ─────────────────────────────────────
// Section 13 of REVUP_BACKEND_MASTER_PLAN.md
// Pure deterministic math — zero AI/LLM calls.

/**
 * Calculate baseline reflection quality score BEFORE AI processing.
 * AI will receive this baseline and adjust it up or down by up to ±20 points.
 *
 * Baseline bands (by word count):
 *   < 50 words   → 20  (too brief)
 *   50-99 words  → 40  (minimal effort)
 *   100-199 words→ 60  (decent reflection)
 *   200-299 words→ 75  (good reflection)
 *   ≥ 300 words  → 85  (thorough reflection)
 *
 * Time bonus: +5 if submitted before 10PM (hour < 22) local time.
 *
 * @param {string} text
 * @param {Date}   submittedAt
 * @returns {{ baselineScore: number, wordCount: number }}
 */
const calculateBaselineQuality = (text, submittedAt = new Date()) => {
  const words     = text.trim().split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  let baselineScore;
  if      (wordCount < 50)  {baselineScore = 20;}
  else if (wordCount < 100) {baselineScore = 40;}
  else if (wordCount < 200) {baselineScore = 60;}
  else if (wordCount < 300) {baselineScore = 75;}
  else                      {baselineScore = 85;}

  // Time bonus: +5 if submitted before 10PM local time
  const hour = new Date(submittedAt).getHours();
  if (hour < 22) {baselineScore = Math.min(95, baselineScore + 5);}

  return {
    baselineScore: Math.min(100, Math.max(0, baselineScore)),
    wordCount,
  };
};

/**
 * Clamp an AI-provided quality score to within ±20 of the baseline.
 * Prevents AI hallucinating extreme scores that contradict word-count evidence.
 *
 * @param {number} aiScore
 * @param {number} baselineScore
 * @returns {number}
 */
const validateAIQualityScore = (aiScore, baselineScore) => {
  const min = Math.max(0,   baselineScore - 20);
  const max = Math.min(100, baselineScore + 20);
  return Math.min(max, Math.max(min, aiScore));
};

module.exports = { calculateBaselineQuality, validateAIQualityScore };
