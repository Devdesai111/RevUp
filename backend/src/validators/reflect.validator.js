'use strict';

// ─── Task 46: Reflection Validation Schemas ───────────────────────────────────

const { z } = require('zod');

const eveningSchema = z.object({
  body: z.object({
    date: z.string().min(1, 'date is required'),
    text: z.string().min(10, 'Reflection must be at least 10 characters')
               .max(5000, 'Reflection cannot exceed 5000 characters'),
    mode: z.enum(['text', 'voice']).optional().default('text'),
  }),
});

const searchSchema = z.object({
  query: z.object({
    q:     z.string().min(1, 'Search query q is required'),
    page:  z.string().optional(),
    limit: z.string().optional(),
  }),
});

const historySchema = z.object({
  query: z.object({
    page:  z.string().optional(),
    limit: z.string().optional(),
    tags:  z.string().optional(),
  }),
});

const exportPDFSchema = z.object({
  query: z.object({
    year:  z.string().optional().transform((v) => (v ? parseInt(v, 10) : new Date().getFullYear())),
    month: z.string().optional().transform((v) => {
      const m = parseInt(v, 10);
      return (m >= 1 && m <= 12) ? m : new Date().getMonth() + 1;
    }),
  }),
});

module.exports = { eveningSchema, searchSchema, historySchema, exportPDFSchema };
