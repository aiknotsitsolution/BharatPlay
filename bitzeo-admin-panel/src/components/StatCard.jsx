import { TrendingUp, TrendingDown } from "lucide-react";

const ACCENT_STYLE = {
  "text-bp-blue": { borderLeftColor: "var(--bp-blue)" },
  "text-bp-cyan": { borderLeftColor: "var(--bp-cyan)" },
  "text-bp-orange": { borderLeftColor: "var(--bp-orange)" },
  "text-bp-yellow": { borderLeftColor: "var(--bp-yellow)" },
  "text-emerald-600": { borderLeftColor: "#3F8F5F" },
  "text-red-600": { borderLeftColor: "#D65A4A" },
};

export default function StatCard({
  title, value, change, sub, trend, icon: Icon,
  color = "text-bp-blue", bg = "bg-bp-blue/10",
}) {
  const isPositive = (change || trend)?.startsWith("+") || (trend)?.startsWith("up");
  const display = change || trend;
  const accent = ACCENT_STYLE[color] || {};
  const accentStyle = {
    borderLeftWidth: 4,
    borderLeftStyle: "solid",
    ...accent,
  };

  return (
    <div className="stat-card group" style={accentStyle}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] text-bp-text-secondary font-medium leading-snug">{title}</p>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
            <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.8} />
          </div>
        )}
      </div>
      <p className="mt-2 text-[28px] font-bold text-bp-text font-display tracking-tight leading-none">
        {value}
      </p>
      {display ? (
        <p className={`mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {display}
        </p>
      ) : sub ? (
        <p className="text-[12px] text-bp-text-muted mt-3">{sub}</p>
      ) : null}
    </div>
  );
}