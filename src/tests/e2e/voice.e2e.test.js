'use strict';

// ─── E2E: Voice Routes ────────────────────────────────────────────────────────
// The STT service writes a temp file then creates an fs.ReadStream. In test,
// the OpenAI mock resolves before the stream is consumed, and then the finally
// block deletes the file — causing a ENOENT error when Node opens the stream
// lazily. We mock stt.service to bypass fs side-effects and focus on testing
// the route → controller → middleware chain.

jest.mock('../../services/voice/stt.service', () => ({
  transcribe: jest.fn().mockResolvedValue('Test transcript from audio file.'),
}));

const request = require('supertest');
const { createTestUser, createPremiumUser } = require('../helpers/auth.helper');

let app;

beforeAll(() => { app = require('../../app'); });

// ─── POST /voice/transcribe ───────────────────────────────────────────────────

describe('POST /api/v1/voice/transcribe', () => {
  // Minimal valid audio buffer
  const fakeAudioBuffer = Buffer.from('fake-audio-content-for-testing');

  it('should transcribe audio for a premium user and return transcript', async () => {
    const { accessToken: token } = await createPremiumUser();

    const res = await request(app)
      .post('/api/v1/voice/transcribe')
      .set('Authorization', `Bearer ${token}`)
      .attach('audio', fakeAudioBuffer, { filename: 'test.webm', contentType: 'audio/webm' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // sendSuccess(res, { message: '...', data: { transcript } })
    // → res.body.data = { transcript: '...' }
    expect(res.body.data.transcript).toBe('Test transcript from audio file.');
  });

  it('should return 403 (PREMIUM_REQUIRED) for free-tier user', async () => {
    const { accessToken: token } = await createTestUser({ subscriptionTier: 'free' });

    const res = await request(app)
      .post('/api/v1/voice/transcribe')
      .set('Authorization', `Bearer ${token}`)
      .attach('audio', fakeAudioBuffer, { filename: 'test.webm', contentType: 'audio/webm' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('PREMIUM_REQUIRED');
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/v1/voice/transcribe')
      .attach('audio', fakeAudioBuffer, { filename: 'test.webm', contentType: 'audio/webm' });

    expect(res.status).toBe(401);
  });

  it('should return 400 when no audio file is attached', async () => {
    const { accessToken: token } = await createPremiumUser();

    const res = await request(app)
      .post('/api/v1/voice/transcribe')
      .set('Authorization', `Bearer ${token}`)
      .send({}); // no multipart file

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 422 for unsupported audio format (INVALID_AUDIO_FORMAT)', async () => {
    const { accessToken: token } = await createPremiumUser();

    const res = await request(app)
      .post('/api/v1/voice/transcribe')
      .set('Authorization', `Bearer ${token}`)
      .attach('audio', fakeAudioBuffer, { filename: 'test.txt', contentType: 'text/plain' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INVALID_AUDIO_FORMAT');
  });
});
