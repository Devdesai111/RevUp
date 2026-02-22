'use strict';

// ─── Task 56: AWS S3 Client Configuration ────────────────────────────────────

const env = require('./env');

let _s3Client;

const getS3Client = () => {
  if (!_s3Client) {
    const { S3Client } = require('@aws-sdk/client-s3');
    _s3Client = new S3Client({
      region:      env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId:     env.AWS_ACCESS_KEY_ID     || '',
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return _s3Client;
};

module.exports = { getS3Client };
