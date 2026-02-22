'use strict';

// ─── Task 68: Identity Factory ────────────────────────────────────────────────

const IdentityProfile = require('../../../models/IdentityProfile');

const buildIdentity = (userId, overrides = {}) => ({
  userId,
  currentIdentity: {
    role:                'Software Engineer',
    energyLevel:         6,
    executionGap:        'focus',
    executionGapSeverity: 3,
    strengths:           ['coding', 'problem solving'],
    weaknesses:          ['consistency', 'distraction'],
    frustrationPoint:    'Starting tasks I never finish',
  },
  futureIdentity: {
    desiredRole:         'Senior Engineering Manager',
    incomeRange:         '200k-250k',
    skillGoals:          ['leadership', 'system design'],
    lifestyleVision:     'Location independent',
    declarationSentence: 'I am becoming a leader who executes with discipline.',
  },
  riskProfile: {
    stabilityScore:       55,
    procrastinationIndex: 40,
    driftProbability:     0.35,
  },
  priorityPillars: ['career', 'health', 'finances'],
  onboardingComplete: true,
  synthesisDone:      true,
  ...overrides,
});

const createIdentity = (userId, overrides = {}) =>
  IdentityProfile.create(buildIdentity(userId, overrides));

module.exports = { buildIdentity, createIdentity };
