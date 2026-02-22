'use strict';

const { upsertLog }       = require('../services/execution/exec.service');
const { incrementTimer }  = require('../services/execution/timer.service');
const { enqueueAlignment } = require('../jobs/queues');
const { toLocalMidnightUTC, getLocalDayBounds } = require('../utils/date.util');
const { sendSuccess }     = require('../utils/response.util');
const DailyExecutionLog   = require('../models/DailyExecutionLog');
const logger              = require('../utils/logger');

// ─── POST /execute/intent ─────────────────────────────────────────────────────
/**
 * Declare morning intent for a specific date.
 * Creates (or upserts) an empty execution log with intentDeclared = true.
 * Idempotent — calling again on the same day is safe.
 */
const declareIntent = async (req, res, next) => {
  try {
    const { date } = req.body;
    const userId   = req.user._id;
    const timezone = req.user.timezone || 'UTC';

    const utcDate  = toLocalMidnightUTC(date, timezone);

    const log = await DailyExecutionLog.findOneAndUpdate(
      { userId, date: utcDate },
      {
        $set: {
          intentDeclared:   true,
          intentDeclaredAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    return sendSuccess(res, { message: 'Morning intent declared', data: log });
  } catch (err) {
    return next(err);
  }
};

// ─── POST /execute/log ────────────────────────────────────────────────────────
/**
 * Log task completions for a specific date.
 * Uses upsert so calling multiple times on the same day is safe.
 * Enqueues an alignment recalculation job after save.
 */
const saveLog = async (req, res, next) => {
  try {
    const { date, tasks = [], habitDone = false, deepWorkMinutes } = req.body;
    const userId   = req.user._id;
    const timezone = req.user.timezone || 'UTC';

    const utcDate = toLocalMidnightUTC(date, timezone);

    const log = await upsertLog(userId, utcDate, { tasks, habitDone, deepWorkMinutes });

    // Fire alignment job in background — non-blocking
    enqueueAlignment({
      userId: String(userId),
      date:   utcDate.toISOString(),
      trigger: 'task_complete',
    }).catch((err) => logger.error({ err }, 'enqueueAlignment failed'));

    return sendSuccess(res, { message: 'Execution log saved', data: log });
  } catch (err) {
    return next(err);
  }
};

// ─── PATCH /execute/log ───────────────────────────────────────────────────────
/**
 * Edit today's log (same as saveLog — upsert handles create + update).
 */
const editLog = async (req, res, next) => {
  try {
    const { date, tasks, habitDone, deepWorkMinutes } = req.body;
    const userId   = req.user._id;
    const timezone = req.user.timezone || 'UTC';

    const utcDate = date
      ? toLocalMidnightUTC(date, timezone)
      : getLocalDayBounds(timezone).startUTC;

    const log = await upsertLog(userId, utcDate, { tasks, habitDone, deepWorkMinutes });

    enqueueAlignment({
      userId: String(userId),
      date:   utcDate.toISOString(),
      trigger: 'task_complete',
    }).catch((err) => logger.error({ err }, 'enqueueAlignment failed'));

    return sendSuccess(res, { message: 'Execution log updated', data: log });
  } catch (err) {
    return next(err);
  }
};

// ─── POST /execute/timer ──────────────────────────────────────────────────────
/**
 * Increment deep work minutes for today.
 * Requires that the log already exists (via intent or log).
 */
const syncTimer = async (req, res, next) => {
  try {
    const { minutes } = req.body;
    const userId      = req.user._id;
    const timezone    = req.user.timezone || 'UTC';

    // Compute today's UTC midnight consistently with how saveLog stores dates
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayUTC = toLocalMidnightUTC(todayStr, timezone);

    const log = await incrementTimer(userId, todayUTC, minutes);

    return sendSuccess(res, { message: 'Timer updated', data: log });
  } catch (err) {
    return next(err);
  }
};

// ─── POST /execute/commit-voice ───────────────────────────────────────────────
/**
 * Upload a voice commitment recording (premium only).
 * File is processed via upload.mid.js multer middleware before this handler.
 */
const commitVoice = async (req, res, next) => {
  try {
    const { sttService } = require('../services/voice/stt.service');
    const { date }       = req.body;
    const userId         = req.user._id;
    const timezone       = req.user.timezone || 'UTC';

    const utcDate    = date
      ? toLocalMidnightUTC(date, timezone)
      : getLocalDayBounds(timezone).startUTC;

    const transcript = await sttService.transcribe(req.file);

    const log = await DailyExecutionLog.findOneAndUpdate(
      { userId, date: utcDate },
      { $set: { voiceCommitmentUrl: transcript } },
      { upsert: true, new: true },
    );

    return sendSuccess(res, { message: 'Voice commitment saved', data: log });
  } catch (err) {
    return next(err);
  }
};

// ─── GET /execute/today ───────────────────────────────────────────────────────
/**
 * Return today's execution log, or an empty structure if not logged yet.
 */
const getToday = async (req, res, next) => {
  try {
    const userId   = req.user._id;
    const timezone = req.user.timezone || 'UTC';

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayUTC = toLocalMidnightUTC(todayStr, timezone);

    const log = await DailyExecutionLog.findOne({ userId, date: todayUTC }).lean();

    if (!log) {
      return sendSuccess(res, {
        message: 'No log for today',
        data: {
          logged:          false,
          date:            todayUTC,
          tasks:           [],
          habitDone:       false,
          deepWorkMinutes: 0,
          intentDeclared:  false,
        },
      });
    }

    return sendSuccess(res, { message: 'Today log retrieved', data: { ...log, logged: true } });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  declareIntent,
  saveLog,
  editLog,
  syncTimer,
  commitVoice,
  getToday,
};
