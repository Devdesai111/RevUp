'use strict';

const mongoose = require('mongoose');

const currentIdentitySchema = new mongoose.Schema({
  role: String,
  energyLevel: { type: Number, min: 1, max: 10 },
  executionGap: {
    type: String,
    enum: ['starting', 'consistency', 'finishing', 'focus', 'discipline'],
  },
  executionGapSeverity: { type: Number, min: 1, max: 5 },
  strengths: [String],
  weaknesses: [String],
  frustrationPoint: String,
  disciplineBreakPattern: String,
}, { _id: false });

const futureIdentitySchema = new mongoose.Schema({
  desiredRole: String,
  incomeRange: String,
  skillGoals: [String],
  healthTarget: String,
  confidenceTarget: String,
  lifestyleVision: String,
  declarationSentence: String,
}, { _id: false });

const blueprintSchema = new mongoose.Schema({
  behavioralRiskProfile: String,
  quarterlyDirection: String,
  keyInsight: String,
  synthesizedAt: Date,
}, { _id: false });

const timeConstraintsSchema = new mongoose.Schema({
  availableHoursPerDay: Number,
  workHoursStart: String,
  workHoursEnd: String,
  sleepHours: Number,
  focusWindowStart: String,
  focusWindowEnd: String,
  fixedCommitments: [String],
}, { _id: false });

const riskProfileSchema = new mongoose.Schema({
  stabilityScore: Number,
  procrastinationIndex: Number,
  driftProbability: Number,
  rawAnswers: [mongoose.Schema.Types.Mixed],
}, { _id: false });

const avatarPreferencesSchema = new mongoose.Schema({
  genderPresentation: String,
  skinTone: String,
  clothingStyle: String,
  environmentTheme: String,
}, { _id: false });

const onboardingStepsSchema = new mongoose.Schema({
  currentIdentityDone: { type: Boolean, default: false },
  futureIdentityDone:  { type: Boolean, default: false },
  constraintsDone:     { type: Boolean, default: false },
  riskAssessmentDone:  { type: Boolean, default: false },
  pillarsSelected:     { type: Boolean, default: false },
  synthesized:         { type: Boolean, default: false },
  avatarCreated:       { type: Boolean, default: false },
}, { _id: false });

const identityProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'userId is required'],
    unique: true,
  },
  currentIdentity:  { type: currentIdentitySchema,  default: () => ({}) },
  futureIdentity:   { type: futureIdentitySchema,   default: () => ({}) },
  blueprint:        { type: blueprintSchema,         default: () => ({}) },
  timeConstraints:  { type: timeConstraintsSchema,  default: () => ({}) },
  riskProfile:      { type: riskProfileSchema,      default: () => ({}) },
  priorityPillars: {
    type: [String],
    validate: {
      validator: (arr) => arr.length <= 3,
      message: 'priorityPillars cannot exceed 3 items',
    },
    default: [],
  },
  avatarPreferences:  { type: avatarPreferencesSchema,  default: () => ({}) },
  onboardingSteps:    { type: onboardingStepsSchema,    default: () => ({}) },
  baselineAlignmentScore: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      delete ret.__v;
      return ret;
    },
  },
});

// userId unique index declared on field above — no duplicate needed here

module.exports = mongoose.model('IdentityProfile', identityProfileSchema);
