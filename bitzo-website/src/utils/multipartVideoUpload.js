import axios from "axios";

// Keep app-wide auth interceptors and cookies off Backblaze presigned requests.
const b2UploadClient = axios.create({ withCredentials: false });

const getUploadSessionKey = (channelId, file, replaceVideoId) =>
  `video-upload:${channelId}:${replaceVideoId || "new"}:${file.name}:${file.size}:${file.lastModified}`;

const getLegacyUploadSessionKey = (file) =>
  `video-upload:${file.name}:${file.size}:${file.lastModified}`;

const VIDEO_CONTENT_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
]);
const VIDEO_CONTENT_TYPES_BY_EXTENSION = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".webm": "video/webm",
};

const getContentType = (file) => {
  const contentType = file.type?.toLowerCase();
  if (VIDEO_CONTENT_TYPES.has(contentType)) return contentType;

  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return VIDEO_CONTENT_TYPES_BY_EXTENSION[extension] || "";
};

async function putPartWithRetry({
  api,
  channelId,
  videoId,
  partNumber,
  part,
  token,
  onProgress,
}) {
  const { data } = await axios.post(
    `${api}/uservideo/upload/${channelId}/multipart/${videoId}/part`,
    { partNumber },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!data?.url) {
    throw new Error("The server did not return a video part upload URL.");
  }

  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await b2UploadClient.put(data.url, part, {
        headers: { "Content-Type": "application/octet-stream" },
        onUploadProgress: (event) => onProgress(event.loaded),
      });
      onProgress(part.size);
      return;
    } catch (error) {
      lastError = error;
      onProgress(0);
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
      }
    }
  }
  throw lastError;
}

export async function uploadVideoMultipart({
  api,
  channelId,
  token,
  file,
  metadata,
  thumbnail,
  replaceVideoId,
  onProgress = () => {},
}) {
  const contentType = getContentType(file);
  if (!contentType) {
    throw new Error("Choose a supported MP4, MOV, M4V, or WebM video.");
  }

  const headers = { Authorization: `Bearer ${token}` };
  const sessionKey = getUploadSessionKey(channelId, file, replaceVideoId);
  const legacySessionKey = getLegacyUploadSessionKey(file);
  let session = null;
  let completedParts = [];
  let savedSessionKey = sessionKey;
  let savedSession = localStorage.getItem(sessionKey);

  if (!replaceVideoId && !savedSession && legacySessionKey !== sessionKey) {
    savedSession = localStorage.getItem(legacySessionKey);
    if (savedSession) savedSessionKey = legacySessionKey;
  }

  if (savedSession) {
    let parsedSession;
    try {
      parsedSession = JSON.parse(savedSession);
    } catch {
      localStorage.removeItem(savedSessionKey);
    }

    if (parsedSession?.channelId === channelId && parsedSession.videoId) {
      try {
        const { data } = await axios.get(
          `${api}/uservideo/upload/${channelId}/multipart/${parsedSession.videoId}`,
          { headers },
        );
        if (data.found === false || data.processingStatus === "missing") {
          localStorage.removeItem(savedSessionKey);
        } else if (data.processingStatus === "uploading") {
          session = data;
          completedParts = data.parts || [];
        } else if (
          ["queued", "processing", "ready"].includes(data.processingStatus)
        ) {
          localStorage.removeItem(savedSessionKey);
          onProgress(100);
          return data;
        } else {
          localStorage.removeItem(savedSessionKey);
        }
      } catch (error) {
        if (error.response?.status !== 404) throw error;
        localStorage.removeItem(savedSessionKey);
      }
    } else {
      localStorage.removeItem(savedSessionKey);
    }
  }

  if (!session) {
    const { data } = await axios.post(
      `${api}/uservideo/upload/${channelId}/multipart/initiate`,
      {
        ...metadata,
        ...(replaceVideoId ? { replaceVideoId } : {}),
        fileName: file.name,
        contentType,
        fileSize: file.size,
        thumbnailName: thumbnail?.name,
        thumbnailContentType: thumbnail?.type,
        thumbnailSize: thumbnail?.size,
      },
      { headers },
    );
    session = data;
    savedSessionKey = sessionKey;
    localStorage.setItem(
      sessionKey,
      JSON.stringify({ channelId, videoId: data.videoId }),
    );
  }

  if (thumbnail && session.thumbnailUploadUrl) {
    try {
      await b2UploadClient.put(session.thumbnailUploadUrl, thumbnail, {
        headers: { "Content-Type": thumbnail.type },
      });
    } catch (error) {
      console.warn(
        "Custom thumbnail upload failed; the video processor will generate one.",
        error,
      );
    }
  }

  const partSize = Number(session.partSize);
  if (!Number.isSafeInteger(partSize) || partSize <= 0) {
    throw new Error("The server returned an invalid multipart upload size.");
  }
  const partsCount = Math.ceil(file.size / partSize);
  const uploadedParts = new Set(completedParts.map((part) => part.partNumber));
  const uploadedBytes = new Map(
    completedParts.map((part) => [part.partNumber, part.size]),
  );
  const updateUploadProgress = (partNumber, bytes) => {
    const partLength = Math.min(
      partSize,
      file.size - (partNumber - 1) * partSize,
    );
    uploadedBytes.set(
      partNumber,
      Math.max(0, Math.min(partLength, Number(bytes) || 0)),
    );
    const completeBytes = [...uploadedBytes.values()].reduce(
      (sum, current) => sum + current,
      0,
    );
    onProgress(Math.min(99, Math.floor((completeBytes / file.size) * 100)));
  };

  let nextPartNumber = 1;
  const uploadPartWorker = async () => {
    while (nextPartNumber <= partsCount) {
      const partNumber = nextPartNumber++;
      if (uploadedParts.has(partNumber)) continue;
      const start = (partNumber - 1) * partSize;
      const part = file.slice(start, Math.min(start + partSize, file.size));
      await putPartWithRetry({
        api,
        channelId,
        videoId: session.videoId,
        partNumber,
        part,
        token,
        onProgress: (bytes) => updateUploadProgress(partNumber, bytes),
      });
      uploadedParts.add(partNumber);
    }
  };

  const workers = Array.from(
    { length: Math.min(3, partsCount) },
    () => uploadPartWorker(),
  );
  const workerResults = await Promise.allSettled(workers);
  const failedWorker = workerResults.find(
    (result) => result.status === "rejected",
  );
  if (failedWorker) throw failedWorker.reason;

  const { data } = await axios.post(
    `${api}/uservideo/upload/${channelId}/multipart/${session.videoId}/complete`,
    {},
    { headers },
  );
  localStorage.removeItem(savedSessionKey);
  onProgress(100);
  return data;
}

export async function uploadVideoThumbnail({ api, token, videoId, file }) {
  const { data } = await axios.post(
    `${api}/adminvideo/thumbnail/${videoId}/presign`,
    { contentType: file.type, fileSize: file.size },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  await b2UploadClient.put(data.uploadUrl, file, {
    headers: { "Content-Type": file.type },
  });
  return {
    thumbnailKey: data.key,
    thumbnailContentType: data.contentType,
    thumbnailSize: data.fileSize,
  };
}
