// Cloudflare R2 integration for Spaktok backend
// Uses AWS S3 SDK (R2 is S3-compatible)

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const config = require('./config');

const r2 = config.cloudflareR2;

const s3 = new S3Client({
  region: 'auto',
  endpoint: r2.endpoint,
  credentials: {
    accessKeyId: r2.accessKeyId,
    secretAccessKey: r2.secretAccessKey,
  },
});

async function uploadToR2(key, body, contentType) {
  const command = new PutObjectCommand({
    Bucket: r2.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await s3.send(command);
  return `${r2.endpoint}/${r2.bucket}/${key}`;
}

async function getFromR2(key) {
  const command = new GetObjectCommand({
    Bucket: r2.bucket,
    Key: key,
  });
  return s3.send(command);
}

module.exports = {
  uploadToR2,
  getFromR2,
};
