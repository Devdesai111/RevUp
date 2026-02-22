'use strict';

const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  description:   String,
  weight:        { type: Number, default: 1 },
  estimatedMins: { type: Number, default: 30 },
  completed:     { type: Boolean, default: false },
  isCore:        { type: Boolean, default: false },
  isHabit:       { type: Boolean, default: false },
}, { _id: true });

const weeklySprintSchema = new mongoose.Schema({
  weekStartDate: { type: Date, required: true },
  weekEndDate:   { type: Date, required: true },
  coreActions: {
    type: [taskSchema],
    validate: {
      validator: (arr) => arr.length <= 3,
      message: 'coreActions cannot exceed 3 tasks',
    },
    default: [],
  },
  supportingActions: {
    type: [taskSchema],
    validate: {
      validator: (arr) => arr.length <= 2,
      message: 'supportingActions cannot exceed 2 tasks',
    },
    default: [],
  },
  identityHabit:  { type: taskSchema, default: null },
  extraTasks:     { type: [taskSchema], default: [] },
  rerollCount: {
    type: Number,
    default: 0,
    max: [3, 'rerollCount cannot exceed 3'],
  },
  generatedByAI:  { type: Boolean, default: false },
  adaptiveLevel:  { type: Number, min: 1, max: 5, default: 1 },
}, { _id: true });

const monthlyPlanSchema = new mongoose.Schema({
  month:            { type: Number, min: 1, max: 12 },
  objectives: {
    type: [String],
    validate: {
      validator: (arr) => arr.length <= 3,
      message: 'objectives cannot exceed 3 items',
    },
    default: [],
  },
  measurableTargets: [String],
}, { _id: false });

const planSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'userId is required'],
  },
  quarterTheme:      String,
  quarterStartDate:  Date,
  quarterEndDate:    Date,
  macroObjectives: {
    type: [String],
    validate: {
      validator: (arr) => arr.length <= 3,
      message: 'macroObjectives cannot exceed 3 items',
    },
    default: [],
  },
  successMetrics:  { type: [String], default: [] },
  monthlyPlans:    { type: [monthlyPlanSchema], default: [] },
  weeklySprints:   { type: [weeklySprintSchema], default: [] },
  isActive:        { type: Boolean, default: true },
  archivedAt:      { type: Date, default: null },
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
