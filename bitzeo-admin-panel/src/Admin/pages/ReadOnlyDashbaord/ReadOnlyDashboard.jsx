import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Users, Video, TrendingUp, Clock, Shield, ArrowUpRight } from "lucide-react";
import useDashboardData from "../../../hooks/useDashboardData";

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-bp-card p-5 rounded-2xl border border-bp-border">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-bp-text-secondary font-medium">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  </div>
);

export default function ReadOnlyDashboard() {
  const navigate = useNavigate();
  const { data, generatedAt, loading, error, refetch } = useDashboardData();
  const [stats, setStats] = useState({ activeUsers: 0, totalVideos: 0 });

  useEffect(() => {
    if (data?.stats) {
      setStats({ activeUsers: data.stats.activeUsers || 0, totalVideos: data.stats.totalVideos || 0 });
    }
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-bp-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-bp-text-secondary">Loading read-only dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-red-400 font-medium">{error}</p>
          <button onClick={refetch} className="px-4 py-2 text-sm bg-bp-card hover:bg-bp-elevated text-white rounded-lg border border-bp-border">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Read-Only Dashboard</h1>
          <p className="text-[13px] text-bp-text-secondary mt-1">View-only access — no modifications allowed</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-bp-text-secondary bg-bp-card border border-bp-border px-3 py-1.5 rounded-lg">
          <Eye className="w-4 h-4" />
          <span>Read-Only Mode</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.activeUsers.toLocaleString()} icon={Users} color="text-bp-blue" bg="bg-bp-blue/15" />
        <StatCard title="Videos Uploaded" value={stats.totalVideos.toLocaleString()} icon={Video} color="text-bp-orange" bg="bg-bp-orange/15" />
        <StatCard title="Platform Status" value="Active" icon={TrendingUp} color="text-emerald-400" bg="bg-emerald-500/15" />
        <StatCard title="Last Updated" value={generatedAt ? new Date(generatedAt).toLocaleTimeString() : "â€”"} icon={Clock} color="text-bp-yellow" bg="bg-bp-yellow/15" />
      </div>

      <div className="bg-bp-card rounded-2xl border border-bp-border p-6">
        <h2 className="text-lg font-semibold text-white mb-5">Available Views</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={() => navigate("/alluser")} className="flex items-center justify-between p-3.5 bg-bp-elevated border border-bp-border rounded-xl hover:bg-bp-border transition-colors">
            <div className="flex items-center gap-3"><Users className="w-4 h-4 text-bp-blue" /><span className="text-sm font-medium text-white">View Users</span></div>
            <ArrowUpRight className="w-4 h-4 text-bp-text-muted" />
          </button>
          <button onClick={() => navigate("/video")} className="flex items-center justify-between p-3.5 bg-bp-elevated border border-bp-border rounded-xl hover:bg-bp-border transition-colors">
            <div className="flex items-center gap-3"><Video className="w-4 h-4 text-bp-orange" /><span className="text-sm font-medium text-white">View Videos</span></div>
            <ArrowUpRight className="w-4 h-4 text-bp-text-muted" />
          </button>
          <button onClick={() => navigate("/copyright")} className="flex items-center justify-between p-3.5 bg-bp-elevated border border-bp-border rounded-xl hover:bg-bp-border transition-colors">
            <div className="flex items-center gap-3"><Shield className="w-4 h-4 text-bp-cyan" /><span className="text-sm font-medium text-white">View Copyright</span></div>
            <ArrowUpRight className="w-4 h-4 text-bp-text-muted" />
          </button>
          <button onClick={() => navigate("/uploads")} className="flex items-center justify-between p-3.5 bg-bp-elevated border border-bp-border rounded-xl hover:bg-bp-border transition-colors">
            <div className="flex items-center gap-3"><Eye className="w-4 h-4 text-emerald-400" /><span className="text-sm font-medium text-white">View Uploads</span></div>
            <ArrowUpRight className="w-4 h-4 text-bp-text-muted" />
          </button>
        </div>
      </div>

      <p className="text-center text-bp-text-muted text-sm mt-4">Read-only mode â€” all data is view-only, no modifications allowed</p>
    </div>
  );
}
