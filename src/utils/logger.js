'use strict';

const pino = require('pino');
const env = require('../config/env');

// ─── Base logger ──────────────────────────────────────────────────────────────
const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  base: {
    env: env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Redact sensitive fields from logs
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'body.password', 'body.token'],
    censor: '[REDACTED]',
  },
});

// ─── pino-http request logger factory ────────────────────────────────────────
// Returns a configured pino-http middleware instance.
// Called in app.js: app.use(createHttpLogger())
const createHttpLogger = () => {
  const pinoHttp = require('pino-http');
  return pinoHttp({
    logger,
    // Attach requestId and userId to every log line
    genReqId: (req) => req.headers['x-request-id'] || require('crypto').randomUUID(),
    customLogLevel: (_req, res) => {
      if (res.statusCode >= 500) {
        return 'error';
      }
      if (res.statusCode >= 400) {
        return 'warn';
      }
      return 'info';
    },
    customSuccessMessage: (req, res) =>
      `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req, res, err) =>
      `${req.method} ${req.url} ${res.statusCode} — ${err.message}`,
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        userId: req.raw?.userId,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  });
};

module.exports = logger;
module.exports.createHttpLogger = createHttpLogger;
