'use strict';

const { transcribe } = require('../services/voice/stt.service');
const { sendSuccess } = require('../utils/response.util');
const { Errors } = require('../utils/AppError');

exports.transcribeAudio = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(Errors.badRequest('No audio file provided'));
    }

    const transcript = await transcribe(req.file.buffer, req.file.mimetype);
    return sendSuccess(res, {
      message: 'Transcription complete',
      data:    { transcript },
    });
  } catch (err) {
    return next(err);
  }
};
