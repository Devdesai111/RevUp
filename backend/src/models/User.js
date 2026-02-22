'use strict';

const mongoose = require('mongoose');

const notificationPreferencesSchema = new mongoose.Schema({
  morning: { type: Boolean, default: true },
  evening: { type: Boolean, default: true },
  drift:   { type: Boolean, default: true },
  streak:  { type: Boolean, default: true },
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  passwordHash: {
    type: String,
    select: false,  // never returned in queries by default
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'apple'],
    required: [true, 'Auth provider is required'],
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free',
  },
  timezone: {
    type: String,
    default: 'UTC',
  },
  notificationPreferences: {
    type: notificationPreferencesSchema,
    default: () => ({}),
  },
  fcmToken: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  // Incremented on logout-all to invalidate all existing tokens
  tokenVersion: {
    type: Number,
    default: 0,
  },
  stripeCustomerId: {
    type: String,
    default: null,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      delete ret.passwordHash;
      delete ret.__v;
      return ret;
    },
  },
});

// ─── Indexes (email uniqueness declared on field, additional indexes here) ────
userSchema.index({ subscriptionTier: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);
