'use strict';

const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = env.NODE_ENV === 'test' ? 100 : 5000;

// Connection options as per spec
const MONGO_OPTIONS = {
  maxPoolSize: env.MONGO_MAX_POOL_SIZE,
  serverSelectionTimeoutMS: env.NODE_ENV === 'test' ? 3000 : 5000,
  socketTimeoutMS: 45000,
};

// Track whether listeners are already registered (prevent duplicates on reconnect)
let listenersRegistered = false;

const registerListeners = () => {
  if (listenersRegistered) {
    return;
  }
  listenersRegistered = true;

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
};

/**
 * Connect to MongoDB with automatic retry.
 * Uses MONGO_URI (overridden to MongoMemoryServer URI in test environment by setup.js).
 */
const connect = async (attempt = 1) => {
  const uri = env.MONGO_URI;

  registerListeners();

  // If already connected, skip
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(uri, MONGO_OPTIONS);
  } catch (err) {
    logger.warn(
      { attempt, maxRetries: MAX_RETRIES, err: err.message },
      `MongoDB connection failed — retrying in ${RETRY_DELAY_MS}ms`
    );

    if (attempt >= MAX_RETRIES) {
      logger.error({ err }, 'MongoDB max retries exceeded — exiting');
      process.exit(1);
    }

    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return connect(attempt + 1);
  }
};

/**
 * Close the MongoDB connection gracefully.
 */
const disconnect = async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
};

module.exports = { connect, disconnect };
