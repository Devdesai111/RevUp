'use strict';

const mongoose = require('mongoose');

const weeklyReviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'userId is required'],
  },
  weekStartDate: {
    type: Date,
    required: [true, 'weekStartDate is required'],
  },
  weekEndDate: { type: Date },
  averageAlignmentScore: { type: Number, min: 0, max: 100, default: 0 },
  bestDay:               { type: Date, default: null },
  bestDayScore:          { type: Number, default: 0 },
  weakestDay:            { type: Date, default: null },
  weakestDayScore:       { type: Number, default: 0 },
  totalDeepWorkMins:     { type: Number, default: 0 },
  habitConsistencyPct:   { type: Number, min: 0, max: 100, default: 0 },
  taskCompletionPct:     { type: Number, min: 0, max: 100, default: 0 },
  progressCard:          { type: String, default: null },
  behavioralInsight:     { type: String, default: null },
  driftTrend: {
    type: String,
    enum: ['improving', 'stable', 'declining'],
    default: 'stable',
  },
  patternsSeen: { type: [String], default: [] },
  generatedAt:  { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      delete ret.__v;
      return ret;
    },
  },
});

weeklyReviewSchema.index({ userId: 1, weekStartDate: -1 });

module.exports = mongoose.model('WeeklyReview', weeklyReviewSchema);
