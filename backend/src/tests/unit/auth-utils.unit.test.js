'use strict';

describe('hash.util', () => {
  let hashPassword, comparePassword;
  beforeAll(() => {
    ({ hashPassword, comparePassword } = require('../../utils/hash.util'));
  });

  it('should hash a password', async () => {
    const hash = await hashPassword('MySecret123!');
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe('MySecret123!');
    expect(hash.startsWith('$2b$')).toBe(true);
  });

  it('comparePassword should return true for matching password', async () => {
    const hash = await hashPassword('correct-password');
    const result = await comparePassword('correct-password', hash);
    expect(result).toBe(true);
  });

  it('comparePassword should return false for wrong password', async () => {
    const hash = await hashPassword('correct-password');
    const result = await comparePassword('wrong-password', hash);
    expect(result).toBe(false);
  });
});

describe('jwt.util', () => {
  let generateAccessToken, generateRefreshToken, verifyToken;
  let env;

  beforeAll(() => {
    ({ generateAccessToken, generateRefreshToken, verifyToken } = require('../../utils/jwt.util'));
    env = require('../../config/env');
  });

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    subscriptionTier: 'free',
    tokenVersion: 0,
  };

  it('generateAccessToken should return a JWT string', () => {
    const token = generateAccessToken(mockUser);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('generateRefreshToken should return a JWT string', () => {
    const token = generateRefreshToken(mockUser);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('verifyToken should decode a valid access token', () => {
    const token = generateAccessToken(mockUser);
    const decoded = verifyToken(token, env.JWT_ACCESS_SECRET);
    expect(decoded.sub).toBe(mockUser._id.toString());
    expect(decoded.tier).toBe('free');
    expect(decoded.version).toBe(0);
  });

  it('verifyToken should throw INVALID_TOKEN for bad token', () => {
    expect(() => verifyToken('bad.token.here', env.JWT_ACCESS_SECRET)).toThrow();
  });

  it('verifyToken should throw TOKEN_EXPIRED for expired token', () => {
    const jwt = require('jsonwebtoken');
    const expired = jwt.sign(
      { sub: 'uid', tier: 'free', version: 0 },
      env.JWT_ACCESS_SECRET,
      { expiresIn: -1 }
    );
    expect(() => verifyToken(expired, env.JWT_ACCESS_SECRET)).toThrow();
  });
});
