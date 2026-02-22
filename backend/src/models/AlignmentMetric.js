'use strict';

const mongoose = require('mongoose');

const componentsSchema = new mongoose.Schema({
  coreCompletion:      { type: Number, default: 0 },
  supportCompletion:   { type: Number, default: 0 },
  habitCompletion:     { type: Number, default: 0 },
  effortNormalized:    { type: Number, default: 0 },
  reflectionQuality:   { type: Number, default: 0 },
}, { _id: false });

const alignmentMetricSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'userId is required'],
  },
  date: {
    type: Date,
    required: [true, 'date is required'],
  },
  alignmentScore: {
    type: Number,
    min: [0, 'alignmentScore must be >= 0'],
    max: [100, 'alignmentScore must be <= 100'],
    default: 0,
  },
  rawScore:         { type: Number, default: 0 },
  streakMultiplier: { type: Number, default: 1.0 },
  driftIndex: {
    type: Number,
    min: -1,
    max: 1,
    default: 0,
  },
  sevenDayAverage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  streakCount:  { type: Number, default: 0 },
  stateLevel: {
    type: Number,
    enum: [1, 2, 3],
    default: 2,
  },
  patternFlags: { type: [String], default: [] },
  components:   { type: componentsSchema, default: () => ({}) },
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      delete ret.__v;
      return ret;
    },
  },
});

alignmentMetricSchema.index({ userId: 1, date: 1 }, { unique: true });
alignmentMetricSchema.index({ userId: 1, date: -1 });
alignmentMetricSchema.index({ alignmentScore: -1 });

module.exports = mongoose.model('AlignmentMetric', alignmentMetricSchema);
