import {
  Activity,
  ArrowUpRight,
  Clock3,
  Film,
  Inbox,
  Play,
  RefreshCw,
  Upload,
  UserRoundCheck,
  Users,
  Video,
  Eye,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchContactRequests, fetchCopyrightStats } from "../../api";
import useDashboardData from "../../hooks/useDashboardData";
import PageHeader from "../../components/layout/PageHeader";

const CHART_COLORS = {
  users: "#3b82f6",
  uploads: "#f59e0b",
  longVideos: "#3b82f6",
  shorts: "#8b5cf6",
};

const getAdminDisplayName = () => {
  try {
    const savedUser = JSON.parse(localStorage.getItem("adminUser") || "null");
    return savedUser?.name || "Admin";
  } catch {
    return "Admin";
  }
};

const formatRelativeTime = (iso) => {
  if (!iso) return "just now";
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const formatCount = (value) => {
  const count = Number(value) || 0;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return count.toLocaleString();
};

const formatTooltipValue = (value) => Number(value || 0).toLocaleString();

function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section
      className={`min-w-0 rounded-2xl border border-bp-border/60 bg-bp-card p-5 shadow-bp-soft sm:p-6 ${className}`}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-bp-text">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs text-bp-text-secondary">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ title, value, detail, icon, accent, progress }) {
  const MetricIcon = icon;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-bp-border/60 bg-bp-card p-4 shadow-bp-soft transition duration-200 hover:-translate-y-0.5 hover:border-bp-blue/40 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-bp-text-secondary">{title}</p>
          <p className="mt-2 truncate font-display text-2xl font-bold tracking-tight text-bp-text sm:text-[28px]">
            {value === null || value === undefined ? "—" : formatCount(value)}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
        >
          <MetricIcon className="h-[18px] w-[18px]" strokeWidth={1.9} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-[11px] text-bp-text-muted">{detail}</span>
        {progress !== undefined && (
          <span className="text-[11px] font-semibold text-bp-text-secondary">
            {progress}%
          </span>
        )}
      </div>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bp-elevated">
          <div
            className="h-full rounded-full bg-bp-blue transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </article>
  );
}

function WeeklyUsersChart({ data }) {
  return (
    <Panel
      title="User growth"
      subtitle="New accounts created each day"
      action={
        <span className="rounded-lg border border-bp-border/60 bg-bp-elevated px-2.5 py-1.5 text-[11px] font-medium text-bp-text-secondary">
          Last 7 days
        </span>
      }
    >
      {data.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center rounded-xl bg-bp-elevated/60 text-sm text-bp-text-muted">
          No user growth data available yet
        </div>
      ) : (
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--bp-border)"
                strokeDasharray="3 5"
                opacity={0.45}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--bp-text-muted)", fontSize: 11 }}
                dy={10}
              />
              <YAxis
                yAxisId="users"
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--bp-text-muted)", fontSize: 10 }}
                width={38}
              />
              <Tooltip
                cursor={{ fill: "var(--bp-hover)", opacity: 0.45 }}
                contentStyle={{
                  background: "var(--bp-card)",
                  border: "1px solid var(--bp-border)",
                  borderRadius: 12,
                  color: "var(--bp-text)",
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--bp-text-secondary)", marginBottom: 4 }}
                formatter={formatTooltipValue}
              />
              <Area
                type="monotone"
                dataKey="users"
                name="Users"
                stroke={CHART_COLORS.users}
                strokeWidth={2.5}
                fill={CHART_COLORS.users}
                fillOpacity={0.14}
                activeDot={{ r: 4, strokeWidth: 0, fill: CHART_COLORS.users }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

function WeeklyUploadsChart({ data }) {
  return (
    <Panel
      title="Upload activity"
      subtitle="Videos published each day"
      action={
        <span className="rounded-lg border border-bp-border/60 bg-bp-elevated px-2.5 py-1.5 text-[11px] font-medium text-bp-text-secondary">
          Last 7 days
        </span>
      }
    >
      {data.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center rounded-xl bg-bp-elevated/60 text-sm text-bp-text-muted">
          No upload data available yet
        </div>
      ) : (
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
              barCategoryGap="38%"
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--bp-border)"
                strokeDasharray="3 5"
                opacity={0.45}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--bp-text-muted)", fontSize: 11 }}
                dy={10}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--bp-text-muted)", fontSize: 10 }}
                width={38}
              />
              <Tooltip
                cursor={{ fill: "var(--bp-hover)", opacity: 0.45 }}
                contentStyle={{
                  background: "var(--bp-card)",
                  border: "1px solid var(--bp-border)",
                  borderRadius: 12,
                  color: "var(--bp-text)",
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--bp-text-secondary)", marginBottom: 4 }}
                formatter={formatTooltipValue}
              />
              <Bar
                dataKey="videos"
                name="Videos uploaded"
                fill={CHART_COLORS.uploads}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

function WeeklyCopyrightChart({ data }) {
  const hasData = data.some(
    (point) => typeof point.copyrightCases === "number",
  );

  return (
    <Panel
      title="Copyright cases"
      subtitle="New copyright cases received each day"
      action={
        <span className="rounded-lg border border-bp-border/60 bg-bp-elevated px-2.5 py-1.5 text-[11px] font-medium text-bp-text-secondary">
          Last 7 days
        </span>
      }
    >
      {!hasData ? (
        <div className="flex h-[220px] items-center justify-center rounded-xl bg-bp-elevated/60 px-4 text-center text-sm text-bp-text-muted">
          Copyright trend is unavailable. Check the dashboard service database
          connection.
        </div>
      ) : (
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
              barCategoryGap="38%"
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--bp-border)"
                strokeDasharray="3 5"
                opacity={0.45}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--bp-text-muted)", fontSize: 11 }}
                dy={10}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--bp-text-muted)", fontSize: 10 }}
                width={38}
              />
              <Tooltip
                cursor={{ fill: "var(--bp-hover)", opacity: 0.45 }}
                contentStyle={{
                  background: "var(--bp-card)",
                  border: "1px solid var(--bp-border)",
                  borderRadius: 12,
                  color: "var(--bp-text)",
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--bp-text-secondary)", marginBottom: 4 }}
                formatter={formatTooltipValue}
              />
              <Bar
                dataKey="copyrightCases"
                name="Copyright cases"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

function WeeklyAdsChart({ data }) {
  const hasData = data.some(
    (point) =>
      typeof point.adImpressions === "number" ||
      typeof point.adCompletions === "number",
  );

  return (
    <Panel
      title="Ad performance"
      subtitle="Ad impressions and completed views each day"
      action={
        <span className="rounded-lg border border-bp-border/60 bg-bp-elevated px-2.5 py-1.5 text-[11px] font-medium text-bp-text-secondary">
          Last 7 days
        </span>
      }
    >
      {!hasData ? (
        <div className="flex h-[220px] items-center justify-center rounded-xl bg-bp-elevated/60 px-4 text-center text-sm text-bp-text-muted">
          Ad trend is unavailable. Check the dashboard service database
          connection.
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="flex items-center gap-2 text-xs text-bp-text-secondary">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Impressions
            </span>
            <span className="flex items-center gap-2 text-xs text-bp-text-secondary">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Completed
            </span>
          </div>
          <div className="h-[190px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--bp-border)"
                  strokeDasharray="3 5"
                  opacity={0.45}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--bp-text-muted)", fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--bp-text-muted)", fontSize: 10 }}
                  width={38}
                />
                <Tooltip
                  cursor={{ fill: "var(--bp-hover)", opacity: 0.45 }}
                  contentStyle={{
                    background: "var(--bp-card)",
                    border: "1px solid var(--bp-border)",
                    borderRadius: 12,
                    color: "var(--bp-text)",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--bp-text-secondary)", marginBottom: 4 }}
                  formatter={formatTooltipValue}
                />
                <Area
                  type="monotone"
                  dataKey="adImpressions"
                  name="Impressions"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.12}
                  strokeWidth={2.5}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="adCompletions"
                  name="Completed"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.08}
                  strokeWidth={2}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Panel>
  );
}

function TodaySnapshot({ snapshot }) {
  const items = [
    {
      label: "New users",
      value: snapshot.newUsers,
      detail: "Joined today",
      icon: UserPlus,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Videos uploaded",
      value: snapshot.videosUploaded,
      detail: "Uploaded today",
      icon: Upload,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Total views",
      value: snapshot.totalViews,
      detail: "Across all videos",
      icon: Eye,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Watch time",
      value: `${formatCount(snapshot.watchTime)}h`,
      detail: "Hours in the last 30 days",
      icon: Play,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      raw: true,
    },
  ];

  return (
    <Panel title="Today's snapshot" subtitle="Platform activity at a glance">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {items.map(({ label, value, detail, icon, color, bg, raw }) => {
          const SnapshotIcon = icon;
          return (
            <div
              key={label}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-bp-border/50 hover:bg-bp-elevated/70"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg} ${color}`}
              >
                <SnapshotIcon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-bp-text">
                  {label}
                </p>
                <p className="mt-0.5 text-[11px] text-bp-text-muted">{detail}</p>
              </div>
              <p className="shrink-0 font-display text-lg font-bold text-bp-text">
                {raw ? value : formatCount(value)}
              </p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function ContentMix({ longVideos, shorts }) {
  const total = (Number(longVideos) || 0) + (Number(shorts) || 0);
  const longVideoShare = total
    ? Math.round(((Number(longVideos) || 0) / total) * 100)
    : 0;
  const shortsShare = total
    ? Math.round(((Number(shorts) || 0) / total) * 100)
    : 0;

  return (
    <Panel title="Content mix" subtitle="Published videos by format">
      {total === 0 ? (
        <div className="flex h-[156px] items-center justify-center rounded-xl bg-bp-elevated/60 text-sm text-bp-text-muted">
          No videos to break down yet
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-3xl font-bold tracking-tight text-bp-text">
                {formatCount(total)}
              </p>
              <p className="mt-1 text-xs text-bp-text-muted">Total published</p>
            </div>
            <div className="h-10 w-10 rounded-full border-[5px] border-violet-500/80 border-r-blue-500/80 border-b-blue-500/80 border-l-violet-500/80" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-bp-text-secondary">
                  <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
                  Long videos
                </span>
                <span className="font-semibold text-bp-text">
                  {formatCount(longVideos)}{" "}
                  <span className="font-normal text-bp-text-muted">
                    ({longVideoShare}%)
                  </span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bp-elevated">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${longVideoShare}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-bp-text-secondary">
                  <span className="h-2.5 w-2.5 rounded-sm bg-violet-500" />
                  Shorts
                </span>
                <span className="font-semibold text-bp-text">
                  {formatCount(shorts)}{" "}
                  <span className="font-normal text-bp-text-muted">
                    ({shortsShare}%)
                  </span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bp-elevated">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${shortsShare}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}

function RecentUsers({ users, onNavigate }) {
  return (
    <Panel
      title="Recent users"
      subtitle="Latest accounts to join the platform"
      action={
        <button
          type="button"
          onClick={onNavigate}
          className="inline-flex items-center gap-1 text-xs font-semibold text-bp-blue transition-colors hover:text-bp-cyan"
        >
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      }
    >
      {users.length === 0 ? (
        <p className="py-8 text-center text-sm text-bp-text-muted">
          No recent users to show
        </p>
      ) : (
        <div className="divide-y divide-bp-border/40">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-bp-elevated">
                {user.avatar && /^(https?:|\/)/.test(user.avatar) ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-blue-500/10 text-xs font-bold text-blue-500">
                    {user.avatar || (user.name || "U").slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-bp-text">
                  {user.name}
                </p>
                <p className="truncate text-xs text-bp-text-muted">
                  {user.email}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={`mb-1 inline-flex items-center gap-1 text-[10px] ${
                    user.status === "online"
                      ? "text-emerald-500"
                      : "text-bp-text-muted"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      user.status === "online" ? "bg-emerald-500" : "bg-bp-border"
                    }`}
                  />
                  {user.status === "online" ? "Online" : "Joined"}
                </span>
                <p className="text-[10px] text-bp-text-muted">{user.joined}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function RecentUploads({ videos, onNavigate }) {
  return (
    <Panel
      title="Recent uploads"
      subtitle="Latest videos published on the platform"
      action={
        <button
          type="button"
          onClick={onNavigate}
          className="inline-flex items-center gap-1 text-xs font-semibold text-bp-blue transition-colors hover:text-bp-cyan"
        >
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      }
    >
      {videos.length === 0 ? (
        <p className="py-8 text-center text-sm text-bp-text-muted">
          No recent uploads to show
        </p>
      ) : (
        <div className="divide-y divide-bp-border/40">
          {videos.map((video) => (
            <div key={video.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Play className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-bp-text">
                  {video.title || "Untitled video"}
                </p>
                <p className="truncate text-xs text-bp-text-muted">
                  by {video.uploadedBy || "Unknown"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="inline-flex items-center gap-1 text-[11px] text-bp-text-secondary">
                  <Eye className="h-3 w-3" />
                  {formatCount(video.views)}
                </span>
                <p className="mt-1 text-[10px] text-bp-text-muted">
                  {video.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bp-blue border-t-transparent" />
        <p className="text-sm text-bp-text-secondary">Loading dashboard...</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, generatedAt, loading, error, refetch } = useDashboardData();
  const [workload, setWorkload] = useState({
    inquiries: null,
    pendingInquiries: null,
    copyrightCases: null,
    pendingCopyrightCases: null,
    loading: true,
  });

  const fetchWorkload = useCallback(async () => {
    const [inquiriesResult, pendingInquiriesResult, copyrightResult] =
      await Promise.allSettled([
        fetchContactRequests({ page: 1, limit: 1 }),
        fetchContactRequests({ status: "pending", page: 1, limit: 1 }),
        fetchCopyrightStats(),
      ]);

    setWorkload((current) => {
      const next = { ...current, loading: false };
      if (inquiriesResult.status === "fulfilled") {
        next.inquiries =
          inquiriesResult.value.data?.pagination?.total ?? null;
      } else {
        console.error("Failed to load dashboard inquiries:", inquiriesResult.reason);
      }
      if (pendingInquiriesResult.status === "fulfilled") {
        next.pendingInquiries =
          pendingInquiriesResult.value.data?.pagination?.total ?? null;
      } else {
        console.error(
          "Failed to load pending dashboard inquiries:",
          pendingInquiriesResult.reason,
        );
      }
      if (copyrightResult.status === "fulfilled") {
        const cases = copyrightResult.value.data?.data?.cases;
        next.copyrightCases = cases?.total ?? null;
        next.pendingCopyrightCases = cases?.pending ?? null;
      } else {
        console.error("Failed to load dashboard copyright cases:", copyrightResult.reason);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchWorkload, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchWorkload]);

  if (loading && !data) return <DashboardLoading />;

  if (error === "unauthorized") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-bp-border/60 bg-bp-card p-8 text-center shadow-bp-soft">
          <p className="font-semibold text-bp-text">Your session has expired</p>
          <p className="mt-2 text-sm text-bp-text-secondary">
            Sign in again to continue to the dashboard.
          </p>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("adminToken");
              localStorage.removeItem("adminUser");
              window.location.href = "/login";
            }}
            className="mt-5 rounded-xl bg-bp-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-bp-border/60 bg-bp-card p-8 text-center shadow-bp-soft">
          <p className="font-semibold text-red-500">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-5 rounded-xl border border-bp-border bg-bp-elevated px-5 py-2.5 text-sm font-semibold text-bp-text transition hover:bg-bp-hover"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const snapshot = data?.snapshot || {};
  const weeklyData = data?.weekly || [];
  const recentUsers = data?.recentUsers || [];
  const recentVideos = data?.recentUploads || [];
  const totalVideos = Number(stats.totalVideos) || 0;
  const totalShorts = Number(stats.totalShorts) || 0;
  const totalLongVideos = Number(stats.totalLongVideos) || 0;
  const activeUsers = Number(stats.activeUsers) || 0;
  const activeRate = stats.totalUsers
    ? Math.min(100, Math.round((activeUsers / stats.totalUsers) * 100))
    : 0;
  const lastUpdated = generatedAt ? formatRelativeTime(generatedAt) : "just now";
  const refreshDashboard = () => {
    setWorkload((current) => ({ ...current, loading: true }));
    refetch();
    fetchWorkload();
  };

  const metrics = [
    {
      title: "Total users",
      value: stats.totalUsers,
      detail: `${formatCount(stats.newUsersThisWeek)} joined this week`,
      icon: Users,
      accent: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Active users",
      value: activeUsers,
      detail: "Accounts in good standing",
      icon: UserRoundCheck,
      accent: "bg-emerald-500/10 text-emerald-500",
      progress: activeRate,
    },
    {
      title: "Total videos",
      value: totalVideos,
      detail: `${formatCount(snapshot.videosUploaded)} uploaded today`,
      icon: Video,
      accent: "bg-amber-500/10 text-amber-500",
    },
    {
      title: "Long videos",
      value: totalLongVideos,
      detail: "Published long-form content",
      icon: Play,
      accent: "bg-violet-500/10 text-violet-500",
    },
    {
      title: "Shorts",
      value: totalShorts,
      detail: "Published short-form content",
      icon: Film,
      accent: "bg-pink-500/10 text-pink-500",
    },
    {
      title: "Inquiries",
      value: workload.inquiries,
      detail:
        workload.pendingInquiries === null
          ? "All contact requests"
          : `${formatCount(workload.pendingInquiries)} pending · all requests`,
      icon: Inbox,
      accent: "bg-cyan-500/10 text-cyan-500",
    },
    {
      title: "Copyright cases",
      value: workload.copyrightCases,
      detail:
        workload.pendingCopyrightCases === null
          ? "All submitted cases"
          : `${formatCount(workload.pendingCopyrightCases)} pending review`,
      icon: ShieldCheck,
      accent: "bg-rose-500/10 text-rose-500",
    },
  ];

  return (
    <div className="space-y-5 pb-6 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Platform overview"
        subtitle={
          <>
            Welcome back,{" "}
            <span className="font-medium text-bp-text">
              {getAdminDisplayName()}
            </span>
            . Here&apos;s your platform at a glance.
          </>
        }
      >
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-lg border border-bp-border/60 bg-bp-card px-3 py-2 text-xs text-bp-text-secondary sm:inline-flex">
            <Clock3 className="h-3.5 w-3.5" />
            Updated {lastUpdated}
          </span>
          <button
            type="button"
            onClick={refreshDashboard}
            disabled={loading || workload.loading}
            className="inline-flex items-center gap-2 rounded-xl border border-bp-border/70 bg-bp-card px-3.5 py-2.5 text-xs font-semibold text-bp-text transition hover:bg-bp-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                loading || workload.loading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>
      </PageHeader>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300"
        >
          Could not refresh the latest data. Showing the last loaded results.
        </div>
      )}

      <section aria-label="Platform metrics">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-bp-blue" />
            <h2 className="text-sm font-semibold text-bp-text">
              Key performance indicators
            </h2>
          </div>
        <span className="text-[11px] text-bp-text-muted">
          {workload.loading ? "Updating..." : "Current totals"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <WeeklyUsersChart data={weeklyData} />
      <WeeklyUploadsChart data={weeklyData} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <WeeklyCopyrightChart data={weeklyData} />
        <WeeklyAdsChart data={weeklyData} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TodaySnapshot snapshot={snapshot} />
        <ContentMix longVideos={totalLongVideos} shorts={totalShorts} />
      </div>

      <section aria-label="Recent platform activity">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-bp-text">
              Recent platform activity
            </h2>
            <p className="mt-1 text-xs text-bp-text-muted">
              The latest members and published videos
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <RecentUsers
            users={recentUsers}
            onNavigate={() => navigate("/alluser")}
          />
          <RecentUploads
            videos={recentVideos}
            onNavigate={() => navigate("/uploads")}
          />
        </div>
      </section>
    </div>
  );
}
