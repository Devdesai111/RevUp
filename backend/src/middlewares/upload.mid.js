'use strict';

const multer = require('multer');
const { Errors } = require('../utils/AppError');

const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp4',
  'audio/m4a',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(Errors.invalidAudioFormat(`Unsupported audio format: ${file.mimetype}`));
  }
  return cb(null, true);
};

const multerInstance = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

// Single-file upload middleware — field name: 'audio'
const uploadAudio = multerInstance.single('audio');

// Expose fileFilter for unit testing
uploadAudio._fileFilter = fileFilter;

// Wrap multer error into AppError so our error handler formats it correctly
const wrappedUpload = (req, res, next) => {
  uploadAudio(req, res, (err) => {
    if (!err) { return next(); }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(Errors.audioTooLarge());
    }
    return next(err);
  });
};

wrappedUpload._fileFilter = fileFilter;

module.exports = wrappedUpload;
