'use strict';

const mongoose = require('mongoose');

describe('db.js', () => {
  let db;

  beforeAll(() => {
    db = require('../../config/db');
  });

  it('should export connect and disconnect functions', () => {
    expect(typeof db.connect).toBe('function');
    expect(typeof db.disconnect).toBe('function');
  });

  it('connect() should succeed when MONGO_URI is valid', async () => {
    // db.helper.js already connected — calling connect() again should be idempotent
    await expect(db.connect()).resolves.not.toThrow();
    expect(mongoose.connection.readyState).toBe(1);
  });

  it('disconnect() then reconnect should restore readyState to 1', async () => {
    await db.disconnect();
    expect(mongoose.connection.readyState).toBe(0);

    // Reconnect so db.helper.js afterAll can close cleanly
    await mongoose.connect(process.env.MONGO_URI);
    expect(mongoose.connection.readyState).toBe(1);
  });

  it('should register connected/error/disconnected event listeners', async () => {
    await db.connect();
    const registeredEvents = mongoose.connection.eventNames();
    expect(registeredEvents).toEqual(expect.arrayContaining(['connected', 'error', 'disconnected']));
  });
});
