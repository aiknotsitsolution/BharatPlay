


const multer = require("multer");
const axios = require("axios");
const crypto = require("crypto");

const getB2Config = () => ({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID?.trim(),
  applicationKey: process.env.B2_APPLICATION_KEY?.trim(),
  bucketId: process.env.B2_BUCKET_ID?.trim(),
  bucketName: process.env.B2_BUCKET_NAME?.trim(),
});

const logB2Config = () => {
  const cfg = getB2Config();

  console.log("========== B2 CONFIG ==========");
  console.log({
    keyId: cfg.applicationKeyId
      ? `${cfg.applicationKeyId.substring(0, 8)}...`
      : "MISSING",
    keyExists: Boolean(cfg.applicationKey),
    keyLength: cfg.applicationKey?.length || 0,
    bucketId: cfg.bucketId || "MISSING",
    bucketName: cfg.bucketName || "MISSING",
  });
  console.log("===============================");
};

logB2Config();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (
      file.fieldname === "video" &&
      file.mimetype?.startsWith("video/")
    ) {
      return cb(null, true);
    }

    if (
      file.fieldname === "thumbnail" &&
      file.mimetype?.startsWith("image/")
    ) {
      return cb(null, true);
    }

    cb(new Error(`Invalid file type: ${file.mimetype}`), false);
  },
});

/**
 * Authenticate with Backblaze B2
 */
const authorizeB2 = async () => {
  const cfg = getB2Config();

  if (!cfg.applicationKeyId || !cfg.applicationKey) {
    throw new Error(
      "B2_APPLICATION_KEY_ID or B2_APPLICATION_KEY is missing"
    );
  }

  const credentials = `${cfg.applicationKeyId}:${cfg.applicationKey}`;
  const authHeader = Buffer.from(credentials).toString("base64");

  try {
    const response = await axios.get(
      "https://api.backblazeb2.com/b2api/v4/b2_authorize_account",
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
        },
        timeout: 30000,
      }
    );

    const data = response.data;

    // Backblaze B2 API v4
    const storageApi = data.apiInfo?.storageApi;

    console.log("========== B2 AUTH SUCCESS ==========");

    console.log({
      accountId: data.accountId,
      apiUrl: storageApi?.apiUrl,
      downloadUrl: storageApi?.downloadUrl,
    });

    if (!storageApi?.apiUrl) {
      throw new Error(
        "Backblaze API URL missing from authorization response"
      );
    }

    return {
      accountId: data.accountId,
      authorizationToken: data.authorizationToken,
      apiUrl: storageApi.apiUrl,
      downloadUrl: storageApi.downloadUrl,
    };

  } catch (error) {
    console.error("========== B2 AUTH ERROR ==========");

    console.error({
      status: error.response?.status,
      code: error.response?.data?.code,
      message: error.response?.data?.message,
      statusText: error.response?.statusText,
    });

    throw new Error(
      `Backblaze authentication failed: ${
        error.response?.data?.code || error.message
      }`
    );
  }
};

/**
 * Get upload URL
 */
const getUploadUrl = async (apiUrl, authorizationToken, bucketId) => {
  if (!apiUrl) {
    throw new Error("B2 API URL is missing");
  }

  if (!authorizationToken) {
    throw new Error("B2 authorization token is missing");
  }

  if (!bucketId) {
    throw new Error("B2_BUCKET_ID is missing");
  }

  try {
    const response = await axios.post(
      `${apiUrl}/b2api/v4/b2_get_upload_url`,
      {
        bucketId,
      },
      {
        headers: {
          Authorization: authorizationToken,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log("========== B2 UPLOAD URL SUCCESS ==========");

    console.log({
      bucketId: response.data.bucketId,
      uploadUrlExists: Boolean(response.data.uploadUrl),
      uploadTokenExists: Boolean(response.data.authorizationToken),
    });

    return response.data;

  } catch (error) {
    console.error("========== B2 GET UPLOAD URL ERROR ==========");

    console.error({
      status: error.response?.status,
      code: error.response?.data?.code,
      message: error.response?.data?.message,
      data: error.response?.data,
    });

    throw error;
  }
};

/**
 * Upload file buffer to B2
 */
const uploadBufferToB2 = async (file, folderName) => {
  const cfg = getB2Config();

  if (!cfg.bucketId) {
    throw new Error("B2_BUCKET_ID is missing");
  }

  if (!cfg.bucketName) {
    throw new Error("B2_BUCKET_NAME is missing");
  }

  // 1. Authenticate
  const authData = await authorizeB2();

  // 2. Get upload URL
  const uploadUrlData = await getUploadUrl(
  authData.apiUrl,
  authData.authorizationToken,
  cfg.bucketId
);

  const safeName = file.originalname
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");

  const fileName = `${folderName}/${Date.now()}-${safeName}`;

  // SHA1
  const sha1Hash = crypto
    .createHash("sha1")
    .update(file.buffer)
    .digest("hex");

  try {
    const response = await axios.post(
      uploadUrlData.uploadUrl,
      file.buffer,
      {
        headers: {
          Authorization: uploadUrlData.authorizationToken,

          "X-Bz-File-Name": encodeURIComponent(fileName),

          "Content-Type":
            file.mimetype || "b2/x-auto",

          "Content-Length": file.buffer.length,

          "X-Bz-Content-Sha1": sha1Hash,
        },

        maxBodyLength: Infinity,
        maxContentLength: Infinity,

        timeout: 10 * 60 * 1000,
      }
    );

    console.log("========== B2 FILE UPLOAD SUCCESS ==========");

    console.log({
      fileName,
      fileId: response.data.fileId,
      contentType: response.data.contentType,
      contentLength: response.data.contentLength,
    });

    /**
     * Public URL
     *
     * This requires the bucket to be public.
     */
    const publicUrl =
  `${authData.downloadUrl}/file/` +
  `${encodeURIComponent(cfg.bucketName)}/` +
  `${fileName
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

    return {
      fileName,
      url: publicUrl,
      mimeType: file.mimetype,
      size: file.size,
      fileId: response.data.fileId,
    };
  } catch (error) {
    console.error("========== B2 FILE UPLOAD ERROR ==========");

    console.error({
      status: error.response?.status,
      code: error.response?.data?.code,
      message: error.response?.data?.message,
      data: error.response?.data,
    });

    throw error;
  }
};

/**
 * Middleware
 */
const uploadToBackblaze = [
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),

  async (req, res, next) => {
    try {
      if (!req.files?.video?.[0]) {
        return res.status(400).json({
          success: false,
          message: "Video file is required",
        });
      }

      const cfg = getB2Config();

      if (
        !cfg.applicationKeyId ||
        !cfg.applicationKey ||
        !cfg.bucketId ||
        !cfg.bucketName
      ) {
        return res.status(500).json({
          success: false,
          message: "Backblaze B2 configuration is incomplete",
        });
      }

      /**
       * VIDEO
       */
      const videoFile = req.files.video[0];

      const uploadedVideo = await uploadBufferToB2(
        videoFile,
        "Video"
      );

      req.uploadedVideo = {
        url: uploadedVideo.url,
        fileName: uploadedVideo.fileName,
        mimeType: uploadedVideo.mimeType,
        size: uploadedVideo.size,
      };

      /**
       * THUMBNAIL
       */
      if (req.files.thumbnail?.[0]) {
        const thumbnailFile = req.files.thumbnail[0];

        const uploadedThumbnail = await uploadBufferToB2(
          thumbnailFile,
          "Video/thumbnails"
        );

        req.uploadedVideo.thumbnailUrl =
          uploadedThumbnail.url;

        req.uploadedVideo.thumbnail = {
          originalname: thumbnailFile.originalname,
          mimetype: thumbnailFile.mimetype,
          size: thumbnailFile.size,
          url: uploadedThumbnail.url,
        };
      }

      next();
    } catch (error) {
      console.error("========== BACKBLAZE MIDDLEWARE ERROR ==========");

      console.error({
        message: error.message,
        code: error.response?.data?.code,
        status: error.response?.status,
      });

      return res.status(500).json({
        success: false,
        message: "Backblaze upload failed",
        error:
          error.response?.data?.message ||
          error.message ||
          "Unknown Backblaze error",
      });
    }
  },
];

module.exports = uploadToBackblaze;