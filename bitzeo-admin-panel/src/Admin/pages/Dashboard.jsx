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
  } catch {
    return "Admin";
  }
};

const STAT_CONFIG = [
  {
    key: "revenue",
    title: "Total Revenue",
    value: "₹1,24,890",
    change: "+12.5%",
    positive: true,
    icon: DollarSign,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    key: "orders",
    title: "New Payment",
    value: "342",
    change: "+8.2%",
    positive: true,
    icon: ShoppingCart,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    key: "users",
    title: "Active Users",
    dynamic: "activeUsers",
    icon: Users,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    key: "videos",
    title: "Videos",
    dynamic: "totalLongVideos",
    icon: Video,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    key: "shorts",
    title: "Shorts",
    dynamic: "totalShorts",
    icon: Film,
    iconBg: "bg-pink-50",
    iconColor: "text-pink-600",
  },
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
function StatCard({ title, value, change, positive, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-slate-500 font-medium">{title}</p>
          <p className="mt-2 text-[26px] font-bold text-slate-800 tracking-tight leading-none">
            {value}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={1.8} />
        </div>
      </div>

      {change && (
        <div className="mt-4 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-0.5 rounded-full ${
              positive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {positive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {change}
          </span>
          <span className="text-[12px] text-slate-400">from last month</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ WEEKLY CHART ═══════════════ */
function WeeklyChart({ data, maxUsers }) {
  const maxVal = Math.max(maxUsers, ...data.map((d) => d.videos), 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-semibold text-slate-800">Weekly Overview</h3>
          <p className="text-[12px] text-slate-400 mt-0.5">Users & uploads this week</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-[12px] text-slate-500">Users</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            <span className="text-[12px] text-slate-500">Videos</span>
          </div>
        </div>
      </div>

      <div className="flex items-end gap-3 flex-1 min-h-[200px]">
        {data.map((item) => (
          <div
            key={item.day}
            className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
          >
            <div className="w-full flex items-end justify-center gap-1.5 h-[160px]">
              <div
                className="w-full max-w-[16px] rounded-t-md bg-blue-500/90 transition-all hover:bg-blue-600"
                style={{ height: `${(item.users / maxVal) * 100}%` }}
                title={`${item.users} users`}
              />
              <div
                className="w-full max-w-[16px] rounded-t-md bg-orange-400/90 transition-all hover:bg-orange-500"
                style={{ height: `${(item.videos / maxVal) * 100}%` }}
                title={`${item.videos} videos`}
              />
            </div>
            <span className="text-[12px] font-medium text-slate-400">{item.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ SNAPSHOT ═══════════════ */
function TodaySnapshot({ snapshot }) {
  const items = [
    {
      label: "New Users",
      sub: "Joined today",
      value: snapshot.newUsers ?? 0,
      icon: UserPlus,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Videos Uploaded",
      sub: "Uploaded today",
      value: snapshot.videosUploaded ?? 0,
      icon: Upload,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Total Views",
      sub: "Across all videos",
      value: formatCount(snapshot.totalViews),
      icon: Eye,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Watch Time",
      sub: "Hours watched",
      value: `${snapshot.watchTime ?? 0}h`,
      icon: Play,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-full p-6">
      <h3 className="text-[16px] font-semibold text-slate-800 mb-5">Today's Snapshot</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.bg}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] font-medium text-slate-800 truncate">{item.label}</p>
                <p className="text-[12px] text-slate-400">{item.sub}</p>
              </div>
            </div>
            <p className="text-[18px] font-bold text-slate-800 tracking-tight shrink-0">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ RECENT SECTIONS ═══════════════ */
function RecentUsers({ users, onNavigate }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[16px] font-semibold text-slate-800">Recent Users</h3>
          <button
            onClick={onNavigate}
            className="text-[13px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            View all <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="relative shrink-0">
                {user.avatar && /^(https?:|\/)/.test(user.avatar) ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-[12px] font-bold">
                    {user.avatar}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium text-slate-800 truncate">{user.name}</p>
                <p className="text-[12px] text-slate-400 truncate">{user.email}</p>
              </div>
              <span className="text-[12px] text-slate-400 shrink-0">{user.joined}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecentUploads({ videos, onNavigate }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[16px] font-semibold text-slate-800">Recent Uploads</h3>
          <button
            onClick={onNavigate}
            className="text-[13px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            View all <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <Play className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium text-slate-800 truncate">{video.title}</p>
                <p className="text-[12px] text-slate-400 truncate">
                  by <span className="text-slate-600 font-medium">{video.uploadedBy}</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center justify-end gap-1 text-[12px] text-slate-500">
                  <Eye className="w-3.5 h-3.5" /> {video.views.toLocaleString()}
                </div>
                <span className="text-[12px] text-slate-400">{video.time}</span>
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
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error === "unauthorized") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-slate-800 font-medium">Session expired</p>
          <button
            onClick={() => {
              localStorage.removeItem("adminToken");
              localStorage.removeItem("adminUser");
              window.location.href = "/login";
            }}
            className="px-5 py-2.5 text-[13px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium shadow-sm"
          >
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
          <button
            onClick={refetch}
            className="px-5 py-2.5 text-[13px] bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition-colors font-medium shadow-sm"
          >
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
          <>
            Welcome back,{" "}
            <span className="font-medium text-slate-800">{getAdminDisplayName()}</span>.
            Here's what's happening today.
          </>
        }
      >
        <div className="flex items-center gap-1.5 text-[12px] text-slate-500 bg-white border border-slate-100 px-3.5 py-1.5 rounded-full shadow-sm shrink-0">
          <Clock className="w-3.5 h-3.5" />
          <span>Updated {lastUpdated}</span>
        </div>
      </PageHeader>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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