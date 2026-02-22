'use strict';

const mongoose = require('mongoose');

const analysisFlagsSchema = new mongoose.Schema({
  hasAccountability:  { type: Boolean, default: false },
  hasExcuses:         { type: Boolean, default: false },
  hasGrowthMindset:   { type: Boolean, default: false },
  specificity:        { type: Number, min: 0, max: 10, default: 0 },
}, { _id: false });

const VALID_TAGS = [
  'accountability', 'breakthrough', 'challenge', 'clarity', 'discipline',
  'emotion', 'energy', 'focus', 'gratitude', 'growth', 'habit', 'health',
  'identity', 'mindset', 'planning', 'progress', 'reflection', 'relationships',
  'setback', 'victory', 'vision', 'work',
];

const journalEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'userId is required'],
  },
  date: {
    type: Date,
    required: [true, 'date is required'],
  },
  reflectionText: {
    type: String,
    minlength: [10, 'reflectionText must be at least 10 characters'],
    maxlength: [5000, 'reflectionText cannot exceed 5000 characters'],
    default: null,
  },
  voiceUrl:   { type: String, default: null },
  inputMode: {
    type: String,
    enum: ['text', 'voice'],
    default: 'text',
  },
  wordCount:              { type: Number, default: 0 },
  aiFeedback:             { type: String, default: null },
  aiTone: {
    type: String,
    enum: ['encouraging', 'firm', 'neutral', 'strategic'],
    default: 'neutral',
  },
  aiAudioUrl:             { type: String, default: null },
  reflectionQualityScore: { type: Number, min: 0, max: 100, default: 0 },
  baselineScore:          { type: Number, default: 0 },
  alignmentDelta:         { type: Number, default: 0 },
  analysisFlags:          { type: analysisFlagsSchema, default: () => ({}) },
  tags: {
    type: [String],
    enum: VALID_TAGS,
    default: [],
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  processedAt: { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      delete ret.__v;
      return ret;
    },
  },
});

journalEntrySchema.index({ userId: 1, date: -1 });
journalEntrySchema.index({ tags: 1 });
journalEntrySchema.index({ userId: 1, processingStatus: 1 });
journalEntrySchema.index({ reflectionText: 'text' });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
