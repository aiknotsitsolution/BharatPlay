const { S3Client } = require("@aws-sdk/client-s3");

let client;

function getB2Config() {
  const bucket = process.env.B2_BUCKET_NAME?.trim();
  const accessKeyId = process.env.B2_APPLICATION_KEY_ID?.trim();
  const secretAccessKey = process.env.B2_APPLICATION_KEY?.trim();
  const endpoint =
    process.env.B2_S3_ENDPOINT?.trim() ||
    process.env.B2_ENDPOINT?.trim() ||
    "https://s3.us-east-005.backblazeb2.com";

  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "B2_BUCKET_NAME, B2_APPLICATION_KEY_ID, and B2_APPLICATION_KEY are required.",
    );
  }

  const region =
    process.env.B2_REGION?.trim() ||
    new URL(endpoint).hostname.match(/^s3[.-]([a-z0-9-]+)\.backblazeb2\.com$/i)?.[1] ||
    "us-east-005";

  return { bucket, accessKeyId, secretAccessKey, endpoint, region };
}

function getB2Client() {
  if (client) return client;
  const config = getB2Config();
  client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return client;
}

function getPublicUrl(key) {
  const { bucket, region } = getB2Config();
  const baseUrl =
    process.env.B2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "") ||
    `https://f${region.slice(-3)}.backblazeb2.com/file/${encodeURIComponent(bucket)}`;
  return `${baseUrl}/${key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

module.exports = { getB2Client, getB2Config, getPublicUrl };
