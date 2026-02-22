'use strict';

const mongoose = require('mongoose');

const completedTaskSchema = new mongoose.Schema({
  taskId:      { type: String },
  taskName:    { type: String, required: true },
  weight:      { type: Number, default: 1 },
  isCore:      { type: Boolean, default: false },
  isHabit:     { type: Boolean, default: false },
  completed:   { type: Boolean, default: false },
  effortScore: { type: Number, min: 0, max: 10, default: 0 },
  completedAt: { type: Date, default: null },
}, { _id: true });

const dailyExecutionLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'userId is required'],
  },
  // UTC midnight of the user's local day
  date: {
    type: Date,
    required: [true, 'date is required'],
  },
  tasks:              { type: [completedTaskSchema], default: [] },
  identityHabitDone:  { type: Boolean, default: false },
  deepWorkMinutes:    { type: Number, default: 0 },
  intentDeclared:     { type: Boolean, default: false },
  intentDeclaredAt:   { type: Date, default: null },
  voiceCommitmentUrl: { type: String, default: null },

  // Pre-computed completion percentages (set by alignment service)
  coreCompletionPct:    { type: Number, min: 0, max: 100, default: 0 },
  supportCompletionPct: { type: Number, min: 0, max: 100, default: 0 },
  averageEffort:        { type: Number, min: 0, max: 10, default: 0 },
  isMissedDay:          { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      delete ret.__v;
      return ret;
    },
  },
});

// Unique per user per day
dailyExecutionLogSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyExecutionLogSchema.index({ userId: 1, date: -1 });
dailyExecutionLogSchema.index({ date: -1 }); // for midnight sweep job

module.exports = mongoose.model('DailyExecutionLog', dailyExecutionLogSchema);
