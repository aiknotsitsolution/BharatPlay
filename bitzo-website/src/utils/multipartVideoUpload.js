import axios from "axios";

const getUploadSessionKey = (channelId, file) =>
  `video-upload:${channelId}:${file.name}:${file.size}:${file.lastModified}`;

const getLegacyUploadSessionKey = (file) =>
  `video-upload:${file.name}:${file.size}:${file.lastModified}`;

const getContentType = (file) =>
  file.type ||
  ({
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".m4v": "video/x-m4v",
    ".webm": "video/webm",
  }[file.name.slice(file.name.lastIndexOf(".")).toLowerCase()] || "");

async function putPartWithRetry({
  api,
  channelId,
  videoId,
  partNumber,
  part,
  token,
  onProgress,
}) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const { data } = await axios.post(
        `${api}/uservideo/upload/${channelId}/multipart/${videoId}/part`,
        { partNumber },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const response = await axios.put(data.url, part, {
        headers: { "Content-Type": "application/octet-stream" },
        onUploadProgress: (event) => onProgress(event.loaded),
      });
      const etag = response.headers.etag || response.headers.ETag;
      if (!etag) {
        throw new Error(
          "B2 did not expose the ETag response header. Enable ETag in the bucket CORS settings.",
        );
      }
      onProgress(part.size);
      return etag;
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
  onProgress = () => {},
}) {
  const headers = { Authorization: `Bearer ${token}` };
  const sessionKey = getUploadSessionKey(channelId, file);
  const legacySessionKey = getLegacyUploadSessionKey(file);
  let session = null;
  let completedParts = [];
  let savedSessionKey = sessionKey;
  let savedSession = localStorage.getItem(sessionKey);

  if (!savedSession && legacySessionKey !== sessionKey) {
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
        if (data.processingStatus === "uploading") {
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
        fileName: file.name,
        contentType: getContentType(file),
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
      await axios.put(session.thumbnailUploadUrl, thumbnail, {
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
  const uploadedParts = new Map(
    completedParts.map((part) => [part.partNumber, part]),
  );
  const uploadedBytes = new Map(
    completedParts.map((part) => [part.partNumber, part.size]),
  );
  const updateUploadProgress = (partNumber, bytes) => {
    uploadedBytes.set(partNumber, bytes);
    const completeBytes = [...uploadedBytes.values()].reduce(
      (sum, current) => sum + current,
      0,
    );
    onProgress(Math.min(99, Math.round((completeBytes / file.size) * 99)));
  };

  let nextPartNumber = 1;
  const uploadPartWorker = async () => {
    while (nextPartNumber <= partsCount) {
      const partNumber = nextPartNumber++;
      if (uploadedParts.has(partNumber)) continue;
      const start = (partNumber - 1) * partSize;
      const part = file.slice(start, Math.min(start + partSize, file.size));
      const etag = await putPartWithRetry({
        api,
        channelId,
        videoId: session.videoId,
        partNumber,
        part,
        token,
        onProgress: (bytes) => updateUploadProgress(partNumber, bytes),
      });
      uploadedParts.set(partNumber, {
        partNumber,
        etag,
        size: part.size,
      });
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
