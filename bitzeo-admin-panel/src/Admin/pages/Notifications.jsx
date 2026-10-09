import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Trash2, Undo2, X } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import useNotifications, {
  kindStyle,
  timeAgo,
  fullDate,
} from "../../hooks/useNotifications";

export default function Notifications() {
  const navigate = useNavigate();
  // shared feed — same source as the header bell panel
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
  } = useNotifications({ limit: 15 });

  const newCount = unreadCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Notifications"
        subtitle={
          loading
            ? "Checking for updates..."
            : newCount > 0
              ? `${newCount} new update${newCount !== 1 ? "s" : ""}`
              : "You're all caught up"
        }
      >
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {!loading && items.length > 0 && newCount > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-bp-text-secondary bg-bp-elevated border border-bp-border hover:bg-bp-elevated/80 hover:text-bp-text hover:border-bp-border/80 transition-all duration-200"
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          )}

          {!loading && items.length > 0 && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-bp-text-secondary bg-bp-elevated border border-bp-border hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-200"
            >
              <Trash2 size={16} />
              Clear all
            </button>
          )}

          {dismissedCount > 0 && (
            <button
              onClick={restoreAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-bp-blue bg-bp-blue/10 border border-bp-blue/25 hover:bg-bp-blue/15 transition-all duration-200"
            >
              <Undo2 size={16} />
              Restore {dismissedCount}
            </button>
          )}
        </div>
      </PageHeader>

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
            {dismissedCount > 0 && (
              <button
                onClick={restoreAll}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-bp-blue bg-bp-blue/10 border border-bp-blue/25 hover:bg-bp-blue/15 transition-all duration-200"
              >
                <Undo2 size={16} />
                Restore {dismissedCount} cleared
              </button>
            )}
          </div>
        ) : (
          <div className="p-2">
            {items.map((item) => {
              const style = kindStyle[item.kind] || kindStyle.video;
              const Icon = style.icon;
              const isNew = new Date(item.date).getTime() > seenAt;
              return (
                <div
                  key={item.id}
                  className="group relative flex items-center rounded-xl transition-colors duration-150 hover:bg-bp-surface/60"
                >
                  {/* row body — click opens the notification */}
                  <button
                    onClick={() => navigate(item.link)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left p-3 pr-10"
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

                  {/* individual clear */}
                  <button
                    onClick={() => dismiss(item.id)}
                    title="Remove notification"
                    aria-label={`Remove ${item.title}`}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-bp-text-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100 bg-bp-card hover:!text-red-500 hover:!bg-red-500/10 transition-all duration-150"
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
