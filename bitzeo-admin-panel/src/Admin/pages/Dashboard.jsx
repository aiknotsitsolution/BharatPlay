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
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchContactRequests, fetchCopyrightStats } from "../../api";
import useDashboardData from "../../hooks/useDashboardData";
import welcomeImg from "../../assets/make-social-media.png";

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

function Panel({ title, subtitle, action, children, className = "", art = null }) {
  return (
    <section
      className={`relative min-w-0 rounded-2xl border border-bp-border/60 bg-bp-card p-5 shadow-bp-soft sm:p-6 ${className}`}
    >
      {/* paper artwork layer — cut-paper shapes clipped to the card */}
      {art ? (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
          aria-hidden="true"
        >
          {art}
        </div>
      ) : null}

      <div className="relative mb-5 flex flex-wrap items-start justify-between gap-3">
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
      <div className="relative">{children}</div>
    </section>
  );
}

/* Paper artwork compositions — quarter-disc wedges, rotated diamonds and
   diagonal ribbons. Deliberately NOT circles: the KPI cards already own
   the circle artwork, so these panels get their own cut-paper language. */
const SNAPSHOT_ART = (
  <>
    <span className="pa pa-fan-tr pa-blue" />
    <span className="pa pa-diamond pa-diamond-bl pa-violet" />
    <span className="pa pa-ribbon pa-ribbon-a pa-cyan" />
  </>
);

const USERS_ART = (
  <>
    <span className="pa pa-ribbon pa-ribbon-a pa-violet" />
    <span className="pa pa-ribbon pa-ribbon-b pa-pink" />
    <span className="pa pa-diamond pa-diamond-br pa-emerald" />
  </>
);

const UPLOADS_ART = (
  <>
    <span className="pa pa-fan-br pa-amber" />
    <span className="pa pa-ribbon pa-ribbon-c pa-blue" />
    <span className="pa pa-diamond pa-diamond-sm pa-diamond-bl pa-violet" />
  </>
);

function WelcomeBanner({ name, stats, updated, refreshing, onRefresh }) {
  return (
    <section className="relative flex flex-col rounded-2xl">
      {/* Gradient body — clipped so glow blobs stay inside the card */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-r from-[#00a1ff] via-[#0088e6] to-[#0074ba] shadow-lg shadow-blue-600/20">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="relative flex flex-1 flex-col p-4 sm:p-5 lg:pr-[248px] xl:pr-5 2xl:pr-[296px]">
        <div className="pt-2 sm:pt-3">
          <h1 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
            Welcome {name}
          </h1>
          <p className="mt-2 text-sm font-medium text-white/80">
            Check all the statistics
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-3">
          {/* Stat pills */}
          <div className="inline-flex items-stretch rounded-full bg-white/15 p-1 ring-1 ring-white/25 backdrop-blur-sm">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`px-4 py-1 text-center sm:px-5 ${
                  index > 0 ? "border-l border-white/25" : ""
                }`}
              >
                <p className="text-lg font-bold leading-tight text-white sm:text-xl">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-white/75">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/25">
            <Clock3 className="h-3.5 w-3.5" />
            Updated {updated}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1e88e5] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Illustration — intentionally overflows the card's top edge (MaterialM style) */}
      <img
        src={welcomeImg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute hidden w-auto shrink-0 select-none lg:-top-10 lg:right-3 lg:block lg:h-40 2xl:right-4 2xl:h-44"
      />
    </section>
  );
}

function MetricCard({ title, value, detail, icon, accent, chip }) {
  const MetricIcon = icon;
  const displayValue =
    value === null || value === undefined ? "—" : formatCount(value);

  return (
    <article className={`kpi-card ${accent}`}>
      {/* paper artwork — soft overlapping circles */}
      <span className="kpi-art kpi-art-a" aria-hidden="true" />
      <span className="kpi-art kpi-art-b" aria-hidden="true" />

      <div className="kpi-icon relative">
        <MetricIcon className="h-5 w-5" strokeWidth={1.9} />
      </div>

      <div className="relative mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-[24px] font-bold leading-none tracking-tight">
            {displayValue}
          </p>
          {chip ? <span className="kpi-chip">{chip}</span> : null}
        </div>
        <p className="mt-2.5 text-[13.5px] font-semibold leading-tight">
          {title}
        </p>
        <p
          className="mt-1 text-[11px] leading-snug"
          style={{ color: "var(--kpi-sub)" }}
        >
          {detail}
        </p>
      </div>
    </article>
  );
}

// ── 8th KPI card — Top video views (long vs shorts, month/day-wise) ───────
// Hovering a bar reveals the top video's uploader photo, profile name and
// channel name. Fallback to TOP_VIDEOS_DUMMY until data.topVideos exists.
function TopVideoTooltip({ active, payload, label, range }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const entries = [
    { key: "longViews", color: "#8b5cf6", kind: "Long video", top: row.longTop },
    { key: "shortViews", color: "#ff5c8a", kind: "Short", top: row.shortTop },
  ].filter((entry) => payload.some((p) => p.dataKey === entry.key));

  const periodText = range === "month" ? "this month" : "this day";

  return (
    <div className="min-w-[236px] rounded-xl border border-bp-border bg-bp-card p-2.5 shadow-xl">
      <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wide text-bp-text-secondary">
        {label} · Top views
      </p>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.key} className="flex items-center gap-2">
            <span
              className="h-7 w-7 shrink-0 overflow-hidden rounded-full"
              style={{ boxShadow: `0 0 0 2px ${entry.color}` }}
            >
              {entry.top?.userAvatar && /^(https?:|\/)/.test(entry.top.userAvatar) ? (
                <img
                  src={entry.top.userAvatar}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${entry.color}, ${entry.color}99)` }}
                >
                  {(entry.top?.userName || "U").slice(0, 1).toUpperCase()}
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-bp-text">
                {entry.top
                  ? entry.top.title
                  : `No ${entry.kind.toLowerCase()} ${periodText}`}
              </p>
              <p className="truncate text-[10px] text-bp-text-muted">
                {entry.top
                  ? `${entry.top.userName} · ${entry.top.channelName}`
                  : "—"}
              </p>
            </div>
            <span
              className="shrink-0 text-[10.5px] font-bold"
              style={{ color: entry.color }}
            >
              {formatCount(entry.top?.views || 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopVideosCard({ data }) {
  const [range, setRange] = useState("month");
  const rows = range === "month" ? data.monthwise || [] : data.daywise || [];
  const labelKey = range === "month" ? "month" : "day";

  let peak = 0;
  let peakKind = "Long videos";
  rows.forEach((row) => {
    if ((row.shortViews || 0) > peak) {
      peak = row.shortViews;
      peakKind = "Shorts";
    }
    if ((row.longViews || 0) > peak) {
      peak = row.longViews;
      peakKind = "Long videos";
    }
  });

  return (
    <article className="kpi-card kpi-card--chart kpi-teal col-span-1 min-[480px]:col-span-2 lg:col-span-3 xl:col-span-3">
      {/* artwork clipped by inner layer so the chart tooltip can escape */}
      <span className="kpi-art-clip" aria-hidden="true">
        <span className="kpi-art kpi-art-a" />
        <span className="kpi-art kpi-art-b" />
      </span>

      <div className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="kpi-icon shrink-0">
            <TrendingUp className="h-5 w-5" strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-[24px] font-bold leading-none tracking-tight">
                {formatCount(peak)}
              </p>
              <span className="kpi-chip">{peakKind} lead</span>
            </div>
            <p className="mt-2.5 text-[13.5px] font-semibold leading-tight">
              Top video views
            </p>
            <p
              className="mt-1 flex items-center gap-3 text-[11px] leading-snug"
              style={{ color: "var(--kpi-sub)" }}
            >
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
                Long
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#ff5c8a]" />
                Shorts
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center rounded-full bg-bp-elevated p-0.5">
          {[
            ["month", "Month"],
            ["day", "Day"],
          ].map(([key, labelText]) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`rounded-full px-3 py-1 text-[10.5px] font-semibold transition-colors ${
                range === key
                  ? "bg-bp-blue text-white"
                  : "text-bp-text-muted hover:text-bp-text"
              }`}
            >
              {labelText}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-3 h-[72px] w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={rows}
            margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--bp-border)"
              strokeDasharray="3 5"
              opacity={0.45}
            />
            <XAxis
              dataKey={labelKey}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--bp-text-muted)", fontSize: 9 }}
              dy={3}
              interval={0}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--bp-text-muted)", fontSize: 9 }}
              tickFormatter={formatCount}
              width={38}
            />
            <Tooltip
              cursor={{ fill: "var(--bp-elevated)", opacity: 0.55 }}
              content={<TopVideoTooltip range={range} />}
              allowEscapeView={{ x: true, y: true }}
              wrapperStyle={{ zIndex: 60, outline: "none" }}
            />
            <Bar
              dataKey="longViews"
              name="Long"
              fill="#8b5cf6"
              radius={[3, 3, 0, 0]}
              maxBarSize={16}
            />
            <Bar
              dataKey="shortViews"
              name="Shorts"
              fill="#ff5c8a"
              radius={[3, 3, 0, 0]}
              maxBarSize={16}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

// Revenue growth — mirrors FinanceDashboard's MOCK_OVERVIEW.revenue.
// The admin dashboard has no revenue API yet; swap these for API data later.
const REVENUE = { today: 12450, week: 89200, month: 342800, trend: 5.2 };
const formatINR = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

// Dummy monthly revenue trend (this year vs last year) + goal line.
// Frontend-only placeholder — replace with API data when available.
const REVENUE_TREND = [
  { month: "Nov", value: 148000, prev: 96000 },
  { month: "Dec", value: 171500, prev: 118000 },
  { month: "Jan", value: 182000, prev: 131000 },
  { month: "Feb", value: 196500, prev: 142000 },
  { month: "Mar", value: 174000, prev: 138000 },
  { month: "Apr", value: 213000, prev: 155000 },
  { month: "May", value: 228500, prev: 169000 },
  { month: "Jun", value: 209000, prev: 176000 },
  { month: "Jul", value: 245000, prev: 184000 },
  { month: "Aug", value: 261000, prev: 205000 },
  { month: "Sep", value: 238500, prev: 212000 },
  { month: "Oct", value: 342800, prev: 236000 },
];
const REVENUE_GOAL = 400000;

// TEMP switch (screenshot ke liye): true = User growth + Upload activity
// charts dummy data dikhayenge, false = real API data (data.monthly /
// data.monthlyVideos). Screenshot ke baad ise `false` kar dena.
const FORCE_DUMMY_TRENDS = false;

// Dummy user-growth trend (month-wise totals + day-wise average).
// Frontend-only placeholder — replace with API data when available.
const USER_TREND = [
  { month: "Jan", monthUsers: 1180, dayUsers: 42 },
  { month: "Feb", monthUsers: 1340, dayUsers: 48 },
  { month: "Mar", monthUsers: 1265, dayUsers: 39 },
  { month: "Apr", monthUsers: 1520, dayUsers: 55 },
  { month: "May", monthUsers: 1685, dayUsers: 51 },
  { month: "Jun", monthUsers: 1590, dayUsers: 62 },
  { month: "Jul", monthUsers: 1875, dayUsers: 58 },
  { month: "Aug", monthUsers: 2040, dayUsers: 71 },
  { month: "Sep", monthUsers: 1930, dayUsers: 66 },
  { month: "Oct", monthUsers: 2260, dayUsers: 63 },
  { month: "Nov", monthUsers: 2480, dayUsers: 84 },
  { month: "Dec", monthUsers: 2715, dayUsers: 92 },
];

// Dummy upload-growth trend (month-wise totals + day-wise average).
// Frontend-only fallback — replaced by API data.monthlyVideos when available.
const UPLOAD_TREND = [
  { month: "Nov", monthUploads: 96, dayUploads: 3 },
  { month: "Dec", monthUploads: 118, dayUploads: 4 },
  { month: "Jan", monthUploads: 132, dayUploads: 4 },
  { month: "Feb", monthUploads: 121, dayUploads: 4 },
  { month: "Mar", monthUploads: 147, dayUploads: 5 },
  { month: "Apr", monthUploads: 158, dayUploads: 5 },
  { month: "May", monthUploads: 149, dayUploads: 5 },
  { month: "Jun", monthUploads: 173, dayUploads: 6 },
  { month: "Jul", monthUploads: 186, dayUploads: 6 },
  { month: "Aug", monthUploads: 204, dayUploads: 7 },
  { month: "Sep", monthUploads: 195, dayUploads: 7 },
  { month: "Oct", monthUploads: 231, dayUploads: 8 },
];

// ── Top-video views card (8th KPI card, wide) ─────────────────────────────
// Dummy creators reused for the frontend fallback while the updated
// admin-service (data.topVideos) isn't running yet.
const TOP_VIDEO_CREATORS = [
  { title: "Sunrise at Varkala Beach", userName: "Aarav Menon", channelName: "Travel Tales India", avatar: null },
  { title: "Street Food Challenge Delhi", userName: "Riya Sharma", channelName: "FoodFlicks", avatar: null },
  { title: "Morning Workout Routine", userName: "Kabir Singh", channelName: "FitLife Hindi", avatar: null },
  { title: "Cricket Highlights — Finals", userName: "Rohan Gupta", channelName: "Sports Adda", avatar: null },
  { title: "DIY Home Makeover Ep 4", userName: "Ishita Rao", channelName: "Decor Diaries", avatar: null },
  { title: "Guitar Cover — Unplugged", userName: "Vivaan Joshi", channelName: "Music Masti", avatar: null },
];

const buildDummyTopVideo = (index, views) => {
  const creator = TOP_VIDEO_CREATORS[index % TOP_VIDEO_CREATORS.length];
  return { ...creator, views };
};

const TOP_VIDEOS_DUMMY = {
  monthwise: [
    { month: "Nov", longViews: 6200, shortViews: 11400 },
    { month: "Dec", longViews: 7800, shortViews: 15600 },
    { month: "Jan", longViews: 7100, shortViews: 14200 },
    { month: "Feb", longViews: 9400, shortViews: 13100 },
    { month: "Mar", longViews: 11200, shortViews: 18700 },
    { month: "Apr", longViews: 10400, shortViews: 22300 },
    { month: "May", longViews: 12900, shortViews: 20100 },
    { month: "Jun", longViews: 14300, shortViews: 26800 },
    { month: "Jul", longViews: 13700, shortViews: 31200 },
    { month: "Aug", longViews: 16800, shortViews: 29400 },
    { month: "Sep", longViews: 18200, shortViews: 36100 },
    { month: "Oct", longViews: 21500, shortViews: 44200 },
  ].map((row, i) => ({
    ...row,
    longTop: buildDummyTopVideo(i, row.longViews),
    shortTop: buildDummyTopVideo(i + 3, row.shortViews),
  })),
  daywise: [
    { day: "Fri", longViews: 4200, shortViews: 7800 },
    { day: "Sat", longViews: 5600, shortViews: 9400 },
    { day: "Sun", longViews: 6100, shortViews: 12100 },
    { day: "Mon", longViews: 3800, shortViews: 6900 },
    { day: "Tue", longViews: 4400, shortViews: 8200 },
    { day: "Wed", longViews: 5100, shortViews: 10400 },
    { day: "Thu", longViews: 6700, shortViews: 13600 },
  ].map((row, i) => ({
    ...row,
    longTop: buildDummyTopVideo(i + 2, row.longViews),
    shortTop: buildDummyTopVideo(i + 5, row.shortViews),
  })),
};

// Dummy copyright-case trend (month-wise totals + day-wise average).
// Frontend fallback only — replaced by API data.monthlyCopyright when the
// admin service restarts (real cases exist in the DB).
const COPYRIGHT_TREND = [
  { month: "Nov", cases: 3, dayAvg: 0.1 },
  { month: "Dec", cases: 2, dayAvg: 0.07 },
  { month: "Jan", cases: 5, dayAvg: 0.17 },
  { month: "Feb", cases: 4, dayAvg: 0.13 },
  { month: "Mar", cases: 6, dayAvg: 0.2 },
  { month: "Apr", cases: 3, dayAvg: 0.1 },
  { month: "May", cases: 7, dayAvg: 0.23 },
  { month: "Jun", cases: 5, dayAvg: 0.17 },
  { month: "Jul", cases: 8, dayAvg: 0.27 },
  { month: "Aug", cases: 6, dayAvg: 0.2 },
  { month: "Sep", cases: 9, dayAvg: 0.3 },
  { month: "Oct", cases: 12, dayAvg: 0.4 },
];

// Dummy ad-performance trend (month-wise impressions/completions + day-wise
// average). The PLAYERAD collection is empty right now, so this stays until
// real ad events start flowing — then data.monthlyAds takes over automatically.
const AD_TREND = [
  { month: "Nov", impressions: 12400, completed: 8100, dayAvg: 413 },
  { month: "Dec", impressions: 15800, completed: 10300, dayAvg: 527 },
  { month: "Jan", impressions: 13600, completed: 8900, dayAvg: 453 },
  { month: "Feb", impressions: 12900, completed: 8400, dayAvg: 430 },
  { month: "Mar", impressions: 16400, completed: 10800, dayAvg: 547 },
  { month: "Apr", impressions: 18200, completed: 12100, dayAvg: 607 },
  { month: "May", impressions: 17500, completed: 11600, dayAvg: 583 },
  { month: "Jun", impressions: 19800, completed: 13200, dayAvg: 660 },
  { month: "Jul", impressions: 21600, completed: 14500, dayAvg: 720 },
  { month: "Aug", impressions: 24300, completed: 16400, dayAvg: 810 },
  { month: "Sep", impressions: 23100, completed: 15500, dayAvg: 770 },
  { month: "Oct", impressions: 26800, completed: 18100, dayAvg: 893 },
];

function RevenueGrowthCard() {
  return (
    <article className="kpi-card kpi-teal">
      <span className="kpi-art kpi-art-a" aria-hidden="true" />
      <span className="kpi-art kpi-art-b" aria-hidden="true" />

      <div className="relative">
        <div className="kpi-icon">
          <IndianRupee className="h-5 w-5" strokeWidth={1.9} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <p className="font-display text-[28px] font-bold leading-none tracking-tight">
            {formatINR(REVENUE.month)}
          </p>
          <span className="kpi-chip">+{REVENUE.trend}%</span>
        </div>

        <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-[15px] font-semibold leading-tight">
            Revenue growth
          </p>
          <p
            className="text-[11px] leading-snug"
            style={{ color: "var(--kpi-sub)" }}
          >
            {formatINR(REVENUE.week)} this week · {formatINR(REVENUE.today)}{" "}
            today
          </p>
        </div>
      </div>

      {/* Trend line — smooth gradient area + last-year ghost line +
          dotted goal line + glowing end point (no Y-axis labels) */}
      <div className="relative mt-3 h-[104px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={REVENUE_TREND}
            margin={{ top: 10, right: 6, bottom: 0, left: 6 }}
          >
            <defs>
              <linearGradient id="revenueTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.38} />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {/* hidden Y axis — keeps the goal line inside the plot, shows no 1k/2k ticks */}
            <YAxis
              hide
              domain={[0, (max) => Math.max(max || 0, REVENUE_GOAL) * 1.14]}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--kpi-sub)", fontSize: 10 }}
              minTickGap={10}
              dy={6}
            />
            <Tooltip
              cursor={{ stroke: "var(--bp-border)", strokeDasharray: "4 4" }}
              contentStyle={{
                background: "var(--bp-card)",
                border: "1px solid var(--bp-border)",
                borderRadius: 10,
                color: "var(--bp-text)",
                fontSize: 11,
              }}
              labelStyle={{ color: "var(--bp-text-secondary)", marginBottom: 3 }}
              formatter={(value, name) => [
                `₹${Number(value || 0).toLocaleString("en-IN")}`,
                name,
              ]}
            />
            <ReferenceLine
              y={REVENUE_GOAL}
              stroke="var(--kpi-sub)"
              strokeOpacity={0.75}
              strokeDasharray="4 4"
              label={{
                value: `${formatINR(REVENUE_GOAL)} goal`,
                position: "insideTopLeft",
                fill: "var(--kpi-sub)",
                fontSize: 10,
                fontWeight: 600,
              }}
            />
            <Line
              type="monotone"
              dataKey="prev"
              name="Last year"
              stroke="var(--kpi-sub)"
              strokeOpacity={0.55}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="value"
              name="This year"
              stroke="#14b8a6"
              strokeWidth={2.5}
              fill="url(#revenueTrendFill)"
              activeDot={{ r: 3.5, strokeWidth: 0 }}
              isAnimationActive
              animationDuration={750}
            />
            {/* glowing end point — pulsing ping animation */}
            <ReferenceDot
              className="bp-ping-dot"
              x={REVENUE_TREND[REVENUE_TREND.length - 1].month}
              y={REVENUE_TREND[REVENUE_TREND.length - 1].value}
              r={4}
              fill="#14b8a6"
              stroke="#14b8a6"
              strokeOpacity={0.28}
              strokeWidth={8}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function WeeklyUsersChart({ data }) {
  return (
    <Panel
      title="User growth"
      subtitle="New accounts — month-wise & day-wise trends"
      action={
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium">
          <span className="flex items-center gap-1.5 text-bp-text-secondary">
            <span className="h-2 w-2 rounded-full bg-[#00a1ff]" />
            Month-wise
          </span>
          <span className="flex items-center gap-1.5 text-bp-text-secondary">
            <span className="h-2 w-2 rounded-full bg-[#10c996]" />
            Day-wise avg
          </span>
        </div>
      }
    >
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 4, bottom: 0, left: -12 }}
          >
            <defs>
              <linearGradient id="usersMonthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00a1ff" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#00a1ff" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--bp-border)"
              strokeDasharray="3 5"
              opacity={0.45}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--bp-text-muted)", fontSize: 11 }}
              dy={10}
            />
            {/* left axis — month-wise totals */}
            <YAxis
              yAxisId="month"
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--bp-text-muted)", fontSize: 10 }}
              tickFormatter={formatCount}
              width={42}
            />
            {/* right axis — day-wise average */}
            <YAxis
              yAxisId="day"
              orientation="right"
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--bp-text-muted)", fontSize: 10 }}
              width={28}
            />
            <Tooltip
              cursor={{ stroke: "var(--bp-border)", strokeDasharray: "4 4" }}
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
              yAxisId="month"
              type="monotone"
              dataKey="monthUsers"
              name="Month-wise"
              stroke="#00a1ff"
              strokeWidth={2.5}
              fill="url(#usersMonthFill)"
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line
              yAxisId="day"
              type="monotone"
              dataKey="dayUsers"
              name="Day-wise"
              stroke="#10c996"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function WeeklyUploadsChart({ data }) {
  return (
    <Panel
      title="Upload activity"
      subtitle="Videos published — month-wise & day-wise trends"
      action={
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium">
          <span className="flex items-center gap-1.5 text-bp-text-secondary">
            <span className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
            Month-wise
          </span>
          <span className="flex items-center gap-1.5 text-bp-text-secondary">
            <span className="h-2 w-2 rounded-full bg-[#06b6d4]" />
            Day-wise avg
          </span>
        </div>
      }
    >
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 4, bottom: 0, left: -12 }}
          >
            <defs>
              <linearGradient id="uploadsMonthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.45} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--bp-border)"
              strokeDasharray="3 5"
              opacity={0.45}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--bp-text-muted)", fontSize: 11 }}
              dy={10}
            />
            {/* left axis — month-wise upload totals */}
            <YAxis
              yAxisId="month"
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--bp-text-muted)", fontSize: 10 }}
              tickFormatter={formatCount}
              width={42}
            />
            {/* right axis — day-wise average */}
            <YAxis
              yAxisId="day"
              orientation="right"
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--bp-text-muted)", fontSize: 10 }}
              width={28}
            />
            <Tooltip
              cursor={{ stroke: "var(--bp-border)", strokeDasharray: "4 4" }}
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
              yAxisId="month"
              dataKey="monthUploads"
              name="Month-wise"
              fill="url(#uploadsMonthFill)"
              radius={[5, 5, 0, 0]}
              maxBarSize={34}
            />
            <Line
              yAxisId="day"
              type="monotone"
              dataKey="dayUploads"
              name="Day-wise"
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function WeeklyCopyrightChart({ data }) {
  return (
    <Panel
      title="Copyright cases"
      subtitle="Cases received — month-wise & day-wise trends"
      action={
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium">
          <span className="flex items-center gap-1.5 text-bp-text-secondary">
            <span className="h-2 w-2 rounded-full bg-[#f43f5e]" />
            Month-wise
          </span>
          <span className="flex items-center gap-1.5 text-bp-text-secondary">
            <span className="h-2 w-2 rounded-full bg-[#a78bfa]" />
            Day-wise avg
          </span>
        </div>
      }
    >
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 4, bottom: 0, left: -12 }}
          >
            <defs>
              <linearGradient id="copyrightMonthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--bp-border)"
              strokeDasharray="3 5"
              opacity={0.45}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--bp-text-muted)", fontSize: 11 }}
              dy={10}
            />
            {/* left axis — month-wise case totals */}
            <YAxis
              yAxisId="month"
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--bp-text-muted)", fontSize: 10 }}
              width={42}
            />
            {/* right axis — day-wise average */}
            <YAxis
              yAxisId="day"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--bp-text-muted)", fontSize: 10 }}
              width={34}
            />
            <Tooltip
              cursor={{ stroke: "var(--bp-border)", strokeDasharray: "4 4" }}
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
            {/* stepped area — suits discrete monthly case counts */}
            <Area
              yAxisId="month"
              type="stepAfter"
              dataKey="cases"
              name="Month-wise"
              stroke="#f43f5e"
              strokeWidth={2.5}
              fill="url(#copyrightMonthFill)"
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line
              yAxisId="day"
              type="monotone"
              dataKey="dayAvg"
              name="Day-wise avg"
              stroke="#a78bfa"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function WeeklyAdsChart({ data }) {
  return (
    <Panel
      title="Ad performance"
      subtitle="Impressions & completions — month-wise & day-wise trends"
      action={
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium">
          <span className="flex items-center gap-1.5 text-bp-text-secondary">
            <span className="h-2 w-2 rounded-full bg-[#38bdf8]" />
            Impressions
          </span>
          <span className="flex items-center gap-1.5 text-bp-text-secondary">
            <span className="h-2 w-2 rounded-full bg-[#10b981]" />
            Completed
          </span>
          <span className="flex items-center gap-1.5 text-bp-text-secondary">
            <span className="h-2 w-2 rounded-full bg-[#a78bfa]" />
            Day-wise avg
          </span>
        </div>
      }
    >
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 4, bottom: 0, left: -6 }}
            barGap={2}
            barCategoryGap="26%"
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--bp-border)"
              strokeDasharray="3 5"
              opacity={0.45}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--bp-text-muted)", fontSize: 11 }}
              dy={10}
            />
            {/* left axis — monthly impressions/completions */}
            <YAxis
              yAxisId="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--bp-text-muted)", fontSize: 10 }}
              tickFormatter={formatCount}
              width={46}
            />
            {/* right axis — day-wise average */}
            <YAxis
              yAxisId="day"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--bp-text-muted)", fontSize: 10 }}
              tickFormatter={formatCount}
              width={40}
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
              yAxisId="month"
              dataKey="impressions"
              name="Impressions"
              fill="#38bdf8"
              radius={[4, 4, 0, 0]}
              maxBarSize={18}
            />
            <Bar
              yAxisId="month"
              dataKey="completed"
              name="Completed"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={18}
            />
            <Line
              yAxisId="day"
              type="monotone"
              dataKey="dayAvg"
              name="Day-wise avg"
              stroke="#a78bfa"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
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
      accent: "bg-blue-500",
    },
    {
      label: "Videos uploaded",
      value: snapshot.videosUploaded,
      detail: "Uploaded today",
      icon: Upload,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      accent: "bg-amber-500",
    },
    {
      label: "Total views",
      value: snapshot.totalViews,
      detail: "Across all videos",
      icon: Eye,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      accent: "bg-emerald-500",
    },
    {
      label: "Watch time",
      value: `${formatCount(snapshot.watchTime)}h`,
      detail: "Hours in the last 30 days",
      icon: Play,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      accent: "bg-violet-500",
      raw: true,
    },
  ];

  return (
    <Panel
      title="Today's snapshot"
      subtitle="Platform activity at a glance"
      art={SNAPSHOT_ART}
    >
      <div className="grid grid-cols-2 gap-3">
        {items.map(({ label, value, detail, icon, color, bg, raw, accent }) => {
          const SnapshotIcon = icon;
          return (
            <div
              key={label}
              className="group relative overflow-hidden rounded-2xl border border-bp-border/50 bg-bp-elevated/40 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-bp-blue/40 hover:bg-bp-elevated/70 hover:shadow-bp-soft"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg} ${color} shadow-sm transition-transform duration-200 group-hover:scale-110`}
              >
                <SnapshotIcon className="h-[17px] w-[17px]" strokeWidth={2} />
              </span>
              <p className="mt-3 font-display text-xl font-bold leading-none tracking-tight text-bp-text">
                {raw ? value : formatCount(value)}
              </p>
              <p className="mt-1.5 truncate text-xs font-semibold text-bp-text-secondary">
                {label}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-bp-text-muted">
                {detail}
              </p>
              {/* per-tile accent bar */}
              <span
                className={`absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 ${accent} transition-transform duration-300 group-hover:scale-x-100`}
                aria-hidden="true"
              />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function ContentMix({ longVideos, shorts }) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const longCount = Number(longVideos) || 0;
  const shortsCount = Number(shorts) || 0;
  const total = longCount + shortsCount;
  const longShare = total ? Math.round((longCount / total) * 100) : 0;
  const shortsShare = total ? 100 - longShare : 0;

  const MIX = [
    {
      name: "Long videos",
      value: longCount,
      count: longCount,
      share: longShare,
      gradient: "linear-gradient(135deg, #00a1ff, #22d3ee)",
      badge: "bg-blue-500/10 text-blue-600 dark:text-sky-300",
    },
    {
      name: "Shorts",
      value: shortsCount,
      count: shortsCount,
      share: shortsShare,
      gradient: "linear-gradient(135deg, #a855f7, #ec4899)",
      badge: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    },
  ];

  const active = activeIndex >= 0 ? MIX[activeIndex] : null;

  return (
    <Panel title="Content mix" subtitle="Published videos by format">
      {total === 0 ? (
        <div className="flex h-[220px] items-center justify-center rounded-xl bg-bp-elevated/60 text-sm text-bp-text-muted">
          No videos to break down yet
        </div>
      ) : (
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          {/* ── Donut ─────────────────────────────────────────── */}
          <div className="relative mx-auto h-[200px] w-[200px] shrink-0 sm:mx-0">
            {/* soft glow behind the ring */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
              style={{
                background: active
                  ? active.gradient
                  : "radial-gradient(circle, rgba(0,161,255,0.35), rgba(168,85,247,0.25))",
                opacity: 0.5,
                transition: "background 400ms ease",
              }}
            />

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="mixLongGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#00a1ff" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                  <linearGradient id="mixShortsGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                {/* track ring behind the segments */}
                <Pie
                  data={[{ name: "track", value: 1 }]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={64}
                  outerRadius={96}
                  startAngle={90}
                  endAngle={-270}
                  fill="var(--bp-elevated)"
                  isAnimationActive={false}
                  stroke="none"
                />
                <Pie
                  data={MIX}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={64}
                  outerRadius={96}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={3}
                  cornerRadius={8}
                  stroke="none"
                  activeIndex={activeIndex}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(-1)}
                >
                  <Cell
                    fill="url(#mixLongGrad)"
                    fillOpacity={activeIndex === -1 || activeIndex === 0 ? 1 : 0.28}
                  />
                  <Cell
                    fill="url(#mixShortsGrad)"
                    fillOpacity={activeIndex === -1 || activeIndex === 1 ? 1 : 0.28}
                  />
                </Pie>
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    background: "var(--bp-card)",
                    border: "1px solid var(--bp-border)",
                    borderRadius: 12,
                    color: "var(--bp-text)",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--bp-text-secondary)", marginBottom: 4 }}
                  formatter={(value, name) => [formatCount(value), name]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* center readout — morphs to the hovered slice */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="font-display text-[28px] font-bold leading-none tracking-tight text-bp-text">
                {formatCount(active ? active.count : total)}
              </p>
              <p className="mt-1.5 text-[11px] font-medium text-bp-text-muted">
                {active ? active.name : "Total published"}
              </p>
              {active && (
                <span
                  className={`mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${active.badge}`}
                >
                  {active.share}%
                </span>
              )}
            </div>
          </div>

          {/* ── Legend + share bars ───────────────────────────── */}
          <div className="min-w-0 flex-1 space-y-2.5">
            {MIX.map((item, index) => (
              <div
                key={item.name}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(-1)}
                className={`cursor-default rounded-xl border p-3 transition-colors ${
                  activeIndex === index
                    ? "border-bp-border/70 bg-bp-elevated/70"
                    : "border-transparent hover:bg-bp-elevated/40"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="h-3 w-3 shrink-0 rounded-[4px]"
                      style={{ background: item.gradient }}
                    />
                    <span className="truncate text-[13px] font-medium text-bp-text-secondary">
                      {item.name}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-display text-sm font-bold text-bp-text">
                      {formatCount(item.count)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.badge}`}
                    >
                      {item.share}%
                    </span>
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-bp-elevated">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.share}%`, background: item.gradient }}
                  />
                </div>
              </div>
            ))}

            {/* combined split bar */}
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-bp-elevated">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${longShare}%`, background: MIX[0].gradient }}
              />
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${shortsShare}%`, background: MIX[1].gradient }}
              />
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
      art={USERS_ART}
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
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="group flex items-center gap-3 rounded-2xl border border-transparent bg-bp-elevated/40 p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-bp-blue/30 hover:bg-bp-elevated/80 hover:shadow-bp-soft"
            >
              <span className="relative shrink-0">
                <div className="h-11 w-11 overflow-hidden rounded-2xl bg-bp-elevated ring-2 ring-bp-border/50 transition-shadow duration-200 group-hover:ring-bp-blue/50">
                  {user.avatar && /^(https?:|\/)/.test(user.avatar) ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-bp-blue to-bp-cyan text-sm font-bold text-white">
                      {user.avatar || (user.name || "U").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                {user.status === "online" && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-bp-card bg-emerald-500" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-bp-text">
                  {user.name}
                </p>
                <p className="truncate text-xs text-bp-text-muted">
                  {user.email}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    user.status === "online"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-bp-blue/10 text-bp-blue"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      user.status === "online" ? "bg-emerald-500" : "bg-bp-blue"
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
      art={UPLOADS_ART}
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
        <div className="space-y-2">
          {videos.map((video, index) => (
            <div
              key={video.id}
              className="group flex items-center gap-3 rounded-2xl border border-transparent bg-bp-elevated/40 p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/40 hover:bg-bp-elevated/80 hover:shadow-bp-soft"
            >
              {/* mini thumbnail */}
              <div className="relative h-11 w-[68px] shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/90 to-orange-600/90">
                <span className="absolute inset-0 flex items-center justify-center text-white">
                  <Play className="h-4 w-4 fill-current" />
                </span>
                <span className="absolute right-1 top-1 rounded bg-black/50 px-1 text-[8px] font-bold text-white">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-bp-text">
                  {video.title || "Untitled video"}
                </p>
                <p className="truncate text-xs text-bp-text-muted">
                  by {video.uploadedBy || "Unknown"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-bp-blue/10 px-2 py-0.5 text-[10px] font-semibold text-bp-blue">
                  <Eye className="h-3 w-3" />
                  {formatCount(video.views)}
                </span>
                <p className="text-[10px] text-bp-text-muted">{video.time}</p>
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
  // Real month-wise growth from the API (data.monthly) — forced to dummy
  // while FORCE_DUMMY_TRENDS is true (screenshot mode).
  const monthlyData = data?.monthly || [];
  const userTrend =
    !FORCE_DUMMY_TRENDS && monthlyData.length
      ? monthlyData.map((month) => ({
          month: month.month,
          monthUsers: month.users,
          dayUsers: month.dayAvg,
        }))
      : USER_TREND;
  // Real month-wise upload data (data.monthlyVideos) — same screenshot switch.
  const monthlyUploads = data?.monthlyVideos || [];
  const uploadTrend =
    !FORCE_DUMMY_TRENDS && monthlyUploads.length
      ? monthlyUploads.map((month) => ({
          month: month.month,
          monthUploads: month.videos,
          dayUploads: month.dayAvg,
        }))
      : UPLOAD_TREND;
  // Real month-wise copyright cases (data.monthlyCopyright), dummy fallback otherwise.
  const monthlyCopyrightData = data?.monthlyCopyright || [];
  const copyrightTrend = monthlyCopyrightData.length
    ? monthlyCopyrightData.map((month) => ({
        month: month.month,
        cases: month.cases,
        dayAvg: month.dayAvg,
      }))
    : COPYRIGHT_TREND;
  // Real month-wise ad data (data.monthlyAds) — falls back to dummy while the
  // ad-events collection is still empty (all-zero rows would look broken).
  const monthlyAdsData = data?.monthlyAds || [];
  const hasRealAds = monthlyAdsData.some(
    (month) => month.impressions > 0 || month.completed > 0,
  );
  const adsTrend = hasRealAds
    ? monthlyAdsData.map((month) => ({
        month: month.month,
        impressions: month.impressions,
        completed: month.completed,
        dayAvg: month.dayAvg,
      }))
    : AD_TREND;
  const recentUsers = data?.recentUsers || [];
  const recentVideos = data?.recentUploads || [];
  const totalVideos = Number(stats.totalVideos) || 0;
  const totalShorts = Number(stats.totalShorts) || 0;
  const totalLongVideos = Number(stats.totalLongVideos) || 0;
  // Real top-video trend (data.topVideos) — dummy fallback otherwise.
  const topVideosData =
    data?.topVideos?.monthwise?.length ? data.topVideos : TOP_VIDEOS_DUMMY;
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
      accent: "kpi-blue",
    },
    {
      title: "Active users",
      value: activeUsers,
      detail: "Accounts in good standing",
      icon: UserRoundCheck,
      accent: "kpi-emerald",
      chip: `${activeRate}%`,
    },
    {
      title: "Total videos",
      value: totalVideos,
      detail: `${formatCount(snapshot.videosUploaded)} uploaded today`,
      icon: Video,
      accent: "kpi-amber",
    },
    {
      title: "Long videos",
      value: totalLongVideos,
      detail: "Published long-form content",
      icon: Play,
      accent: "kpi-violet",
    },
    {
      title: "Shorts",
      value: totalShorts,
      detail: "Published short-form content",
      icon: Film,
      accent: "kpi-pink",
    },
    {
      title: "Inquiries",
      value: workload.inquiries,
      detail: "All contact requests",
      icon: Inbox,
      accent: "kpi-cyan",
      chip:
        workload.pendingInquiries === null
          ? null
          : `${formatCount(workload.pendingInquiries)} pending`,
    },
    {
      title: "Copyright cases",
      value: workload.copyrightCases,
      detail: "All submitted cases",
      icon: ShieldCheck,
      accent: "kpi-rose",
      chip:
        workload.pendingCopyrightCases === null
          ? null
          : `${formatCount(workload.pendingCopyrightCases)} pending`,
    },
  ];

  return (
    <div className="space-y-5 pb-6 animate-fade-in sm:space-y-6">
      <div className="grid grid-cols-1 items-stretch gap-4 lg:mt-4 xl:grid-cols-2">
        <WelcomeBanner
          name={getAdminDisplayName()}
          stats={[
            { value: formatCount(stats.totalUsers), label: "Total Users" },
            { value: `${activeRate}%`, label: "Active Rate" },
          ]}
          updated={lastUpdated}
          refreshing={loading || workload.loading}
          onRefresh={refreshDashboard}
        />
        <RevenueGrowthCard />
      </div>

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
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
        <TopVideosCard data={topVideosData} />
      </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <WeeklyUsersChart data={userTrend} />
      <WeeklyUploadsChart data={uploadTrend} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <WeeklyCopyrightChart data={copyrightTrend} />
        <WeeklyAdsChart data={adsTrend} />
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
