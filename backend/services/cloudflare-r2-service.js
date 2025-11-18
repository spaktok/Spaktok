const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

const {
  CLOUDFLARE_R2_ACCESS_KEY_ID,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  CLOUDFLARE_R2_ACCOUNT_ID,
  CLOUDFLARE_R2_BUCKET,
  CLOUDFLARE_R2_ENDPOINT,
} = process.env;

const endpoint = CLOUDFLARE_R2_ENDPOINT || (CLOUDFLARE_R2_ACCOUNT_ID ? `https://${CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '');

const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials:
    CLOUDFLARE_R2_ACCESS_KEY_ID && CLOUDFLARE_R2_SECRET_ACCESS_KEY
      ? {
          accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
          secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        }
      : undefined,
});

const bucket = CLOUDFLARE_R2_BUCKET || '';

async function uploadObject({ key, body, contentType }) {
  if (!bucket) throw new Error('CLOUDFLARE_R2_BUCKET not configured');
  if (!endpoint) throw new Error('CLOUDFLARE_R2_ENDPOINT or ACCOUNT_ID not configured');
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return { key, url: `${endpoint}/${bucket}/${encodeURIComponent(key)}` };
}

async function getObjectStream({ key }) {
  if (!bucket) throw new Error('CLOUDFLARE_R2_BUCKET not configured');
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return res.Body; // Readable stream
}

module.exports = { uploadObject, getObjectStream };
