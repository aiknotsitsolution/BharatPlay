import { API_USERVIDEO as API_BASE } from "../config/api";

const FLUSH_INTERVAL_MS = 30000;
const MAX_CAP_SECONDS = 12 * 60 * 60;

const sessions = new WeakMap();
const dirtySessions = new Set();
let globalTimer = null;

const resolveUserId = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?._id || parsed?.id || null;
  } catch {
    return null;
  }
};

const getAuthHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const postJson = (videoId, payload) => {
  try {
    fetch(`${API_BASE}/${videoId}/view`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    // ignore
  }
};

const postBeacon = (videoId, payload) => {
  try {
    const body = new Blob([JSON.stringify(payload)], {
      type: "application/json",
    });
    navigator.sendBeacon(`${API_BASE}/${videoId}/view`, body);
  } catch {
    // ignore
  }
};

const flushAllSessions = (useBeacon) => {
  for (const session of [...dirtySessions]) {
    session.flush(false, useBeacon);
  }
};

const ensureGlobalTimer = () => {
  if (globalTimer) return;
  globalTimer = setInterval(() => flushAllSessions(false), FLUSH_INTERVAL_MS);
};

const createSession = (videoEl, { id, videoType = "long" }) => {
  const sessionId =
    typeof crypto?.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const seenSeconds = new Set();
  let duration = 0;
  let finalized = false;

  const buildPayload = (ended) => ({
    userId: resolveUserId(),
    duration,
    watchSeconds: Math.min(
      seenSeconds.size,
      Math.ceil(duration) || MAX_CAP_SECONDS,
      MAX_CAP_SECONDS,
    ),
    sessionId,
    ended,
  });

  const flush = (ended = false, useBeacon = false) => {
    if (finalized) return;
    if (!duration || seenSeconds.size === 0) return;

    if (ended) finalized = true;
    dirtySessions.delete(session);

    if (useBeacon) postBeacon(id, buildPayload(true));
    else postJson(id, buildPayload(ended));
  };

  const destroy = () => {
    if (!finalized) {
      finalized = true;
      dirtySessions.delete(session);
      if (duration && seenSeconds.size > 0) postBeacon(id, buildPayload(true));
    }
    cleanup();
  };

  const onTimeUpdate = () => {
    if (!Number.isFinite(videoEl.duration) || videoEl.duration <= 0) return;
    duration = videoEl.duration;
    const bucket = Math.floor(videoEl.currentTime);
    if (!Number.isFinite(bucket) || bucket < 0) return;
    if (videoEl.paused && bucket === 0) return;
    seenSeconds.add(bucket);
    dirtySessions.add(session);
    ensureGlobalTimer();
  };

  const onEnded = () => flush(true);

  videoEl.addEventListener("timeupdate", onTimeUpdate);
  videoEl.addEventListener("ended", onEnded);

  const cleanup = () => {
    videoEl.removeEventListener("timeupdate", onTimeUpdate);
    videoEl.removeEventListener("ended", onEnded);
  };

  const session = {
    videoId: id,
    videoType,
    sessionId,
    tick: onTimeUpdate,
    onEnded,
    flush,
    destroy,
  };

  return session;
};

const getWatchSession = (videoEl, options) => {
  if (!videoEl) return null;
  const existing = sessions.get(videoEl);
  if (existing && existing.videoId === options.id) return existing;
  if (existing) existing.destroy();
  const session = createSession(videoEl, options);
  sessions.set(videoEl, session);
  return session;
};

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => flushAllSessions(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushAllSessions(true);
  });
}

export { getWatchSession, flushAllSessions };
