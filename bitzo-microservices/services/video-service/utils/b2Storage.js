const { S3Client } = require("@aws-sdk/client-s3");

let client;
let sourceClient;

function getB2Config() {
  const bucket = process.env.B2_BUCKET_NAME?.trim();
  const sourceBucket = process.env.B2_SOURCE_BUCKET_NAME?.trim() || bucket;
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

  return {
    bucket,
    sourceBucket,
    accessKeyId,
    secretAccessKey,
    sourceAccessKeyId: process.env.B2_SOURCE_APPLICATION_KEY_ID?.trim(),
    sourceSecretAccessKey: process.env.B2_SOURCE_APPLICATION_KEY?.trim(),
    endpoint,
    region,
  };
}

function createB2Client(accessKeyId, secretAccessKey, config) {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function getB2Client() {
  if (client) return client;
  const config = getB2Config();
  client = createB2Client(
    config.accessKeyId,
    config.secretAccessKey,
    config,
  );
  return client;
}

function getB2SourceClient() {
  const config = getB2Config();
  if (config.sourceBucket === config.bucket) return getB2Client();
  if (!config.sourceAccessKeyId || !config.sourceSecretAccessKey) {
    throw new Error(
      "B2_SOURCE_APPLICATION_KEY_ID and B2_SOURCE_APPLICATION_KEY are required when using a separate private source bucket.",
    );
  }
  if (sourceClient) return sourceClient;
  sourceClient = createB2Client(
    config.sourceAccessKeyId,
    config.sourceSecretAccessKey,
    config,
  );
  return sourceClient;
}

function getVideoSourceBucket(video, config = getB2Config()) {
  return video.sourceBucket || config.bucket;
}

function getVideoSourceClient(video, config = getB2Config()) {
  return getVideoSourceBucket(video, config) === config.bucket
    ? getB2Client()
    : getB2SourceClient();
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

module.exports = {
  getB2Client,
  getB2Config,
  getPublicUrl,
  getB2SourceClient,
  getVideoSourceBucket,
  getVideoSourceClient,
};
