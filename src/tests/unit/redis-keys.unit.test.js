'use strict';

const REDIS_KEYS = require('../../config/redis-keys');

describe('redis-keys', () => {
  const uid = 'user123';
  const week = '2026-W08';
  const date = '2026-02-21';
  const email = 'test@revup.app';

  it('refreshToken(userId)', () => {
    expect(REDIS_KEYS.refreshToken(uid)).toBe(`auth:refresh:${uid}`);
  });

  it('passwordReset(email)', () => {
    expect(REDIS_KEYS.passwordReset(email)).toBe(`auth:reset:${email}`);
  });

  it('sessionVersion(userId)', () => {
    expect(REDIS_KEYS.sessionVersion(uid)).toBe(`auth:version:${uid}`);
  });

  it('identityCache(userId)', () => {
    expect(REDIS_KEYS.identityCache(uid)).toBe(`cache:identity:${uid}`);
  });

  it('planCache(userId, week)', () => {
    expect(REDIS_KEYS.planCache(uid, week)).toBe(`cache:plan:${uid}:${week}`);
  });

  it('avatarStateCache(userId)', () => {
    expect(REDIS_KEYS.avatarStateCache(uid)).toBe(`cache:avatar:${uid}`);
  });

  it('dashboardCache(userId)', () => {
    expect(REDIS_KEYS.dashboardCache(uid)).toBe(`cache:dashboard:${uid}`);
  });

  it('aiUsageWeekly(userId, weekKey)', () => {
    expect(REDIS_KEYS.aiUsageWeekly(uid, week)).toBe(`limit:ai:${uid}:${week}`);
  });

  it('sprintRerolls(userId, weekKey)', () => {
    expect(REDIS_KEYS.sprintRerolls(uid, week)).toBe(`limit:reroll:${uid}:${week}`);
  });

  it('alignmentLock(userId)', () => {
    expect(REDIS_KEYS.alignmentLock(uid)).toBe(`lock:alignment:${uid}`);
  });

  it('midnightSwept(userId, date)', () => {
    expect(REDIS_KEYS.midnightSwept(uid, date)).toBe(`sweep:${uid}:${date}`);
  });

  it('lastDriftAlert(userId)', () => {
    expect(REDIS_KEYS.lastDriftAlert(uid)).toBe(`notif:drift:${uid}`);
  });

  it('fcmToken(userId)', () => {
    expect(REDIS_KEYS.fcmToken(uid)).toBe(`fcm:token:${uid}`);
  });

  it('all keys are functions', () => {
    const fns = [
      'refreshToken', 'passwordReset', 'sessionVersion', 'identityCache',
      'planCache', 'avatarStateCache', 'dashboardCache', 'aiUsageWeekly',
      'sprintRerolls', 'alignmentLock', 'midnightSwept', 'lastDriftAlert',
      'fcmToken',
    ];
    fns.forEach((fn) => {
      expect(typeof REDIS_KEYS[fn]).toBe('function');
    });
  });
});
