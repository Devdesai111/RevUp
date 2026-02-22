'use strict';

const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    email:    z.string().email('Invalid email').toLowerCase().trim(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email:    z.string().email('Invalid email').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
  }),
});

const forgotSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email').toLowerCase().trim(),
  }),
});

const resetSchema = z.object({
  body: z.object({
    token:       z.string().min(1, 'Reset token is required'),
    email:       z.string().email('Invalid email').toLowerCase().trim(),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
});

const updateMeSchema = z.object({
  body: z.object({
    timezone: z.string().optional(),
    notificationPreferences: z.object({
      morning: z.boolean().optional(),
      evening: z.boolean().optional(),
      drift:   z.boolean().optional(),
      streak:  z.boolean().optional(),
    }).optional(),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
  updateMeSchema,
  refreshSchema,
  logoutSchema,
};
