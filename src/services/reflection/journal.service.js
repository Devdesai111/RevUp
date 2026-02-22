'use strict';

// ─── Task 45: Journal CRUD Service ───────────────────────────────────────────

const JournalEntry               = require('../../models/JournalEntry');
const { calculateBaselineQuality } = require('./quality.service');
const { toLocalMidnightUTC }     = require('../../utils/date.util');

/**
 * Create or upsert a journal entry for the given date.
 * Calculates a baseline quality score from the text immediately.
 * Sets processingStatus to 'pending' — AI processing happens asynchronously.
 *
 * @param {string} userId
 * @param {string} dateStr  - YYYY-MM-DD local date string
 * @param {string} text     - Reflection text
 * @param {string} mode     - 'text' | 'voice'
 * @param {string} timezone - IANA timezone (e.g., 'Asia/Kolkata')
 * @returns {Promise<JournalEntry>}
 */
const createEntry = async (userId, dateStr, text, mode = 'text', timezone = 'UTC') => {
  const utcDate = toLocalMidnightUTC(dateStr, timezone);
  const { baselineScore, wordCount } = calculateBaselineQuality(text, new Date());

  return JournalEntry.findOneAndUpdate(
    { userId, date: utcDate },
    {
      $set: {
        reflectionText:         text,
        inputMode:              mode,
        wordCount,
        baselineScore,
        reflectionQualityScore: baselineScore,
        processingStatus:       'pending',
      },
    },
    { upsert: true, new: true, runValidators: true },
  );
};

/**
 * Paginated history of journal entries for a user.
 * Optional tag filter (any of the provided tags).
 *
 * @param {string} userId
 * @param {{ page?: number, limit?: number, tags?: string[] }} options
 * @returns {Promise<{ entries, total, page, limit, totalPages }>}
 */
const getHistory = async (userId, { page = 1, limit = 10, tags } = {}) => {
  const query = { userId };
  if (tags && tags.length > 0) {query.tags = { $in: tags };}

  const skip = (page - 1) * limit;
  const [entries, total] = await Promise.all([
    JournalEntry.find(query).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    JournalEntry.countDocuments(query),
  ]);

  return {
    entries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Full-text search across reflectionText for a user.
 *
 * @param {string} userId
 * @param {string} searchQuery
 * @returns {Promise<JournalEntry[]>}
 */
const search = async (userId, searchQuery) =>
  JournalEntry.find(
    { userId, $text: { $search: searchQuery } },
    { score: { $meta: 'textScore' } },
  )
    .sort({ score: { $meta: 'textScore' } })
    .lean();

module.exports = { createEntry, getHistory, search };
