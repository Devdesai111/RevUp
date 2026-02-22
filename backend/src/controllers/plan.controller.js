'use strict';

const Plan = require('../models/Plan');
const IdentityProfile = require('../models/IdentityProfile');
const { generateQuarterPlan } = require('../services/planning/quarter.service');
const { generateMonthPlan } = require('../services/planning/month.service');
const { generateSprint } = require('../services/planning/sprint.service');
const { getWeekBounds, getISOWeekKey } = require('../utils/date.util');
const redis = require('../config/redis');
const REDIS_KEYS = require('../config/redis-keys');
const { sendSuccess, sendPaginated } = require('../utils/response.util');
const { Errors } = require('../utils/AppError');
const { PLAN_LIMITS } = require('../config/constants');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const invalidatePlanCache = async (userId) => {
  const weekKey = getISOWeekKey(new Date());
  await redis.del(REDIS_KEYS.planCache(userId, weekKey));
};

// ─── Controllers ──────────────────────────────────────────────────────────────

exports.generateQuarter = async (req, res, next) => {
  try {
    const plan = await generateQuarterPlan(req.user._id);
    return sendSuccess(res, { message: 'Quarter plan generated', data: plan });
  } catch (err) {
    return next(err);
  }
};

exports.generateMonth = async (req, res, next) => {
  try {
    const plan = await generateMonthPlan(req.user._id);
    return sendSuccess(res, { message: 'Month plan generated', data: plan });
  } catch (err) {
    return next(err);
  }
};

exports.generateSprint = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const identity = await IdentityProfile.findOne({ userId }).lean();
    const timezone = req.user.timezone || 'UTC';
    const availableHoursPerDay = identity?.timeConstraints?.availableHoursPerDay ?? 8;

    const plan = await generateSprint({ userId, identity, availableHoursPerDay, timezone });
    await invalidatePlanCache(userId, timezone);
    return sendSuccess(res, { message: 'Sprint generated', data: plan });
  } catch (err) {
    return next(err);
  }
};

exports.getCurrentPlan = async (req, res, next) => {
  try {
    const plan = await Plan.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    if (!plan) { return next(Errors.planNotFound()); }
    return sendSuccess(res, { data: plan });
  } catch (err) {
    return next(err);
  }
};

exports.getTodayTasks = async (req, res, next) => {
  try {
    const plan = await Plan.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    if (!plan) { return next(Errors.planNotFound()); }

    const now = new Date();
    const activeSprint = (plan.weeklySprints || []).find(
      (s) => new Date(s.weekStartDate) <= now && new Date(s.weekEndDate) >= now,
    );

    const tasks = activeSprint
      ? [...(activeSprint.coreActions || []), ...(activeSprint.supportingActions || [])]
      : [];

    return sendSuccess(res, { data: { tasks, sprint: activeSprint || null } });
  } catch (err) {
    return next(err);
  }
};

exports.getPlanHistory = async (req, res, next) => {
  try {
    const page  = Number(req.query.page  || 1);
    const limit = Number(req.query.limit || 10);
    const skip  = (page - 1) * limit;

    const [plans, total] = await Promise.all([
      Plan.find({ userId: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Plan.countDocuments({ userId: req.user._id }),
    ]);

    return sendPaginated(res, plans, { page, limit, total });
  } catch (err) {
    return next(err);
  }
};

exports.getPlanStats = async (req, res, next) => {
  try {
    const plan = await Plan.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    if (!plan) { return next(Errors.planNotFound()); }

    const { startUTC, endUTC } = getWeekBounds(req.user.timezone || 'UTC');
    const sprint = (plan.weeklySprints || []).find(
      (s) => new Date(s.weekStartDate) >= startUTC && new Date(s.weekStartDate) <= endUTC,
    );

    const coreActions       = sprint?.coreActions || [];
    const supportingActions = sprint?.supportingActions || [];
    const allTasks          = [...coreActions, ...supportingActions];
    const estimatedWeeklyHours = allTasks.reduce((s, t) => s + (t.estimatedMins || 0), 0) / 60;

    return sendSuccess(res, {
      data: {
        totalCoreTasks:      coreActions.length,
        totalSupportTasks:   supportingActions.length,
        estimatedWeeklyHours: Math.round(estimatedWeeklyHours * 10) / 10,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.editSprint = async (req, res, next) => {
  try {
    const plan = await Plan.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    if (!plan) { return next(Errors.planNotFound()); }

    const now = new Date();
    const sprintIdx = (plan.weeklySprints || []).findIndex(
      (s) => new Date(s.weekStartDate) <= now && new Date(s.weekEndDate) >= now,
    );
    if (sprintIdx === -1) { return next(Errors.notFound('No active sprint found')); }

    req.body.tasks.forEach(({ taskId, taskName }) => {
      const allTasks = [
        ...(plan.weeklySprints[sprintIdx].coreActions || []),
        ...(plan.weeklySprints[sprintIdx].supportingActions || []),
      ];
      const task = allTasks.find((t) => t.taskId === taskId);
      if (task) { task.taskName = taskName; }
    });

    plan.markModified('weeklySprints');
    await plan.save();
    return sendSuccess(res, { message: 'Sprint updated', data: plan });
  } catch (err) {
    return next(err);
  }
};

exports.rerollSprint = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const plan   = await Plan.findOne({ userId }).sort({ createdAt: -1 });
    if (!plan) { return next(Errors.planNotFound()); }
    if ((plan.rerollCount || 0) >= PLAN_LIMITS.SPRINT_REROLLS_MAX) {
      return next(Errors.badRequest('Maximum sprint rerolls reached for this quarter'));
    }

    const identity         = await IdentityProfile.findOne({ userId }).lean();
    const availableHours   = identity?.timeConstraints?.availableHoursPerDay ?? 8;
    const timezone         = req.user.timezone || 'UTC';

    plan.rerollCount = (plan.rerollCount || 0) + 1;
    await plan.save();

    const updated = await generateSprint({ userId, identity, availableHoursPerDay: availableHours, timezone });
    await invalidatePlanCache(userId, timezone);
    return sendSuccess(res, { message: 'Sprint rerolled', data: updated });
  } catch (err) {
    return next(err);
  }
};

exports.addExtraTask = async (req, res, next) => {
  try {
    const plan = await Plan.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    if (!plan) { return next(Errors.planNotFound()); }

    const now = new Date();
    const sprint = (plan.weeklySprints || []).find(
      (s) => new Date(s.weekStartDate) <= now && new Date(s.weekEndDate) >= now,
    );
    if (!sprint) { return next(Errors.notFound('No active sprint')); }

    sprint.extraTasks = sprint.extraTasks || [];
    sprint.extraTasks.push({
      taskName:      req.body.taskName,
      estimatedMins: req.body.estimatedMins || 30,
      isScoring:     false,
    });

    plan.markModified('weeklySprints');
    await plan.save();
    return sendSuccess(res, { message: 'Extra task added', data: sprint });
  } catch (err) {
    return next(err);
  }
};

exports.removeExtraTask = async (req, res, next) => {
  try {
    const plan = await Plan.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    if (!plan) { return next(Errors.planNotFound()); }

    const now = new Date();
    const sprint = (plan.weeklySprints || []).find(
      (s) => new Date(s.weekStartDate) <= now && new Date(s.weekEndDate) >= now,
    );
    if (!sprint) { return next(Errors.notFound('No active sprint')); }

    const before = (sprint.extraTasks || []).length;
    sprint.extraTasks = (sprint.extraTasks || []).filter(
      (t) => String(t._id) !== req.params.taskId,
    );
    if (sprint.extraTasks.length === before) {
      return next(Errors.notFound('Extra task not found'));
    }

    plan.markModified('weeklySprints');
    await plan.save();
    return sendSuccess(res, { message: 'Extra task removed', data: sprint });
  } catch (err) {
    return next(err);
  }
};
