'use strict';

jest.mock('../../models/User');
jest.mock('../../config/redis');
jest.mock('../../utils/hash.util');
jest.mock('../../utils/jwt.util');

const authService = require('../../services/auth/auth.service');
const User = require('../../models/User');
const redis = require('../../config/redis');
const { hashPassword, comparePassword } = require('../../utils/hash.util');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../../utils/jwt.util');

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'test@revup.app',
  passwordHash: '$2b$hashedpw',
  authProvider: 'local',
  subscriptionTier: 'free',
  tokenVersion: 0,
  isActive: true,
  save: jest.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  jest.clearAllMocks();
  hashPassword.mockResolvedValue('$2b$hashed');
  comparePassword.mockResolvedValue(true);
  generateAccessToken.mockReturnValue('access-token');
  generateRefreshToken.mockReturnValue('refresh-token');
  verifyToken.mockReturnValue({ sub: mockUser._id, version: 0 });
  redis.set = jest.fn().mockResolvedValue('OK');
  redis.del = jest.fn().mockResolvedValue(1);
  redis.get = jest.fn().mockResolvedValue(null);
});

describe('auth.service.registerUser', () => {
  it('should create user and return tokens', async () => {
    User.findOne = jest.fn().mockResolvedValue(null);
    User.prototype.save = jest.fn().mockResolvedValue(undefined);
    User.mockImplementation(() => ({ ...mockUser, save: jest.fn().mockResolvedValue(undefined) }));

    const result = await authService.registerUser('new@revup.app', 'Password1!');
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result).toHaveProperty('user');
  });

  it('should throw USER_EXISTS if email taken', async () => {
    User.findOne = jest.fn().mockResolvedValue(mockUser);
    await expect(authService.registerUser('test@revup.app', 'Password1!')).rejects.toMatchObject({
      code: 'USER_EXISTS',
    });
  });
});

describe('auth.service.loginUser', () => {
  it('should return tokens on valid credentials', async () => {
    User.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ ...mockUser, save: jest.fn() }),
    });

    const result = await authService.loginUser('test@revup.app', 'Password1!');
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });

  it('should throw INVALID_CREDENTIALS for wrong password', async () => {
    comparePassword.mockResolvedValue(false);
    User.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ ...mockUser, save: jest.fn() }),
    });
    await expect(authService.loginUser('test@revup.app', 'wrong')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('should throw INVALID_CREDENTIALS if user not found', async () => {
    User.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    await expect(authService.loginUser('no@one.com', 'pw')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
  });
});

describe('auth.service.logoutUser', () => {
  it('should delete the refresh token from redis', async () => {
    await authService.logoutUser(mockUser._id, 'some-refresh-token');
    expect(redis.del).toHaveBeenCalled();
  });
});

describe('auth.service.logoutAll', () => {
  it('should increment tokenVersion', async () => {
    User.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockUser, tokenVersion: 1 });
    await authService.logoutAll(mockUser._id);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      mockUser._id,
      { $inc: { tokenVersion: 1 } },
      expect.any(Object)
    );
  });
});
