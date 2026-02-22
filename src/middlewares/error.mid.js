'use strict';

const mongoose = require('mongoose');
const { AppError, Errors } = require('../utils/AppError');
const { sendError } = require('../utils/response.util');
const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * Global error handling middleware.
 * Must be mounted LAST in app.js (after all routes).
 * All errors reach here via next(err).
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, _next) => {
  let error = err;

  // ── Mongoose Validation Error → 422 ────────────────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = Errors.validationError('Validation failed', errors);
  }

  // ── Mongoose Duplicate Key Error (code 11000) → 409 ────────────────────────
  else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = Errors.conflict(`${field} already exists`);
  }

  // ── Mongoose CastError (invalid ObjectId) → 400 ────────────────────────────
  else if (err instanceof mongoose.Error.CastError) {
    error = Errors.badRequest(`Invalid value for field '${err.path}'`);
  }

  // ── JWT Errors → 401 ───────────────────────────────────────────────────────
  else if (err.name === 'JsonWebTokenError') {
    error = Errors.invalidToken('Invalid token');
  } else if (err.name === 'TokenExpiredError') {
    error = Errors.tokenExpired('Token has expired');
  }

  // ── Non-operational errors (programming bugs) → 500 ───────────────────────
  else if (!(err instanceof AppError)) {
    // Don't expose internals in production
    error = new AppError(
      env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
      500,
      'INTERNAL_ERROR'
    );
  }

  // Log server errors (5xx) — skip in test to keep output clean
  if (error.statusCode >= 500 && env.NODE_ENV !== 'test') {
    logger.error(
      { err, method: req.method, url: req.url, requestId: req.id },
      'Internal server error'
    );
  }

  return sendError(res, {
    message: error.message,
    code: error.code,
    errors: error.errors || [],
    statusCode: error.statusCode,
  });
};

module.exports = errorMiddleware;
