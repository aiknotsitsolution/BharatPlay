const { UploadPartCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const envKeys = [
  "B2_BUCKET_NAME",
  "B2_APPLICATION_KEY_ID",
  "B2_APPLICATION_KEY",
  "B2_S3_ENDPOINT",
  "B2_REGION",
  "B2_SOURCE_BUCKET_NAME",
  "B2_SOURCE_APPLICATION_KEY_ID",
  "B2_SOURCE_APPLICATION_KEY",
];
const originalEnv = Object.fromEntries(
  envKeys.map((key) => [key, process.env[key]]),
);

describe("B2 multipart part URL signing", () => {
  let b2Client;

  beforeAll(() => {
    process.env.B2_BUCKET_NAME = "test-bucket";
    process.env.B2_APPLICATION_KEY_ID = "test-key";
    process.env.B2_APPLICATION_KEY = "test-secret";
    process.env.B2_S3_ENDPOINT = "https://s3.us-east-005.backblazeb2.com";
    process.env.B2_REGION = "us-east-005";
    delete process.env.B2_SOURCE_BUCKET_NAME;
    delete process.env.B2_SOURCE_APPLICATION_KEY_ID;
    delete process.env.B2_SOURCE_APPLICATION_KEY;
    b2Client = require("../utils/b2Storage").getB2SourceClient();
  });

  afterAll(() => {
    b2Client.destroy();
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  test("does not sign an empty CRC checksum for a browser-uploaded part", async () => {
    const url = await getSignedUrl(
      b2Client,
      new UploadPartCommand({
        Bucket: "test-bucket",
        Key: "Video/test/source.mp4",
        UploadId: "test-upload",
        PartNumber: 1,
      }),
      { expiresIn: 900 },
    );

    const searchParams = new URL(url).searchParams;
    expect(searchParams.has("x-amz-checksum-crc32")).toBe(false);
    expect(searchParams.has("x-amz-sdk-checksum-algorithm")).toBe(false);
    expect(searchParams.get("partNumber")).toBe("1");
  });
});
