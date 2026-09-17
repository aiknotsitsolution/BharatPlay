import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Video, Clapperboard, Shield, UserPlus, CheckCheck } from "lucide-react";
import { getAdminUploads, fetchCopyrightCases, fetchAdminUsers } from "../../api";

const SEEN_KEY = "bp-notif-seen";

function timeAgo(dateStr) {
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
  return new Date(t).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fullDate(dateStr) {
  if (!dateStr) return "";
  const t = new Date(dateStr);
  if (Number.isNaN(t.getTime())) return "";
  return t.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const asArray = (res) => {
  const d = res?.data?.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
};

const isLongVideo = (row) =>
  Array.isArray(row.videoType) ? row.videoType.includes("long") : row.videoType === "long";

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seenAt, setSeenAt] = useState(() => {
    try {
      return Number(localStorage.getItem(SEEN_KEY) || 0);
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const [uploadsRes, casesRes, usersRes] = await Promise.all([
        getAdminUploads({ page: 1, limit: 5 }).catch(() => null),
        fetchCopyrightCases({ page: 1, limit: 5 }).catch(() => null),
        fetchAdminUsers({ page: 1, limit: 5 }).catch(() => null),
      ]);
      if (cancelled) return;

      const feed = [];

      asArray(uploadsRes).forEach((v) => {
        if (!v?.createdAt) return;
        const long = isLongVideo(v);
        feed.push({
          id: `video-${v._id}`,
          kind: long ? "video" : "short",
          title: v.title || "Untitled",
          sub: `${long ? "New video" : "New short"} by ${v.uploadedBy?.name || "Unknown"}`,
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
          sub: `${c.claimant?.name || "Someone"} filed against "${c.content?.title || "Untitled"}"`,
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
      setItems(feed.slice(0, 15));
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const newCount = items.filter((i) => new Date(i.date).getTime() > seenAt).length;

  const markAllRead = () => {
    const now = Date.now();
    try {
      localStorage.setItem(SEEN_KEY, String(now));
    } catch (_) {}
    setSeenAt(now);
  };

  const kindStyle = {
    video: { icon: Video, bg: "bg-bp-blue/12", text: "text-bp-blue" },
    short: { icon: Clapperboard, bg: "bg-bp-cyan/12", text: "text-bp-cyan" },
    case: { icon: Shield, bg: "bg-bp-yellow/12", text: "text-bp-yellow" },
    user: { icon: UserPlus, bg: "bg-emerald-500/12", text: "text-emerald-600" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bp-text">Notifications</h1>
          <p className="text-[13px] text-bp-text-secondary mt-1">
            {loading ? "Checking for updates..." : newCount > 0 ? `${newCount} new update${newCount !== 1 ? "s" : ""}` : "You're all caught up"}
          </p>
        </div>
        {!loading && items.length > 0 && newCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-bp-text-secondary bg-bp-elevated border border-bp-border hover:bg-bp-elevated/80 hover:text-bp-text hover:border-bp-border/80 transition-all duration-200 self-start sm:self-auto"
          >
            <CheckCheck size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      <div className="bp-card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-bp-surface/40 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-bp-elevated shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 rounded bg-bp-elevated" />
                  <div className="h-3 w-1/3 rounded bg-bp-elevated" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center text-center px-6 py-16">
            <div className="relative mb-5">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.12), rgba(129,140,248,0.08))", border: "2px solid rgba(79,70,229,0.28)" }}
              >
                <Bell size={30} className="text-bp-blue" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-bp-text">No new notifications</h2>
            <p className="text-sm text-bp-text-muted mt-1 max-w-sm">
              You&apos;re all caught up. New alerts about videos, users and
              copyright activity will appear here.
            </p>
          </div>
        ) : (
          <div className="p-2">
            {items.map((item) => {
              const style = kindStyle[item.kind] || kindStyle.video;
              const Icon = style.icon;
              const isNew = new Date(item.date).getTime() > seenAt;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.link)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-bp-surface/60 transition-colors duration-150"
                >
                  <div className={`w-10 h-10 rounded-xl ${style.bg} ${style.text} flex items-center justify-center shrink-0`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-bp-text truncate">{item.title}</p>
                    <p className="text-xs text-bp-text-muted truncate mt-0.5">{item.sub}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-medium text-bp-text-secondary whitespace-nowrap">{timeAgo(item.date)}</span>
                    <span className="text-[11px] text-bp-text-muted whitespace-nowrap">{fullDate(item.date)}</span>
                  </div>
                  {isNew && <span className="w-2 h-2 rounded-full bg-bp-blue shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
