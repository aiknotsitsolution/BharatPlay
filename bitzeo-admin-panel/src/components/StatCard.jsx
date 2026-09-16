import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({
  title, value, change, sub, trend, icon: Icon,
  color = "text-bp-blue", bg = "bg-bp-blue/10",
}) {
  const isPositive = (change || trend)?.startsWith("+") || (trend)?.startsWith("up");
  const display = change || trend;

  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.8} />
        </div>
        {display && (
          <span className={`badge ${isPositive ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {display}
          </span>
        )}
      </div>
      <div>
        <p className="text-[13px] text-bp-text-muted font-medium mb-1">{title}</p>
        <p className="text-[28px] font-bold text-bp-text tracking-tight leading-none">{value}</p>
      </div>
      {sub && !display && <p className="text-[12px] text-bp-text-muted mt-2">{sub}</p>}
    </div>
  );
}
