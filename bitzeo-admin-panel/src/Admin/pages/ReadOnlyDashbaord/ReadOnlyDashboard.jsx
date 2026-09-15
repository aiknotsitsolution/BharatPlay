import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Users, Video, TrendingUp, Clock, Shield, ArrowUpRight } from "lucide-react";
import useDashboardData from "../../../hooks/useDashboardData";

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-400 font-medium">{title}</p>
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
      setStats({
        activeUsers: data.stats.activeUsers || 0,
        totalVideos: data.stats.totalVideos || 0,
      });
    }
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading read-only dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-red-400 font-medium">{error}</p>
          <button onClick={refetch} className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Read-Only Dashboard</h1>
          <p className="text-gray-400 mt-0.5">
            View-only access — no modifications allowed
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg">
          <Eye className="w-4 h-4" />
          <span>Read-Only Mode</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.activeUsers.toLocaleString()}
          icon={Users}
          color="text-violet-400"
          bg="bg-violet-500/15"
        />
        <StatCard
          title="Videos Uploaded"
          value={stats.totalVideos.toLocaleString()}
          icon={Video}
          color="text-blue-400"
          bg="bg-blue-500/15"
        />
        <StatCard
          title="Platform Status"
          value="Active"
          icon={TrendingUp}
          color="text-emerald-400"
          bg="bg-emerald-500/15"
        />
        <StatCard
          title="Last Updated"
          value={generatedAt ? new Date(generatedAt).toLocaleTimeString() : "—"}
          icon={Clock}
          color="text-amber-400"
          bg="bg-amber-500/15"
        />
      </div>

      {/* View-Only Navigation */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-5">Available Views</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/alluser")}
            className="flex items-center justify-between p-3.5 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-gray-200">View Users</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => navigate("/video")}
            className="flex items-center justify-between p-3.5 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Video className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-200">View Videos</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => navigate("/copyright")}
            className="flex items-center justify-between p-3.5 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-gray-200">View Copyright</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => navigate("/uploads")}
            className="flex items-center justify-between p-3.5 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-gray-200">View Uploads</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <p className="text-center text-gray-500 text-sm mt-4">
        Read-only mode — all data is view-only, no modifications allowed
      </p>
    </div>
  );
}
