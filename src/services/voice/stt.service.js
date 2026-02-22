'use strict';

const fs   = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');
const env    = require('../../config/env');
const logger = require('../../utils/logger');
const { Errors } = require('../../utils/AppError');

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

/**
 * transcribe — send audio buffer to Whisper API, return transcript string.
 * Always cleans up the temp file in finally block.
 * @param {Buffer} buffer   — raw audio bytes
 * @param {string} mimetype — e.g. 'audio/webm'
 * @returns {Promise<string>} transcript text
 */
const transcribe = async (buffer, mimetype) => {
  const ext     = mimetype.split('/')[1] || 'mp3';
  const tmpPath = path.join('/tmp', `revup-${uuidv4()}.${ext}`);

  try {
    fs.writeFileSync(tmpPath, buffer);

    const response = await client.audio.transcriptions.create({
      file:  fs.createReadStream(tmpPath),
      model: env.OPENAI_MODEL_STT,
    });

    const transcript = response.text ?? '';
    logger.info({ chars: transcript.length }, 'STT transcription complete');
    return transcript;

  } catch (err) {
    logger.error({ err: err.message }, 'STT transcription failed');
    throw Errors.aiUnavailable('Speech-to-text service is temporarily unavailable');
  } finally {
    try { fs.unlinkSync(tmpPath); } catch (_) { /* already gone */ }
  }
};

module.exports = { transcribe };
