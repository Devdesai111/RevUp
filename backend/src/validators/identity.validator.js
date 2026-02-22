'use strict';

const { z } = require('zod');

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const currentIdentitySchema = z.object({
  body: z.object({
    role:                 z.string().max(100).optional(),
    energyLevel:          z.number().int().min(1).max(10).optional(),
    executionGap:         z.enum(['focus', 'consistency', 'motivation', 'clarity', 'time']).optional(),
    executionGapSeverity: z.number().int().min(1).max(5).optional(),
    strengths:            z.array(z.string()).max(5).optional(),
    weaknesses:           z.array(z.string()).max(5).optional(),
    frustrationPoint:     z.string().max(500).optional(),
    disciplineBreakPattern: z.string().max(500).optional(),
  }),
});

const futureIdentitySchema = z.object({
  body: z.object({
    desiredRole:         z.string().optional(),
    incomeRange:         z.string().optional(),
    skillGoals:          z.array(z.string()).max(5).optional(),
    healthTarget:        z.string().optional(),
    confidenceTarget:    z.string().optional(),
    lifestyleVision:     z.string().max(1000).optional(),
    declarationSentence: z.string().max(300).optional(),
  }),
});

const constraintsSchema = z.object({
  body: z.object({
    availableHoursPerDay: z.number().min(0.5).max(16).optional(),
    workHoursStart:  z.string().regex(TIME_REGEX, 'Format must be HH:MM').optional(),
    workHoursEnd:    z.string().regex(TIME_REGEX, 'Format must be HH:MM').optional(),
    sleepHours:      z.number().min(4).max(12).optional(),
    focusWindowStart:z.string().regex(TIME_REGEX, 'Format must be HH:MM').optional(),
    focusWindowEnd:  z.string().regex(TIME_REGEX, 'Format must be HH:MM').optional(),
    fixedCommitments:z.array(z.string()).optional(),
  }),
});

const riskSchema = z.object({
  body: z.object({
    answers: z.array(z.number().int().min(1).max(5)).length(6, 'Exactly 6 answers required'),
  }),
});

const pillarsSchema = z.object({
  body: z.object({
    pillars: z.array(z.string().min(1)).min(2).max(3),
  }),
});

const avatarBaseSchema = z.object({
  body: z.object({
    genderPresentation: z.string().optional(),
    skinTone:           z.string().optional(),
    clothingStyle:      z.string().optional(),
    environmentTheme:   z.string().optional(),
  }),
});

const declarationSchema = z.object({
  body: z.object({
    declaration: z.string().min(10).max(300),
  }),
});

module.exports = {
  currentIdentitySchema,
  futureIdentitySchema,
  constraintsSchema,
  riskSchema,
  pillarsSchema,
  avatarBaseSchema,
  declarationSchema,
};
