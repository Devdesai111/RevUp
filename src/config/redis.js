'use strict';

const env = require('./env');
const logger = require('../utils/logger');

// ─── In-memory mock client for test environment ───────────────────────────────
// Avoids needing a real Redis server in CI/test while keeping the same API.
const createMemoryClient = () => {
  const store = new Map();
  const timers = new Map();

  const del = (key) => {
    clearTimeout(timers.get(key));
    timers.delete(key);
    const existed = store.has(key);
    store.delete(key);
    return Promise.resolve(existed ? 1 : 0);
  };

  return {
    status: 'ready',
    // get / set / del — core commands used by auth and reset services
    get: (key) => Promise.resolve(store.get(key) ?? null),
    set: (key, value, exFlag, ttl) => {
      store.set(key, value);
      if (exFlag === 'EX' && ttl) {
        clearTimeout(timers.get(key));
        timers.set(key, setTimeout(() => store.delete(key), ttl * 1000).unref());
      }
      return Promise.resolve('OK');
    },
    del,
    // incr / expire — used by alignment and rate limiting
    incr: (key) => {
      const n = (Number(store.get(key)) || 0) + 1;
      store.set(key, String(n));
      return Promise.resolve(n);
    },
    expire: (key, ttl) => {
      if (!store.has(key)) { return Promise.resolve(0); }
      clearTimeout(timers.get(key));
      timers.set(key, setTimeout(() => store.delete(key), ttl * 1000).unref());
      return Promise.resolve(1);
    },
    // setex — convenience alias
    setex: (key, ttl, value) => {
      store.set(key, value);
      clearTimeout(timers.get(key));
      timers.set(key, setTimeout(() => store.delete(key), ttl * 1000).unref());
      return Promise.resolve('OK');
    },
    // getset — atomic get + set
    getset: async (key, value) => {
      const old = store.get(key) ?? null;
      store.set(key, value);
      return Promise.resolve(old);
    },
    // keys — scan (used by sweep job)
    keys: (pattern) => {
      const re = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return Promise.resolve([...store.keys()].filter((k) => re.test(k)));
    },
    // pipeline stub — returns array of results
    pipeline: () => {
      const cmds = [];
      const pipe = {
        set:    (...a) => { cmds.push(['set', ...a]);    return pipe; },
        get:    (...a) => { cmds.push(['get', ...a]);    return pipe; },
        del:    (...a) => { cmds.push(['del', ...a]);    return pipe; },
        incr:   (...a) => { cmds.push(['incr', ...a]);   return pipe; },
        expire: (...a) => { cmds.push(['expire', ...a]); return pipe; },
        exec:   () => Promise.resolve(cmds.map(() => [null, 'OK'])),
      };
      return pipe;
    },
    // quit / disconnect
    quit:       () => Promise.resolve('OK'),
    disconnect: () => Promise.resolve(),
    // event stubs
    on:         () => {},
    off:        () => {},
    once:       () => {},
    emit:       () => {},
    eventNames: () => [],
    call:       (..._args) => Promise.resolve('OK'),
  };
};

// ─── Real ioredis client for dev/prod ─────────────────────────────────────────
const createRealClient = () => {
  const Redis = require('ioredis');
  const client = new Redis(env.REDIS_URL, {
    keyPrefix: env.REDIS_KEY_PREFIX,
    lazyConnect: false,
  });

  client.on('ready',       () => logger.info({ url: env.REDIS_URL }, 'Redis connected'));
  client.on('error',       (err) => logger.error({ err: err.message }, 'Redis error'));
  client.on('reconnecting',(delay) => logger.warn({ delay }, 'Redis reconnecting'));
  client.on('close',       () => logger.info('Redis connection closed'));

  return client;
};

const client = env.NODE_ENV === 'test' ? createMemoryClient() : createRealClient();

module.exports = client;
