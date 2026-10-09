import { useCallback, useEffect, useRef, useState } from "react";
import {
  getAdminUploads,
  fetchCopyrightCases,
  fetchAdminUsers,
} from "../api";
import { Video, Clapperboard, Shield, UserPlus } from "lucide-react";

/**
 * Shared notification feed used by BOTH the bell panel (Header) and the
 * full /notifications page — one source of truth for items + unread state.
 * "Read" state lives in localStorage (bp-notif-seen) and syncs across every
 * mounted instance through the `bp-notif-seen` window event.
 */
const SEEN_KEY = "bp-notif-seen";
const SEEN_EVENT = "bp-notif-seen";
const DISMISS_KEY = "bp-notif-dismissed";
const DISMISS_EVENT = "bp-notif-dismissed";

const readDismissed = () => {
  try {
    const v = JSON.parse(localStorage.getItem(DISMISS_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const writeDismissed = (ids) => {
  try {
    // keep the list bounded — only the newest 200 removals are remembered
    localStorage.setItem(DISMISS_KEY, JSON.stringify(ids.slice(-200)));
  } catch (_) {}
};

const fire = (name) => {
  try {
    window.dispatchEvent(new Event(name));
  } catch (_) {}
};

export function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  if (diff < 0) return "Just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(t).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fullDate(dateStr) {
  if (!dateStr) return "";
  const t = new Date(dateStr);
  if (Number.isNaN(t.getTime())) return "";
  return t.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const kindStyle = {
  video: { icon: Video, bg: "bg-bp-blue/12", text: "text-bp-blue" },
  short: { icon: Clapperboard, bg: "bg-bp-cyan/12", text: "text-bp-cyan" },
  case: { icon: Shield, bg: "bg-bp-yellow/12", text: "text-bp-yellow" },
  user: { icon: UserPlus, bg: "bg-emerald-500/12", text: "text-emerald-600" },
};

const asArray = (res) => {
  const d = res?.data?.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
};

const isLongVideo = (row) =>
  Array.isArray(row.videoType)
    ? row.videoType.includes("long")
    : row.videoType === "long";

export default function useNotifications({ limit = 20, pollMs = 0 } = {}) {
  const [rawItems, setRawItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seenAt, setSeenAt] = useState(() => {
    try {
      return Number(localStorage.getItem(SEEN_KEY) || 0);
    } catch {
      return 0;
    }
  });
  // ids the user cleared (individually or via "clear all") — hidden everywhere
  const [dismissed, setDismissed] = useState(readDismissed);
  // notifications that arrived AFTER the first load — these pop as toasts
  const [incoming, setIncoming] = useState([]);
  const knownIdsRef = useRef(null); // null → first load not done yet
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // keep every mounted instance (bell badge + panel + page) in sync
  useEffect(() => {
    const syncSeen = () => {
      try {
        setSeenAt(Number(localStorage.getItem(SEEN_KEY) || 0));
      } catch (_) {}
    };
    const syncDismissed = () => setDismissed(readDismissed());
    window.addEventListener(SEEN_EVENT, syncSeen);
    window.addEventListener(DISMISS_EVENT, syncDismissed);
    return () => {
      window.removeEventListener(SEEN_EVENT, syncSeen);
      window.removeEventListener(DISMISS_EVENT, syncDismissed);
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [uploadsRes, casesRes, usersRes] = await Promise.all([
      getAdminUploads({ page: 1, limit: 5 }).catch(() => null),
      fetchCopyrightCases({ page: 1, limit: 5 }).catch(() => null),
      fetchAdminUsers({ page: 1, limit: 5 }).catch(() => null),
    ]);
    if (!mountedRef.current) return;

    const feed = [];

    asArray(uploadsRes).forEach((v) => {
      if (!v?.createdAt) return;
      const long = isLongVideo(v);
      feed.push({
        id: `video-${v._id}`,
        kind: long ? "video" : "short",
        title: v.title || "Untitled",
        sub: `${long ? "New video" : "New short"} by ${
          v.uploadedBy?.name || "Unknown"
        }`,
        date: v.createdAt,
        link: "/uploads",
      });
    });

    asArray(casesRes).forEach((c) => {
      if (!c?.createdAt) return;
      feed.push({
        id: `case-${c._id}`,
        kind: "case",
        title: `Case ${c.caseNumber || ""}`.trim(),
        sub: `${c.claimant?.name || "Someone"} filed against "${
          c.content?.title || "Untitled"
        }"`,
        date: c.createdAt,
        link: c._id ? `/copyright/cases/${c._id}` : "/copyright/cases",
      });
    });

    asArray(usersRes).forEach((u) => {
      if (!u?.createdAt) return;
      feed.push({
        id: `user-${u._id}`,
        kind: "user",
        title: u.name || "New user",
        sub: `Joined${u.email ? ` • ${u.email}` : ""}`,
        date: u.createdAt,
        link: u._id ? `/users/${u._id}` : "/alluser",
      });
    });

    feed.sort((a, b) => new Date(b.date) - new Date(a.date));

    // toast-worthy arrivals: only items that showed up AFTER the first load
    const ids = feed.map((i) => i.id);
    if (knownIdsRef.current === null) {
      knownIdsRef.current = new Set(ids); // seed — never toast existing items
    } else {
      const fresh = feed.filter((i) => !knownIdsRef.current.has(i.id));
      ids.forEach((id) => knownIdsRef.current.add(id));
      if (fresh.length) setIncoming((prev) => [...prev, ...fresh]);
    }

    setRawItems(feed.slice(0, limit));
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  // background polling — how new arrivals get detected for the push toasts
  useEffect(() => {
    if (!pollMs || pollMs < 1000) return;
    const timer = setInterval(load, pollMs);
    return () => clearInterval(timer);
  }, [pollMs, load]);

  const dismissedSet = new Set(dismissed);
  // items the user still sees (cleared ones are filtered out)
  const items = rawItems.filter((i) => !dismissedSet.has(i.id));

  const unreadCount = items.filter(
    (i) => new Date(i.date).getTime() > seenAt
  ).length;

  const markAllRead = () => {
    const now = Date.now();
    try {
      localStorage.setItem(SEEN_KEY, String(now));
    } catch (_) {}
    setSeenAt(now);
    fire(SEEN_EVENT);
  };

  // ---- clearing -------------------------------------------------------
  const persistDismissed = (next) => {
    setDismissed(next);
    writeDismissed(next);
    fire(DISMISS_EVENT);
  };

  /** remove ONE notification (panel + page + badge, everywhere) */
  const dismiss = (id) => {
    if (dismissedSet.has(id)) return;
    persistDismissed([...dismissed, id]);
  };

  /** remove EVERY notification currently in the feed */
  const clearAll = () => {
    const next = [...dismissed];
    rawItems.forEach((i) => {
      if (!next.includes(i.id)) next.push(i.id);
    });
    persistDismissed(next);
  };

  /** bring everything back */
  const restoreAll = () => persistDismissed([]);

  /** drop a toast from the incoming queue (shown, dismissed or clicked) */
  const clearIncoming = (id) =>
    setIncoming((prev) => prev.filter((i) => i.id !== id));

  return {
    items,
    loading,
    seenAt,
    unreadCount,
    dismissedCount: rawItems.length - items.length,
    dismissed,
    incoming,
    clearIncoming,
    markAllRead,
    dismiss,
    clearAll,
    restoreAll,
    reload: load,
  };
}
