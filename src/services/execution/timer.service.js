'use strict';

const DailyExecutionLog = require('../../models/DailyExecutionLog');
const { Errors }        = require('../../utils/AppError');

// ─── incrementTimer ───────────────────────────────────────────────────────────
/**
 * Add minutes to the deepWorkMinutes counter for a given day.
 * Requires the log to already exist (declared via POST /exec/intent or /exec/log).
 *
 * @param {string}  userId
 * @param {Date}    date
 * @param {number}  minutes
 * @returns {Promise<Document>}
 */
const incrementTimer = async (userId, date, minutes) => {
  const result = await DailyExecutionLog.findOneAndUpdate(
    { userId, date },
    { $inc: { deepWorkMinutes: minutes } },
    { new: true },
  );

  if (!result) {
    throw Errors.notFound('Execution log not found for this date. Declare intent first.');
  }

  return result;
};

module.exports = { incrementTimer };
