'use strict';

const { z } = require('zod');

// Quarter generation — just trigger, no body needed
const quarterSchema = z.object({
  body: z.object({}).optional(),
});

// Sprint editing — patch task names
const editSprintSchema = z.object({
  body: z.object({
    tasks: z.array(
      z.object({
        taskId:   z.string().min(1),
        taskName: z.string().min(1).max(200),
      }),
    ).min(1),
  }),
});

// Add extra (non-scoring) task
const extraTaskSchema = z.object({
  body: z.object({
    taskName:      z.string().min(1).max(200),
    estimatedMins: z.number().int().min(5).max(480).optional(),
  }),
});

module.exports = { quarterSchema, editSprintSchema, extraTaskSchema };
