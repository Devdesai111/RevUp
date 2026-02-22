'use strict';

// ─── Task 43: Behavioral Pattern Detection ────────────────────────────────────
// Pure deterministic logic — zero AI/LLM calls.

const { PATTERNS } = require('../../config/constants');

// ─── Individual detectors ────────────────────────────────────────────────────

/**
 * MIDWEEK DRIFT: Wednesday score is ≥ 15 points lower than Monday,
 * AND this has happened in 3 of the last 4 weeks.
 *
 * @param {AlignmentMetric[]} metrics - Sorted newest-first
 * @returns {boolean}
 */
const detectMidweekDrift = (metrics) => {
  const weeklyPairs = [];

  for (let i = 0; i < metrics.length; i++) {
    const m          = metrics[i];
    const dayOfWeek  = new Date(m.date).getDay();  // 0=Sun, 1=Mon, 3=Wed

    if (dayOfWeek === 3) {  // Wednesday
      // Find the Monday within 3 days of this Wednesday
      const monday = metrics.find((x) => {
        const d       = new Date(x.date);
        const sameWeek = Math.abs(d - new Date(m.date)) < 3 * 86400000;
        return d.getDay() === 1 && sameWeek;
      });

      if (monday) {
        weeklyPairs.push({
          monScore: monday.alignmentScore,
          wedScore: m.alignmentScore,
          drop:     monday.alignmentScore - m.alignmentScore,
        });
      }
    }
    if (weeklyPairs.length >= 4) {break;}
  }

  if (weeklyPairs.length < PATTERNS.MIDWEEK_DRIFT.WEEKS_REQUIRED) {return false;}

  const drifting = weeklyPairs.filter((p) => p.drop >= PATTERNS.MIDWEEK_DRIFT.DROP_THRESHOLD);
  return drifting.length >= PATTERNS.MIDWEEK_DRIFT.WEEKS_REQUIRED;
};

/**
 * EFFORT INFLATION: User rates effort ≥ 8 but completes < 50% of core tasks,
 * in 3 of the last 7 days.
 *
 * @param {DailyExecutionLog[]} logs - Sorted newest-first
 * @returns {boolean}
 */
const detectEffortInflation = (logs) => {
  const last7    = logs.slice(0, 7);
  const inflated = last7.filter(
    (log) =>
      log.averageEffort      >= PATTERNS.EFFORT_INFLATION.EFFORT_MIN &&
      log.coreCompletionPct  <  PATTERNS.EFFORT_INFLATION.COMPLETION_MAX,
  );
  return inflated.length >= PATTERNS.EFFORT_INFLATION.DAYS_REQUIRED;
};

/**
 * OVERCOMMITMENT: Core task completion < 40% for 5 of the last 7 days.
 *
 * @param {DailyExecutionLog[]} logs - Sorted newest-first
 * @returns {boolean}
 */
const detectOvercommitment = (logs) => {
  const last7 = logs.slice(0, 7);
  const low   = last7.filter((log) => log.coreCompletionPct < PATTERNS.OVERCOMMIT.COMPLETION_MAX);
  return low.length >= PATTERNS.OVERCOMMIT.DAYS_REQUIRED;
};

/**
 * STREAK BREAK: Streak dropped from > 7 to 0 within the last recorded metrics.
 *
 * @param {AlignmentMetric[]} metrics - Sorted newest-first
 * @returns {boolean}
 */
const detectStreakBreak = (metrics) => {
  const last3 = metrics.slice(0, 3);
  if (last3.length < 2) {return false;}
  return last3[0].streakCount === 0 && last3[1].streakCount > 7;
};

// ─── Main entry point ────────────────────────────────────────────────────────

/**
 * Run all pattern detectors. Returns array of active pattern flag strings.
 *
 * @param {AlignmentMetric[]}    last30Days - Metrics sorted newest-first
 * @param {DailyExecutionLog[]}  last30Logs - Logs sorted newest-first
 * @returns {string[]} patternFlags
 */
const detectPatterns = (last30Days, last30Logs) => {
  if (!last30Days.length && !last30Logs.length) {return [];}

  const flags = [];

  if (detectMidweekDrift(last30Days))    {flags.push(PATTERNS.MIDWEEK_DRIFT.KEY);}
  if (detectEffortInflation(last30Logs)) {flags.push(PATTERNS.EFFORT_INFLATION.KEY);}
  if (detectOvercommitment(last30Logs))  {flags.push(PATTERNS.OVERCOMMIT.KEY);}
  if (detectStreakBreak(last30Days))     {flags.push(PATTERNS.STREAK_BREAK.KEY);}

  return flags;
};

module.exports = {
  detectPatterns,
  detectMidweekDrift,
  detectEffortInflation,
  detectOvercommitment,
  detectStreakBreak,
};
