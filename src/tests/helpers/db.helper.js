'use strict';

const mongoose = require('mongoose');

beforeAll(async () => {
  // MONGO_URI is set by globalSetup (MongoMemoryServer)
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI not set — globalSetup may have failed');
  }

  await mongoose.connect(uri);
});

afterEach(async () => {
  // Clear all collections between tests for isolation
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
