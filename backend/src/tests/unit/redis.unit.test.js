'use strict';

// Mock ioredis before requiring redis.js — prevents real TCP connections in tests
jest.mock('ioredis', () => {
  const EventEmitter = require('events');

  const mockClient = new EventEmitter();
  mockClient.status = 'ready';
  mockClient.quit = jest.fn().mockResolvedValue('OK');
  mockClient.ping = jest.fn().mockResolvedValue('PONG');
  mockClient.get = jest.fn().mockResolvedValue(null);
  mockClient.set = jest.fn().mockResolvedValue('OK');
  mockClient.del = jest.fn().mockResolvedValue(1);

  return jest.fn().mockImplementation(() => mockClient);
});

describe('redis.js singleton', () => {
  beforeEach(() => {
    jest.resetModules();
    // Re-apply the ioredis mock after module reset
    jest.mock('ioredis', () => {
      const EventEmitter = require('events');
      const mockClient = new EventEmitter();
      mockClient.status = 'ready';
      mockClient.quit = jest.fn().mockResolvedValue('OK');
      return jest.fn().mockImplementation(() => mockClient);
    });
  });

  it('should export a redis client object', () => {
    const redis = require('../../config/redis');
    expect(redis).toBeDefined();
  });

  it('should export a quit function', () => {
    const redis = require('../../config/redis');
    expect(typeof redis.quit).toBe('function');
  });

  it('should be a singleton (same instance on multiple requires)', () => {
    const redis1 = require('../../config/redis');
    const redis2 = require('../../config/redis');
    expect(redis1).toBe(redis2);
  });
});
