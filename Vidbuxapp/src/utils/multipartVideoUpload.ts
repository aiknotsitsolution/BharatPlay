import { File, FileMode, Paths, UploadType } from "expo-file-system";
import { createVideoPlayer } from "expo-video";

type LocalAsset = {
  uri: string;
  name?: string;
  fileName?: string;
  mimeType?: string;
  size?: number | null;
  fileSize?: number | null;
};

type VideoUploadMetadata = {
  name: string;
  description: string;
  category: string;
  videoType: "short" | "long";
  duration: number;
  isCreativeCorner: boolean;
  hashtags: string;
};

type MultipartUploadOptions = {
  api: string;
  channelId: string;
  token: string;
  file: LocalAsset;
  metadata: VideoUploadMetadata;
  thumbnail?: LocalAsset | null;
  replaceVideoId?: string;
  onProgress?: (progress: number) => void;
};

const VIDEO_CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".webm": "video/webm",
};
const VIDEO_EXTENSIONS_BY_MIME: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/x-m4v": ".m4v",
  "video/m4v": ".m4v",
  "video/webm": ".webm",
};
const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024;

const parseResponse = async (response: Response) =>
  response.json().catch(() => ({}));

const getAssetName = (asset: LocalAsset) => {
  const uriName = asset.uri.split(/[\\/]/).pop()?.split("?")[0];
  const assetName = asset.name || asset.fileName || uriName || "video";
  const extension = assetName.match(/\.(mp4|mov|m4v|webm)$/i)?.[0];
  if (extension) return assetName;

  const mimeType = asset.mimeType?.toLowerCase().split(";")[0].trim();
  const mimeExtension = mimeType
    ? VIDEO_EXTENSIONS_BY_MIME[mimeType]
    : undefined;
  if (!mimeExtension) return assetName;

  const baseName = assetName.replace(/\.[^./\\]*$/, "") || "video";
  return `${baseName}${mimeExtension}`;
};

const getContentType = (asset: LocalAsset) => {
  const name = getAssetName(asset);
  const extension = name.slice(name.lastIndexOf(".")).toLowerCase();
  const declaredType = asset.mimeType || "";
  return Object.values(VIDEO_CONTENT_TYPES).includes(declaredType)
    ? declaredType
    : VIDEO_CONTENT_TYPES[extension] || "";
};

const getThumbnailContentType = (asset: LocalAsset) =>
  asset.mimeType || "image/jpeg";

const createCacheFile = (fileName: string, prefix: string) => {
  const extension = fileName.includes(".")
    ? fileName.slice(fileName.lastIndexOf("."))
    : "";
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return new File(Paths.cache, `${prefix}-${uniqueId}${extension}`);
};

export const readVideoDuration = (uri: string) =>
  new Promise<number>((resolve, reject) => {
    const player = createVideoPlayer(uri);

    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let sourceSubscription: { remove: () => void } | undefined;
    let statusSubscription: { remove: () => void } | undefined;
    const finish = (error?: Error, duration = 0) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      sourceSubscription?.remove();
      statusSubscription?.remove();
      player.release();
      if (error) reject(error);
      else resolve(duration);
    };

    sourceSubscription = player.addListener("sourceLoad", ({ duration }) => {
      const parsedDuration = Number(duration) || Number(player.duration) || 0;
      if (parsedDuration > 0) finish(undefined, parsedDuration);
      else finish(new Error("Could not read the video duration."));
    });
    statusSubscription = player.addListener("statusChange", (event) => {
      if (event.status === "error") {
        finish(
          new Error(event.error?.message || "Could not read the video duration."),
        );
      }
    });
    timeout = setTimeout(
      () => finish(new Error("Timed out while reading the video duration.")),
      20000,
    );
  });

const uploadPart = async ({
  api,
  channelId,
  token,
  videoId,
  partNumber,
  bytes,
}: {
  api: string;
  channelId: string;
  token: string;
  videoId: string;
  partNumber: number;
  bytes: Uint8Array;
}) => {
  const partFile = createCacheFile(`part-${partNumber}.bin`, "vidbux-part");
  let lastError: Error | undefined;

  try {
    await partFile.write(bytes);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const partUrlResponse = await fetch(
          `${api}/uservideo/upload/${channelId}/multipart/${videoId}/part`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ partNumber }),
          },
        );
        const partUrlData = await parseResponse(partUrlResponse);
        if (!partUrlResponse.ok || !partUrlData.url) {
          throw new Error(partUrlData.message || "Could not prepare video upload.");
        }

        const uploadResponse = await partFile.upload(partUrlData.url, {
          httpMethod: "PUT",
          uploadType: UploadType.BINARY_CONTENT,
          mimeType: "application/octet-stream",
        });
        if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
          throw new Error(`Video part ${partNumber} upload failed.`);
        }
        return;
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error("Video upload failed.");
        if (attempt < 3) {
          await new Promise((resolve) =>
            setTimeout(resolve, 500 * 2 ** attempt),
          );
        }
      }
    }
  } finally {
    try {
      if (partFile.exists) partFile.delete();
    } catch (cleanupError) {
      console.warn("Could not remove temporary video part:", cleanupError);
    }
  }

  throw lastError || new Error("Video upload failed.");
};

export const uploadVideoMultipart = async ({
  api,
  channelId,
  token,
  file: asset,
  metadata,
  thumbnail,
  replaceVideoId,
  onProgress = () => {},
}: MultipartUploadOptions) => {
  const file = new File(asset.uri);
  const fileName = getAssetName(asset);
  const contentType = getContentType(asset);
  const fileSize = Number(file.size) || Number(asset.size);
  if (!fileSize || !Number.isSafeInteger(fileSize)) {
    throw new Error("Could not read the selected video's file size.");
  }
  if (!VIDEO_CONTENT_TYPES[`.${fileName.split(".").pop()?.toLowerCase()}`]) {
    throw new Error("Use an MP4, MOV, M4V, or WebM video.");
  }
  if (!Object.values(VIDEO_CONTENT_TYPES).includes(contentType)) {
    throw new Error("The selected video format is not supported.");
  }

  let thumbnailSource: File | undefined;
  let thumbnailContentType = "";
  let thumbnailSize = 0;
  let thumbnailName = "";
  if (thumbnail) {
    thumbnailSource = new File(thumbnail.uri);
    thumbnailContentType = getThumbnailContentType(thumbnail);
    thumbnailSize = Number(thumbnailSource.size) || Number(thumbnail.size);
    thumbnailName = getAssetName(thumbnail);
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(thumbnailContentType)
    ) {
      throw new Error("Thumbnail must be a JPEG, PNG, or WebP image.");
    }
    if (
      !thumbnailSize ||
      !Number.isSafeInteger(thumbnailSize) ||
      thumbnailSize > MAX_THUMBNAIL_SIZE
    ) {
      throw new Error("Thumbnail must be smaller than 10 MB.");
    }
  }

  const initiateResponse = await fetch(
    `${api}/uservideo/upload/${channelId}/multipart/initiate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...metadata,
        ...(replaceVideoId ? { replaceVideoId } : {}),
        fileName,
        contentType,
        fileSize,
        ...(thumbnail
          ? {
              thumbnailName,
              thumbnailContentType,
              thumbnailSize,
            }
          : {}),
      }),
    },
  );
  const session = await parseResponse(initiateResponse);
  if (!initiateResponse.ok || !session.videoId) {
    throw new Error(session.message || "Could not start the video upload.");
  }

  let completed = false;
  let videoFileHandle: ReturnType<File["open"]> | null = null;
  let cachedVideoFile: File | undefined;
  let cachedThumbnailFile: File | undefined;
  try {
    cachedVideoFile = createCacheFile(fileName, "vidbux-video-upload");
    await file.copy(cachedVideoFile);
    videoFileHandle = cachedVideoFile.open(FileMode.ReadOnly);
    if (thumbnail && thumbnailSource) {
      if (!session.thumbnailUploadUrl) {
        throw new Error("The server did not prepare the thumbnail upload.");
      }
      cachedThumbnailFile = createCacheFile(thumbnailName, "vidbux-thumbnail-upload");
      await thumbnailSource.copy(cachedThumbnailFile);
      const thumbnailResponse = await cachedThumbnailFile.upload(
        session.thumbnailUploadUrl,
        {
          httpMethod: "PUT",
          uploadType: UploadType.BINARY_CONTENT,
          mimeType: thumbnailContentType,
        },
      );
      if (
        thumbnailResponse.status < 200 ||
        thumbnailResponse.status >= 300
      ) {
        throw new Error("Could not upload the selected thumbnail.");
      }
    }

    const partSize = Number(session.partSize);
    if (!Number.isSafeInteger(partSize) || partSize <= 0) {
      throw new Error("The server returned an invalid video upload size.");
    }
    const partsCount = Math.ceil(fileSize / partSize);
    let uploadedBytes = 0;

    for (let partNumber = 1; partNumber <= partsCount; partNumber += 1) {
      const start = (partNumber - 1) * partSize;
      const length = Math.min(partSize, fileSize - start);
      videoFileHandle.offset = start;
      const part = await videoFileHandle.readBytes(length);
      if (part.byteLength !== length) {
        throw new Error("Could not read the selected video file.");
      }

      await uploadPart({
        api,
        channelId,
        token,
        videoId: String(session.videoId),
        partNumber,
        bytes: part,
      });
      uploadedBytes += part.byteLength;
      onProgress(Math.min(99, Math.round((uploadedBytes / fileSize) * 99)));
    }

    const completeResponse = await fetch(
      `${api}/uservideo/upload/${channelId}/multipart/${session.videoId}/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );
    const result = await parseResponse(completeResponse);
    if (!completeResponse.ok || !result.success) {
      throw new Error(result.message || "Could not finish the video upload.");
    }

    completed = true;
    onProgress(100);
    return result;
  } catch (error) {
    if (!completed) {
      try {
        const abortResponse = await fetch(
          `${api}/uservideo/upload/${channelId}/multipart/${session.videoId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!abortResponse.ok) {
          console.warn(
            "Could not abort the incomplete video upload:",
            abortResponse.status,
          );
        }
      } catch (abortError) {
        console.warn("Could not abort the incomplete video upload:", abortError);
      }
    }
    throw error;
  } finally {
    videoFileHandle?.close();
    for (const cachedFile of [cachedVideoFile, cachedThumbnailFile]) {
      try {
        if (cachedFile?.exists) cachedFile.delete();
      } catch (cleanupError) {
        console.warn("Could not remove temporary upload file:", cleanupError);
      }
    }
  }
};
