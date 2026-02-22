'use strict';

/**
 * 200 OK — standard success
 */
const sendSuccess = (res, { message, data = null, statusCode = 200 } = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * 201 Created
 */
const sendCreated = (res, { message, data = null } = {}) => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};

/**
 * 202 Accepted — async job dispatched
 */
const sendAccepted = (res, { message = 'Processing', jobId } = {}) => {
  return res.status(202).json({
    success: true,
    message,
    data: { jobId },
  });
};

/**
 * Error response
 */
const sendError = (res, { message, code = 'INTERNAL_ERROR', errors = [], statusCode = 500 } = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
    errors,
  });
};

/**
 * Paginated list response
 */
const sendPaginated = (res, { message, data = [], pagination, statusCode = 200 } = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
  });
};

module.exports = { sendSuccess, sendCreated, sendAccepted, sendError, sendPaginated };
