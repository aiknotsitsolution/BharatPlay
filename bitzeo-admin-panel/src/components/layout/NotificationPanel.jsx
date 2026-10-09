import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  X,
  ArrowRight,
  RefreshCw,
  Trash2,
  Undo2,
} from "lucide-react";
import useNotifications, { kindStyle, timeAgo, fullDate } from "../../hooks/useNotifications";

/**
 * Bell dropdown panel — everything the full /notifications page does,
 * in a popover: live feed, All/Unread tabs, unread badge, mark-all-read,
 * clear-all + per-item clear (with restore), refresh, per-item navigation,
 * empty + loading states, "view all" link.
 *
 * Takes `notif` (from useNotifications) so the Header badge and the panel
 * share ONE fetch.
 */
export default function NotificationPanel({ notif, onClose }) {
  const navigate = useNavigate();
  const {
    items,
    loading,
    seenAt,
    unreadCount,
    dismissedCount,
    markAllRead,
    dismiss,
    clearAll,
    restoreAll,
    reload,
  } = notif;
  const [tab, setTab] = useState("all");

  // Esc closes the panel
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const unreadItems = items.filter(
    (i) => new Date(i.date).getTime() > seenAt
  );
  const visible = tab === "unread" ? unreadItems : items;

  const openItem = (link) => {
    onClose();
    navigate(link);
  };

  const goPage = () => {
    onClose();
    navigate("/notifications");
  };

  const iconBtn =
    "w-7 h-7 rounded-lg flex items-center justify-center text-bp-text-muted hover:text-bp-text hover:bg-bp-hover transition-colors duration-150";

  const tabBtn = (key, label, count) => (
    <button
      onClick={() => setTab(key)}
      className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors duration-150 ${
        tab === key
          ? "bg-bp-blue/12 text-bp-blue"
          : "text-bp-text-secondary hover:bg-bp-hover hover:text-bp-text"
      }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`ml-1.5 text-[10px] font-bold ${
            tab === key ? "text-bp-blue" : "text-bp-text-muted"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div
      role="menu"
      aria-label="Notifications"
      className="absolute right-0 mt-2 w-[370px] max-w-[calc(100vw-24px)] bg-bp-card border border-bp-border/60 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5 border-b border-bp-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-[14px] font-bold text-bp-text">Notifications</h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button onClick={reload} className={iconBtn} title="Refresh" aria-label="Refresh notifications">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className={iconBtn}
              title="Mark all as read"
              aria-label="Mark all as read"
            >
              <CheckCheck size={15} />
            </button>
          )}

          {items.length > 0 && (
            <button
              onClick={clearAll}
              className={`${iconBtn} hover:!text-red-500 hover:!bg-red-500/10`}
              title="Clear all notifications"
              aria-label="Clear all notifications"
            >
              <Trash2 size={14} />
            </button>
          )}

          <button onClick={onClose} className={iconBtn} title="Close" aria-label="Close notifications">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-bp-border/60">
        {tabBtn("all", "All", items.length)}
        {tabBtn("unread", "Unread", unreadItems.length)}
        <span className="ml-auto text-[11px] text-bp-text-muted">
          {loading
            ? "Updating…"
            : unreadCount > 0
              ? `${unreadCount} new update${unreadCount !== 1 ? "s" : ""}`
              : "All caught up"}
        </span>
      </div>

      {/* ── List ── */}
      <div className="max-h-[52vh] overflow-y-auto p-2">
        {loading && items.length === 0 ? (
          <div className="p-2 space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-bp-surface/50 animate-pulse"
              >
                <div className="w-9 h-9 rounded-xl bg-bp-elevated shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-2/3 rounded bg-bp-elevated" />
                  <div className="h-2.5 w-1/3 rounded bg-bp-elevated" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center text-center px-6 py-9">
            <div className="w-14 h-14 rounded-full bg-bp-elevated flex items-center justify-center mb-3">
              <Bell size={22} className="text-bp-blue" />
            </div>
            <p className="text-sm font-bold text-bp-text">
              {tab === "unread" ? "No unread notifications" : "No notifications"}
            </p>
            <p className="text-xs text-bp-text-muted mt-1 max-w-[240px]">
              New alerts about videos, users and copyright activity will
              appear here.
            </p>
            {dismissedCount > 0 && (
              <button
                onClick={restoreAll}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-bp-blue bg-bp-blue/10 hover:bg-bp-blue/15 transition-colors duration-150"
              >
                <Undo2 size={13} />
                Restore {dismissedCount} cleared
              </button>
            )}
          </div>
        ) : (
          visible.map((item) => {
            const style = kindStyle[item.kind] || kindStyle.video;
            const Icon = style.icon;
            const isNew = new Date(item.date).getTime() > seenAt;
            return (
              <div
                key={item.id}
                className={`group relative flex items-center rounded-xl transition-colors duration-150 ${
                  isNew ? "bg-bp-blue/[0.05]" : ""
                } hover:bg-bp-hover`}
              >
                {/* row body — click anywhere (except the ×) opens the item */}
                <button
                  onClick={() => openItem(item.link)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left p-2.5 pr-8"
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${style.bg} ${style.text} flex items-center justify-center shrink-0`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-bp-text truncate">
                      {item.title}
                    </p>
                    <p className="text-[11.5px] text-bp-text-muted truncate mt-0.5">
                      {item.sub}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] font-medium text-bp-text-secondary whitespace-nowrap">
                      {timeAgo(item.date)}
                    </span>
                    <span className="text-[10px] text-bp-text-muted whitespace-nowrap">
                      {fullDate(item.date)}
                    </span>
                  </div>
                  {isNew && (
                    <span className="w-2 h-2 rounded-full bg-bp-blue shrink-0" />
                  )}
                </button>

                {/* individual clear */}
                <button
                  onClick={() => dismiss(item.id)}
                  title="Remove notification"
                  aria-label={`Remove ${item.title}`}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-bp-text-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100 bg-bp-card hover:!text-red-500 hover:!bg-red-500/10 transition-all duration-150"
                >
                  <X size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-bp-surface/60 border-t border-bp-border/60">
        <button
          onClick={dismissedCount > 0 ? restoreAll : clearAll}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors duration-150 ${
            dismissedCount > 0
              ? "text-bp-blue bg-bp-blue/10 hover:bg-bp-blue/15"
              : items.length > 0
                ? "text-bp-text-secondary hover:text-red-500 hover:bg-red-500/10"
                : "text-bp-text-muted opacity-40 pointer-events-none"
          }`}
        >
          {dismissedCount > 0 ? (
            <>
              <Undo2 size={13} />
              Restore {dismissedCount}
            </>
          ) : (
            <>
              <Trash2 size={13} />
              Clear all
            </>
          )}
        </button>

        <button
          onClick={goPage}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12.5px] font-semibold text-bp-blue hover:bg-bp-blue/10 rounded-lg transition-colors duration-150"
        >
          View all notifications
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
