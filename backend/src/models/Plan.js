'use strict';

const mongoose = require('mongoose');

// ─── Task sub-schema ──────────────────────────────────────────────────────────
const taskSchema = new mongoose.Schema({
  taskId:        { type: String },
  taskName:      { type: String, required: true },
  type:          { type: String, enum: ['core', 'supporting', 'habit', 'extra'], default: 'core' },
  weight:        { type: Number, default: 1 },
  estimatedMins: { type: Number, default: 30 },
  completed:     { type: Boolean, default: false },
  isCore:        { type: Boolean, default: false },
  isScoring:     { type: Boolean, default: true },
}, { _id: true });

// ─── Macro objective sub-schema ───────────────────────────────────────────────
const macroObjectiveSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  pillar:         { type: String, required: true },
  successMetric:  { type: String, default: '' },
  monthlyBreakdown: {
    type: [String],
    default: [],
  },
}, { _id: false });

// ─── Weekly sprint sub-schema ─────────────────────────────────────────────────
const weeklySprintSchema = new mongoose.Schema({
  weekStartDate: { type: Date, required: true },
  weekEndDate:   { type: Date, required: true },
  coreActions: {
    type: [taskSchema],
    validate: {
      validator: (arr) => arr.length <= 4, // up to 4 with adaptive level 3
      message: 'coreActions cannot exceed 4 tasks',
    },
    default: [],
  },
  supportingActions: {
    type: [taskSchema],
    validate: {
      validator: (arr) => arr.length <= 4,
      message: 'supportingActions cannot exceed 4 tasks',
    },
    default: [],
  },
  identityHabit:  { type: String, default: '' },
  extraTasks:     { type: [taskSchema], default: [] },
  adaptiveLevel:  { type: Number, min: 1, max: 5, default: 1 },
  generatedByAI:  { type: Boolean, default: false },
}, { _id: true });

// ─── Monthly plan sub-schema ──────────────────────────────────────────────────
const monthlyPlanSchema = new mongoose.Schema({
  month: { type: Date },
  objectives: {
    type: [String],
    validate: {
      validator: (arr) => arr.length <= 3,
      message: 'objectives cannot exceed 3 items',
    },
    default: [],
  },
}, { _id: false });

// ─── Root plan schema ─────────────────────────────────────────────────────────
const planSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'userId is required'],
  },
  quarterTheme:     { type: String, default: '' },
  quarterStartDate: { type: Date },
  quarterEndDate:   { type: Date },
  macroObjectives: {
    type: [macroObjectiveSchema],
    validate: {
      validator: (arr) => arr.length <= 3,
      message: 'macroObjectives cannot exceed 3 items',
    },
    default: [],
  },
  monthlyPlans:   { type: [monthlyPlanSchema], default: [] },
  weeklySprints:  { type: [weeklySprintSchema], default: [] },
  rerollCount:    { type: Number, default: 0 },
  status:         { type: String, enum: ['draft', 'active', 'archived'], default: 'active' },
  isActive:       { type: Boolean, default: true },
  archivedAt:     { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      delete ret.__v;
      return ret;
    },
  },
});

planSchema.index({ userId: 1 });
planSchema.index({ userId: 1, isActive: 1 });
planSchema.index({ 'weeklySprints.weekStartDate': -1 });

module.exports = mongoose.model('Plan', planSchema);
