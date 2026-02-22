'use strict';

// ─── Task 46: Reflection Controller ──────────────────────────────────────────
// All AI processing is async — return 202 immediately.

const { sendSuccess, sendAccepted, sendPaginated } = require('../utils/response.util');
const { createEntry, getHistory, search }          = require('../services/reflection/journal.service');
const { generateMonthlyPDF }                       = require('../services/analytics/pdf.service');
const { enqueueReflection }                        = require('../jobs/queues');
const logger                                       = require('../utils/logger');

/**
 * POST /reflect/evening
 * Submit evening reflection. Saves baseline quality score immediately,
 * enqueues AI processing in the background.
 */
const eveningReflection = async (req, res, next) => {
  try {
    const userId   = req.user._id.toString();
    const timezone = req.user.timezone || 'UTC';
    const { date, text, mode = 'text' } = req.body;

    const entry = await createEntry(userId, date, text, mode, timezone);

    await enqueueReflection({
      journalEntryId: entry._id.toString(),
      userId,
      date,
    });

    logger.info({ userId, date, entryId: entry._id }, 'Reflection submitted, queued for AI');

    return sendAccepted(res, {
      message: 'Reflection received. AI feedback coming shortly.',
      jobId:   entry._id.toString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /reflect/history
 * Paginated list of journal entries for the authenticated user.
 */
const getReflectionHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page   = Number(req.query.page  || 1);
    const limit  = Number(req.query.limit || 10);
    const tags   = req.query.tags ? req.query.tags.split(',').filter(Boolean) : undefined;

    const result = await getHistory(userId, { page, limit, tags });

    return sendPaginated(res, {
      data:       result.entries,
      pagination: {
        page:       result.page,
        limit:      result.limit,
        total:      result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /reflect/search?q=<query>
 * Full-text search on reflection entries.
 */
const searchReflections = async (req, res, next) => {
  try {
    const userId  = req.user._id;
    const { q }   = req.query;
    const results = await search(userId, q);
    return sendSuccess(res, { message: 'Search results', data: results });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /reflect/export/pdf?year=2025&month=1
 * Stream a monthly PDF report (premium only).
 */
const exportPDF = async (req, res, next) => {
  try {
    const year  = parseInt(req.query.year,  10) || new Date().getFullYear();
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
    await generateMonthlyPDF(req.user._id.toString(), year, month, res);
  } catch (err) {
    next(err);
  }
};

module.exports = { eveningReflection, getReflectionHistory, searchReflections, exportPDF };
