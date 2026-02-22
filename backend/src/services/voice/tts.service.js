'use strict';

// ─── Task 56: TTS Generation & S3 Upload (Premium) ───────────────────────────

const OpenAI    = require('openai');
const env       = require('../../config/env');
const logger    = require('../../utils/logger');
const { Errors } = require('../../utils/AppError');

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

/**
 * Generate TTS audio for AI feedback and upload to S3.
 * Returns presigned GET URL. For premium users only.
 *
 * @param {string} text            - AI feedback text to convert
 * @param {string} userId
 * @param {string} journalEntryId
 * @returns {Promise<string>}      - presigned S3 URL
 */
const generateTTSAndUpload = async (text, userId, journalEntryId) => {
  // ── Generate TTS audio ────────────────────────────────────────────────────
  let audioBuffer;
  try {
    const response = await client.audio.speech.create({
      model:  'tts-1',
      voice:  'onyx',
      input:  text,
    });
    audioBuffer = Buffer.from(await response.arrayBuffer());
  } catch (err) {
    logger.error({ err: err.message }, 'TTS generation failed');
    throw Errors.aiUnavailable('TTS service is temporarily unavailable');
  }

  // ── Upload to S3 ──────────────────────────────────────────────────────────
  const { getS3Client }       = require('../../config/aws');
  const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
  const { getSignedUrl }      = require('@aws-sdk/s3-request-presigner');

  const bucket   = env.AWS_S3_BUCKET || 'revup-voice';
  const s3Key    = `voice-responses/${userId}/${journalEntryId}.mp3`;
  const expiry   = Number(env.AWS_S3_URL_EXPIRY) || 3600;

  try {
    const s3 = getS3Client();
    await s3.send(new PutObjectCommand({
      Bucket:      bucket,
      Key:         s3Key,
      Body:        audioBuffer,
      ContentType: 'audio/mpeg',
    }));

    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucket, Key: s3Key }),
      { expiresIn: expiry },
    );

    logger.info({ s3Key, userId }, 'TTS audio uploaded to S3');
    return signedUrl;

  } catch (err) {
    logger.error({ err: err.message, s3Key }, 'S3 upload failed');
    throw Errors.internal('Failed to upload TTS audio');
  }
};

module.exports = { generateTTSAndUpload };
