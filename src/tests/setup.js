'use strict';

const { MongoMemoryServer } = require('mongodb-memory-server');

// Load test environment variables before anything else
require('dotenv').config({ path: '.env.test' });

let mongoServer;

module.exports = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Override MONGO_URI so env.js picks up the in-memory server
  process.env.MONGO_URI = uri;

  // Store instance reference for teardown
  global.__MONGO_SERVER__ = mongoServer;
};
