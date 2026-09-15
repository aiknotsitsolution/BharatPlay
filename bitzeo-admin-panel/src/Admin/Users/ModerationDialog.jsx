import { useState, useEffect, useRef } from "react";
import { Loader2, X, AlertTriangle, Ban, ShieldOff, Trash2, RotateCcw } from "lucide-react";

const ACTION_CONFIG = {
  suspend: {
    title: "Suspend User",
    description: "This user will be blocked from accessing the platform. They will not be able to log in or use any features until restored.",
    icon: ShieldOff,
    color: "amber",
    buttonLabel: "Suspend",
    buttonClass: "bg-amber-600 hover:bg-amber-500",
    requireReason: true,
    reasonPlaceholder: "e.g. Violation of community guidelines",
  },
  restore: {
    title: "Restore User",
    description: "This user will regain full access to the platform. Any suspension or ban will be lifted.",
    icon: ShieldOff,
    color: "emerald",
    buttonLabel: "Restore",
    buttonClass: "bg-emerald-600 hover:bg-emerald-500",
    requireReason: false,
  },
  ban: {
    title: "Ban User",
    description: "This user will be permanently blocked from the platform. They will not be able to log in or create new accounts.",
    icon: Ban,
    color: "red",
    buttonLabel: "Ban",
    buttonClass: "bg-red-600 hover:bg-red-500",
    requireReason: true,
    reasonPlaceholder: "e.g. Repeated policy violations, fraudulent activity",
  },
  delete: {
    title: "Delete User",
    description: "This action will soft-delete the user account. The account data will be preserved but the user will be permanently blocked.",
    icon: Trash2,
    color: "red",
    buttonLabel: "Delete",
    buttonClass: "bg-red-600 hover:bg-red-500",
    requireReason: true,
    reasonPlaceholder: "e.g. Account closure requested",
  },
  disableChannel: {
    title: "Disable Channel",
    description: "This channel will be temporarily disabled. Content will not be visible to users until re-enabled.",
    icon: ShieldOff,
    color: "amber",
    buttonLabel: "Disable",
    buttonClass: "bg-amber-600 hover:bg-amber-500",
    requireReason: false,
  },
  enableChannel: {
    title: "Enable Channel",
    description: "This channel will be re-enabled and become visible to users again.",
    icon: RotateCcw,
    color: "emerald",
    buttonLabel: "Enable",
    buttonClass: "bg-emerald-600 hover:bg-emerald-500",
    requireReason: false,
  },
  banChannel: {
    title: "Ban Channel",
    description: "This channel will be permanently banned. It will not be accessible to any user.",
    icon: Ban,
    color: "red",
    buttonLabel: "Ban",
    buttonClass: "bg-red-600 hover:bg-red-500",
    requireReason: true,
    reasonPlaceholder: "e.g. Severe policy violation",
  },
  restoreChannel: {
    title: "Restore Channel",
    description: "This channel will be restored to active status. Any ban or disable will be lifted.",
    icon: RotateCcw,
    color: "emerald",
    buttonLabel: "Restore",
    buttonClass: "bg-emerald-600 hover:bg-emerald-500",
    requireReason: false,
  },
  deleteChannel: {
    title: "Delete Channel",
    description: "This channel will be permanently deleted. This action cannot be undone.",
    icon: Trash2,
    color: "red",
    buttonLabel: "Delete",
    buttonClass: "bg-red-600 hover:bg-red-500",
    requireReason: true,
    reasonPlaceholder: "e.g. Channel violates community guidelines",
  },
  disableVideo: {
    title: "Disable Video",
    description: "This video will be temporarily disabled. It will not be visible to users until re-enabled.",
    icon: ShieldOff,
    color: "amber",
    buttonLabel: "Disable",
    buttonClass: "bg-amber-600 hover:bg-amber-500",
    requireReason: false,
  },
  enableVideo: {
    title: "Enable Video",
    description: "This video will be re-enabled and become visible to users again.",
    icon: RotateCcw,
    color: "emerald",
    buttonLabel: "Enable",
    buttonClass: "bg-emerald-600 hover:bg-emerald-500",
    requireReason: false,
  },
  deleteVideo: {
    title: "Delete Video",
    description: "This video will be permanently deleted. This action cannot be undone.",
    icon: Trash2,
    color: "red",
    buttonLabel: "Delete",
    buttonClass: "bg-red-600 hover:bg-red-500",
    requireReason: true,
    reasonPlaceholder: "e.g. Violates content policy",
  },
  disableShort: {
    title: "Disable Short",
    description: "This short will be temporarily disabled. It will not be visible to users until re-enabled.",
    icon: ShieldOff,
    color: "amber",
    buttonLabel: "Disable",
    buttonClass: "bg-amber-600 hover:bg-amber-500",
    requireReason: false,
  },
  enableShort: {
    title: "Enable Short",
    description: "This short will be re-enabled and become visible to users again.",
    icon: RotateCcw,
    color: "emerald",
    buttonLabel: "Enable",
    buttonClass: "bg-emerald-600 hover:bg-emerald-500",
    requireReason: false,
  },
  deleteShort: {
    title: "Delete Short",
    description: "This short will be permanently deleted. This action cannot be undone.",
    icon: Trash2,
    color: "red",
    buttonLabel: "Delete",
    buttonClass: "bg-red-600 hover:bg-red-500",
    requireReason: true,
    reasonPlaceholder: "e.g. Violates content policy",
  },
};

export default function ModerationDialog({ open, action, userName, targetName, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const config = ACTION_CONFIG[action] || ACTION_CONFIG.suspend;
  const Icon = config.icon;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  // Focus reason input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (config.requireReason && !reason.trim()) {
      setError("Reason is required for this action");
      return;
    }
    onConfirm(reason.trim() || null);
  };

  const colorClasses = {
    amber: {
      iconBg: "bg-amber-500/15",
      iconText: "text-amber-400",
      border: "border-amber-500/20",
      titleText: "text-amber-400",
    },
    emerald: {
      iconBg: "bg-emerald-500/15",
      iconText: "text-emerald-400",
      border: "border-emerald-500/20",
      titleText: "text-emerald-400",
    },
    red: {
      iconBg: "bg-red-500/15",
      iconText: "text-red-400",
      border: "border-red-500/20",
      titleText: "text-red-400",
    },
  };

  const c = colorClasses[config.color] || colorClasses.amber;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#1a1a1a] border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-300 transition"
        >
          <X size={18} />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl ${c.iconBg} ${c.border} border flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className={c.iconText} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${c.titleText}`}>{config.title}</h3>
              <p className="text-sm text-gray-400">
                {targetName ? (
                  <><span className="font-medium text-gray-200">{targetName}</span>{userName && <> — owned by <span className="font-medium text-gray-200">{userName}</span></>}</>
                ) : (
                  <>for <span className="font-medium text-gray-200">{userName}</span></>
                )}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-5 leading-relaxed">{config.description}</p>

          <form onSubmit={handleSubmit}>
            {config.requireReason && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  ref={inputRef}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (error) setError("");
                  }}
                  rows={3}
                  maxLength={500}
                  placeholder={config.reasonPlaceholder}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                />
                <div className="flex items-center justify-between mt-1">
                  {error ? (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertTriangle size={11} /> {error}
                    </p>
                  ) : (
                    <span />
                  )}
                  <p className="text-[11px] text-gray-600">{reason.length}/500</p>
                </div>
              </div>
            )}

            {!config.requireReason && <div ref={inputRef} />}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center gap-2 px-5 py-2.5 ${config.buttonClass} text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Icon size={16} />
                )}
                {loading ? "Processing..." : config.buttonLabel}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
