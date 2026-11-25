import { AlertCircle, Check, Info, X } from "lucide-react";
import { toast as hotToast } from "react-hot-toast";

const icons = {
  success: Check,
  error: AlertCircle,
  info: Info,
};

const brandGradient =
  "linear-gradient(135deg, #ff783f 0%, #ff3f55 55%, #ff78a1 100%)";

function showToast(type, message, options = {}) {
  const { style: customStyle, duration = 4000, position = "top-center" } =
    options;
  const Icon = icons[type];

  return hotToast.custom(
    (item) => (
      <div
        role={type === "error" ? "alert" : "status"}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          width: "min(420px, calc(100vw - 32px))",
          boxSizing: "border-box",
          padding: "16px",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "16px",
          background:
            "linear-gradient(145deg, rgba(35, 35, 46, 0.98), rgba(20, 20, 28, 0.98))",
          color: "#f8fafc",
          boxShadow:
            "0 20px 55px rgba(0, 0, 0, 0.48), 0 0 0 1px rgba(255, 255, 255, 0.025)",
          backdropFilter: "blur(18px)",
          fontSize: "14px",
          lineHeight: 1.45,
          opacity: item.visible ? 1 : 0,
          transform: item.visible
            ? "translateY(0) scale(1)"
            : "translateY(-10px) scale(0.98)",
          transition: "opacity 200ms ease, transform 200ms ease",
          ...customStyle,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: "18px",
            right: "18px",
            height: "2px",
            borderRadius: "0 0 2px 2px",
            background: brandGradient,
            boxShadow: "0 0 16px rgba(255, 63, 85, 0.45)",
          }}
        />
        <span
          aria-hidden="true"
          style={{
            display: "flex",
            width: "38px",
            height: "38px",
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "12px",
            background: brandGradient,
            color: "#fff",
            boxShadow: "0 6px 18px rgba(255, 63, 85, 0.28)",
          }}
        >
          <Icon size={18} strokeWidth={2.5} />
        </span>
        <span style={{ flex: 1, fontWeight: 550 }}>{message}</span>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => hotToast.dismiss(item.id)}
          style={{
            display: "flex",
            flexShrink: 0,
            width: "30px",
            height: "30px",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            border: 0,
            borderRadius: "9px",
            background: "rgba(255, 255, 255, 0.06)",
            color: "#a7adbb",
            cursor: "pointer",
          }}
        >
          <X size={16} />
        </button>
      </div>
    ),
    { ...options, duration, position },
  );
}

export const toast = {
  success: (message, options) => showToast("success", message, options),
  error: (message, options) => showToast("error", message, options),
  info: (message, options) => showToast("info", message, options),
};
