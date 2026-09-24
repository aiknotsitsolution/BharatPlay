import {
  Users, ShoppingCart, DollarSign, Video, Film, UserPlus, Upload,
  Eye, TrendingUp, TrendingDown, Clock, ArrowUpRight, Play,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useDashboardData from "../../hooks/useDashboardData";
import PageHeader from "../../components/layout/PageHeader";

const getAdminDisplayName = () => {
  try {
    const savedUser = JSON.parse(localStorage.getItem("adminUser") || "null");
    return savedUser?.name || "Admin";
  } catch { return "Admin"; }
};

const STAT_CONFIG = [
  { key: "revenue", title: "Total Revenue", value: "₹1,24,890", change: "+12.5%", positive: true, icon: DollarSign, iconBg: "bg-bp-blue/10", iconColor: "text-bp-blue" },
  { key: "orders", title: "New Orders", value: "342", change: "+8.2%", positive: true, icon: ShoppingCart, iconBg: "bg-bp-blue/10", iconColor: "text-bp-blue" },
  { key: "users", title: "Active Users", dynamic: "activeUsers", icon: Users, iconBg: "bg-bp-blue/10", iconColor: "text-bp-blue" },
  { key: "videos", title: "Videos", dynamic: "totalLongVideos", icon: Video, iconBg: "bg-bp-blue/10", iconColor: "text-bp-blue" },
  { key: "shorts", title: "Shorts", dynamic: "totalShorts", icon: Film, iconBg: "bg-bp-blue/10", iconColor: "text-bp-blue" },
];

const formatRelativeTime = (iso) => {
  if (!iso) return "just now";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const formatCount = (n) => {
  const v = Number(n) || 0;
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return v.toLocaleString();
};

/* ═══════════════ STAT CARD ═══════════════ */
const ACCENT_STYLE = {
  "text-bp-blue": { borderLeftColor: "var(--bp-blue)" },
  "text-bp-cyan": { borderLeftColor: "var(--bp-cyan)" },
  "text-bp-orange": { borderLeftColor: "var(--bp-orange)" },
  "text-bp-yellow": { borderLeftColor: "var(--bp-yellow)" },
};

function StatCard({ title, value, change, positive, icon: Icon, iconBg, iconColor }) {
  const accent = ACCENT_STYLE[iconColor] || {};
  const accentStyle = { borderLeftWidth: 4, borderLeftStyle: "solid", ...accent };
  return (
    <div className="stat-card" style={accentStyle}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] text-bp-text-secondary font-medium leading-snug">{title}</p>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={1.8} />
        </div>
      </div>
      <p className="mt-2 text-[28px] font-bold text-bp-text font-display tracking-tight leading-none">{value}</p>
      {change && (
        <p className={`mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold ${positive ? "text-emerald-600" : "text-red-600"}`}>
          {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {change}
          <span className="text-bp-text-muted font-normal">from last month</span>
        </p>
      )}
    </div>
  );
}

/* ═══════════════ WEEKLY CHART ═══════════════ */
function WeeklyChart({ data, maxUsers }) {
  const maxVal = Math.max(maxUsers, ...data.map(d => d.videos), 1);
  return (
    <div className="bp-card h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="section-title">Weekly Overview</h3>
          <p className="text-[12px] text-bp-text-muted mt-0.5">Users & uploads this week</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-bp-blue" />
            <span className="text-[11px] text-bp-text-muted">Users</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-bp-orange" />
            <span className="text-[11px] text-bp-text-muted">Videos</span>
          </div>
        </div>
      </div>

      <div className="flex items-end gap-2 flex-1 min-h-[200px]">
        {data.map((item) => (
          <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <div className="w-full flex items-end justify-center gap-[3px] h-[160px]">
              <div
                className="chart-bar w-full max-w-[14px] bg-bp-blue"
                style={{ height: `${(item.users / maxVal) * 100}%` }}
                title={`${item.users} users`}
              />
              <div
                className="chart-bar w-full max-w-[14px] bg-bp-orange/80"
                style={{ height: `${(item.videos / maxVal) * 100}%` }}
                title={`${item.videos} videos`}
              />
            </div>
            <span className="text-[11px] font-medium text-bp-text-muted">{item.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ SNAPSHOT ═══════════════ */
function TodaySnapshot({ snapshot }) {
  const items = [
    { label: "New Users", sub: "Joined today", value: snapshot.newUsers ?? 0, icon: UserPlus, color: "text-bp-blue", bg: "bg-bp-blue/10" },
    { label: "Videos Uploaded", sub: "Uploaded today", value: snapshot.videosUploaded ?? 0, icon: Upload, color: "text-bp-blue", bg: "bg-bp-blue/10" },
    { label: "Total Views", sub: "Across all videos", value: formatCount(snapshot.totalViews), icon: Eye, color: "text-bp-blue", bg: "bg-bp-blue/10" },
    { label: "Watch Time", sub: "Hours watched", value: `${snapshot.watchTime ?? 0}h`, icon: Play, color: "text-bp-blue", bg: "bg-bp-blue/10" },
  ];

  return (
    <div className="bp-card h-full p-6">
      <h3 className="section-title mb-4">Today's Snapshot</h3>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="snapshot-row">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-lg shrink-0 ${item.bg}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-bp-text truncate">{item.label}</p>
                <p className="text-[11px] text-bp-text-muted">{item.sub}</p>
              </div>
            </div>
            <p className="text-[18px] font-bold text-bp-text tracking-tight shrink-0">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ RECENT SECTIONS ═══════════════ */
function RecentUsers({ users, onNavigate }) {
  return (
    <div className="bp-card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Recent Users</h3>
          <button onClick={onNavigate} className="text-[12px] font-medium text-bp-blue hover:text-bp-blue/80 flex items-center gap-1 transition-colors">
            View all <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-0.5">
          {users.map((user) => (
            <div key={user.id} className="list-item">
              <div className="relative shrink-0">
                {user.avatar && /^(https?:|\/)/.test(user.avatar) ? (
                  <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-bp-navy text-white flex items-center justify-center text-[11px] font-bold">
                    {user.avatar}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-bp-text truncate">{user.name}</p>
                <p className="text-[12px] text-bp-text-muted truncate">{user.email}</p>
              </div>
              <span className="text-[11px] text-bp-text-muted shrink-0">{user.joined}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecentUploads({ videos, onNavigate }) {
  return (
    <div className="bp-card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Recent Uploads</h3>
          <button onClick={onNavigate} className="text-[12px] font-medium text-bp-blue hover:text-bp-blue/80 flex items-center gap-1 transition-colors">
            View all <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-0.5">
          {videos.map((video) => (
            <div key={video.id} className="list-item">
              <div className="w-10 h-10 rounded-lg bg-bp-orange/10 flex items-center justify-center shrink-0">
                <Play className="w-4 h-4 text-bp-orange" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-bp-text truncate">{video.title}</p>
                <p className="text-[12px] text-bp-text-muted truncate">
                  by <span className="text-bp-text-secondary font-medium">{video.uploadedBy}</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-[11px] text-bp-text-muted">
                  <Eye className="w-3 h-3" /> {video.views.toLocaleString()}
                </div>
                <span className="text-[11px] text-bp-text-muted">{video.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ MAIN DASHBOARD ═══════════════ */
export default function Dashboard() {
  const navigate = useNavigate();
  const { data, generatedAt, loading, error, refetch } = useDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-bp-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-bp-text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error === "unauthorized") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-bp-text font-medium">Session expired</p>
          <button onClick={() => { localStorage.removeItem("adminToken"); localStorage.removeItem("adminUser"); window.location.href = "/login"; }}
            className="px-4 py-2 text-[13px] bg-bp-blue hover:bg-bp-blue/90 text-white rounded-lg transition-colors font-medium">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={refetch} className="px-4 py-2 text-[13px] bg-bp-card hover:bg-bp-elevated text-bp-text rounded-lg border border-bp-border transition-colors font-medium">
            Retry
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
  const maxUsers = Math.max(...weeklyData.map((d) => d.users), 1);
  const lastUpdated = generatedAt ? formatRelativeTime(generatedAt) : "just now";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        subtitle={
          <>Welcome back, <span className="font-medium text-bp-text">{getAdminDisplayName()}</span>. Here's what's happening today.</>
        }
      >
        <div className="flex items-center gap-1.5 text-[12px] text-bp-text-muted bg-bp-elevated px-3 py-1.5 rounded-full shrink-0">
          <Clock className="w-3.5 h-3.5" />
          <span>Updated {lastUpdated}</span>
        </div>
      </PageHeader>

      {/* Stat Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {STAT_CONFIG.map((s) => (
          <StatCard
            key={s.key}
            title={s.title}
            value={s.dynamic ? (stats[s.dynamic] ?? 0).toLocaleString() : s.value}
            change={s.change}
            positive={s.positive}
            icon={s.icon}
            iconBg={s.iconBg}
            iconColor={s.iconColor}
          />
        ))}
      </div>

      {/* Chart + Snapshot */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <WeeklyChart data={weeklyData} maxUsers={maxUsers} />
        </div>
        <div>
          <TodaySnapshot snapshot={snapshot} />
        </div>
      </div>

      {/* Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentUsers users={recentUsers} onNavigate={() => navigate("/alluser")} />
        <RecentUploads videos={recentVideos} onNavigate={() => navigate("/uploads")} />
      </div>
    </div>
  );
}