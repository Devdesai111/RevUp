'use strict';

describe('upload middleware', () => {
  let uploadAudio;
  beforeAll(() => {
    uploadAudio = require('../../middlewares/upload.mid');
  });

  it('should export a multer middleware function', () => {
    expect(typeof uploadAudio).toBe('function');
  });

  it('should call next with INVALID_AUDIO_FORMAT for unsupported mime type', () => {
    // Simulate multer calling fileFilter
    const req  = {};
    const file = { mimetype: 'image/png', originalname: 'photo.png', size: 1000 };
    const cb   = jest.fn();

    // Access the internal fileFilter directly
    uploadAudio._fileFilter(req, file, cb);
    const [err] = cb.mock.calls[0];
    expect(err).toBeTruthy();
    expect(err.code).toBe('INVALID_AUDIO_FORMAT');
  });

  it('should accept valid audio mime type', () => {
    const req  = {};
    const file = { mimetype: 'audio/webm', originalname: 'voice.webm', size: 1000 };
    const cb   = jest.fn();

    uploadAudio._fileFilter(req, file, cb);
    // cb called with (null, true) → accepted
    expect(cb).toHaveBeenCalledWith(null, true);
  });
});
