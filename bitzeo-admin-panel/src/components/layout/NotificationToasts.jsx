import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { kindStyle, timeAgo } from "../../hooks/useNotifications";

const VISIBLE_MAX = 3;
const TOAST_MS = 6000;

// bright accents — readable on the dark-teal toast body (sidebar palette)
const TOAST_ACCENT = {
  video: "#38a8ff",
  short: "#22d3ee",
  case: "#fbbf24",
  user: "#34d399",
};

/**
 * Mobile-style push toasts — a new notification slides down from the top
 * of the screen, auto-dismisses, and opens its page on tap.
 * Fed by useNotifications({ pollMs }) which detects fresh arrivals.
 */
function PushToast({ item, notif }) {
  const navigate = useNavigate();
  const style = kindStyle[item.kind] || kindStyle.video;
  const Icon = style.icon;
  const accent = TOAST_ACCENT[item.kind] || TOAST_ACCENT.video;
  const close = () => notif.clearIncoming(item.id);

  // auto-dismiss (each toast keeps its own timer)
  useEffect(() => {
    const t = setTimeout(close, TOAST_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const open = () => {
    close();
    navigate(item.link);
  };

  return (
    <div
      role="status"
      onClick={open}
      style={{ background: "linear-gradient(160deg, #193940, #1a2c3c)" }}
      className="pointer-events-auto w-full border border-white/10 rounded-2xl shadow-xl px-3 py-2.5 flex items-start gap-3 cursor-pointer hover:brightness-110 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div
        style={{ background: `${accent}1f`, color: accent }}
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
      >
        <Icon size={16} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10.5px] font-bold text-[#8ea3bd] uppercase tracking-wide">
            VidBuxApp
          </span>
          <span className="w-1 h-1 rounded-full bg-[#8ea3bd]/60" />
          <span className="text-[10.5px] font-medium text-[#8ea3bd]">
            {timeAgo(item.date)}
          </span>
          <span className="ml-auto w-2 h-2 rounded-full bg-[#00a1ff] shrink-0" />
        </div>

        <p className="text-[13px] font-bold text-[#eaeff4] truncate">
          {item.title}
        </p>
        <p className="text-[11.5px] text-[#a4b4c9] truncate mt-0.5">
          {item.sub}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        aria-label="Dismiss notification"
        className="w-6 h-6 rounded-md flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 shrink-0 transition-colors duration-150"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export default function NotificationToasts({ notif }) {
  const { incoming = [], dismissed = [], clearIncoming } = notif;

  // newest first — feed order is date-desc, so re-sorting keeps the freshest
  // notifications visible even when a whole batch lands in one poll
  const sorted = [...incoming].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  const visibleIds = new Set(
    sorted.slice(0, VISIBLE_MAX).map((i) => i.id)
  );

  // maintenance: drop cleared items + anything pushed out of the window
  useEffect(() => {
    incoming.forEach((i) => {
      if (dismissed.includes(i.id) || !visibleIds.has(i.id)) {
        clearIncoming(i.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming, dismissed, clearIncoming]);

  const shown = sorted.slice(0, VISIBLE_MAX);
  if (shown.length === 0) return null;

  return (
    <div className="fixed top-2 sm:top-3 left-1/2 -translate-x-1/2 z-[110] w-[350px] max-w-[calc(100vw-16px)] flex flex-col gap-2">
      {shown.map((item) => (
        <PushToast key={item.id} item={item} notif={notif} />
      ))}
    </div>
  );
}
