'use strict';

const request = require('supertest');

let app;

beforeAll(() => { app = require('../../app'); });

describe('POST /api/v1/auth/register', () => {
  it('should register a new user and return tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'register@revup.app', password: 'Password123!' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe('register@revup.app');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('should reject duplicate email with 409', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'dup@revup.app', password: 'Password123!' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'dup@revup.app', password: 'Password123!' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('USER_EXISTS');
  });

  it('should reject short password with 422', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'short@revup.app', password: '123' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeAll(async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'login@revup.app', password: 'Password123!' });
  });

  it('should login and return tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@revup.app', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@revup.app', password: 'WrongPass!' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('GET /api/v1/auth/me', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'me@revup.app', password: 'Password123!' });
    token = res.body.data.accessToken;
  });

  it('should return current user with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('me@revup.app');
  });

  it('should reject request with no token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  let token, refreshToken;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'logout@revup.app', password: 'Password123!' });
    token = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('should logout successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
