jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn((configuration) => ({ configuration })),
}));

const envKeys = [
  "B2_BUCKET_NAME",
  "B2_SOURCE_BUCKET_NAME",
  "B2_APPLICATION_KEY_ID",
  "B2_APPLICATION_KEY",
  "B2_SOURCE_APPLICATION_KEY_ID",
  "B2_SOURCE_APPLICATION_KEY",
];
const originalEnv = Object.fromEntries(
  envKeys.map((key) => [key, process.env[key]]),
);

describe("B2 source and delivery bucket configuration", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.B2_BUCKET_NAME = "delivery";
    process.env.B2_APPLICATION_KEY_ID = "delivery-key";
    process.env.B2_APPLICATION_KEY = "delivery-secret";
    delete process.env.B2_SOURCE_BUCKET_NAME;
    delete process.env.B2_SOURCE_APPLICATION_KEY_ID;
    delete process.env.B2_SOURCE_APPLICATION_KEY;
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  test("reuses delivery credentials when source and delivery buckets match", () => {
    process.env.B2_SOURCE_BUCKET_NAME = "delivery";
    const { getB2Client, getB2SourceClient } = require("../utils/b2Storage");

    expect(getB2SourceClient()).toBe(getB2Client());
    expect(getB2Client().configuration.requestChecksumCalculation).toBe(
      "WHEN_REQUIRED",
    );
  });

  test("requires source-scoped credentials for a separate source bucket", () => {
    process.env.B2_SOURCE_BUCKET_NAME = "private-source";
    const { getB2SourceClient } = require("../utils/b2Storage");

    expect(() => getB2SourceClient()).toThrow(
      "B2_SOURCE_APPLICATION_KEY_ID and B2_SOURCE_APPLICATION_KEY are required",
    );
  });

  test("creates a distinct source client with source-scoped credentials", () => {
    process.env.B2_SOURCE_BUCKET_NAME = "private-source";
    process.env.B2_SOURCE_APPLICATION_KEY_ID = "source-key";
    process.env.B2_SOURCE_APPLICATION_KEY = "source-secret";
    const { getB2Client, getB2SourceClient } = require("../utils/b2Storage");

    const deliveryClient = getB2Client();
    const sourceClient = getB2SourceClient();

    expect(sourceClient).not.toBe(deliveryClient);
    expect(sourceClient.configuration.credentials).toEqual({
      accessKeyId: "source-key",
      secretAccessKey: "source-secret",
    });
  });
});
