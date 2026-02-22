'use strict';

const { z } = require('zod');

// ─── Task sub-schema ──────────────────────────────────────────────────────────
const taskItemSchema = z.object({
  taskId:      z.string().optional(),
  taskName:    z.string().min(1),
  weight:      z.number().int().min(1).max(5).optional(),
  isCore:      z.boolean().optional(),
  completed:   z.boolean().optional(),
  effortScore: z.number().int().min(0).max(10).optional(),
}).superRefine((task, ctx) => {
  if (task.completed === true && (!task.effortScore || task.effortScore === 0)) {
    ctx.addIssue({
      code:    z.ZodIssueCode.custom,
      message: 'effortScore must be ≥ 1 when task is completed',
      path:    ['effortScore'],
    });
  }
});

// ─── Log schema — POST /exec/log ─────────────────────────────────────────────
const logSchema = z.object({
  body: z.object({
    date:            z.string(),
    tasks:           z.array(taskItemSchema).optional(),
    habitDone:       z.boolean().optional(),
    deepWorkMinutes: z.number().int().min(0).max(720).optional(),
  }),
});

// ─── Timer schema — POST /exec/timer ─────────────────────────────────────────
const timerSchema = z.object({
  body: z.object({
    minutes: z.number().int().min(1).max(240),
  }),
});

// ─── Intent schema — POST /exec/intent ───────────────────────────────────────
const intentSchema = z.object({
  body: z.object({
    date: z.string(),
  }),
});

module.exports = { logSchema, timerSchema, intentSchema };
