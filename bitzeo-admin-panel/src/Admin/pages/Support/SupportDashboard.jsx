import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Headphones,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  ArrowUpRight,
  RefreshCw,
  Eye,
  FileText,
} from "lucide-react";
import useDashboardData from "../../../hooks/useDashboardData";

const StatCard = ({ title, value, change, icon: Icon, color, bg }) => (
  <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {change && (
          <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${
            change.startsWith("+") ? "text-emerald-400" : "text-red-400"
          }`}>
            <TrendingUp className="w-3.5 h-3.5" />
            {change} from last week
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  </div>
);

export default function SupportDashboard() {
  const navigate = useNavigate();
  const { data, generatedAt, loading, error, refetch } = useDashboardData();
  const [stats, setStats] = useState({ activeUsers: 0 });

  useEffect(() => {
    if (data?.stats) {
      setStats({ activeUsers: data.stats.activeUsers || 0 });
    }
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading support dashboard...</p>
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
          <h1 className="text-2xl font-bold text-white">Support Dashboard</h1>
          <p className="text-gray-400 mt-0.5">
            User assistance and content moderation tools
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Active Users"
          value={stats.activeUsers.toLocaleString()}
          icon={Users}
          color="text-violet-400"
          bg="bg-violet-500/15"
        />
        <StatCard
          title="Open Issues"
          value="12"
          icon={AlertCircle}
          color="text-red-400"
          bg="bg-red-500/15"
        />
        <StatCard
          title="Resolved Today"
          value="8"
          change="+15%"
          icon={CheckCircle}
          color="text-emerald-400"
          bg="bg-emerald-500/15"
        />
        <StatCard
          title="Avg Response"
          value="18m"
          icon={Clock}
          color="text-blue-400"
          bg="bg-blue-500/15"
        />
      </div>

      {/* Quick Actions + Support Metrics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Quick Actions */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/alluser")}
              className="w-full flex items-center justify-between p-3.5 bg-violet-500/10 border border-violet-500/20 rounded-xl hover:bg-violet-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                  <Users className="w-4 h-4 text-violet-400" />
                </div>
                <span className="text-sm font-medium text-gray-200">View Users</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-violet-400" />
            </button>
            <button
              onClick={() => navigate("/video")}
              className="w-full flex items-center justify-between p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Eye className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-gray-200">Review Videos</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-blue-400" />
            </button>
            <button
              onClick={() => navigate("/copyright")}
              className="w-full flex items-center justify-between p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Shield className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-sm font-medium text-gray-200">Manage Copyright Cases</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-indigo-400" />
            </button>
            <button
              onClick={() => navigate("/copyright/cases?status=pending")}
              className="w-full flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <FileText className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-sm font-medium text-gray-200">Pending Copyright Cases</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>

        {/* Support Info */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Support Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-500">Customer Satisfaction</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">4.8/5.0</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-500">Resolution Rate</p>
              <p className="text-xl font-bold text-blue-400 mt-1">94.2%</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-500">Escalations This Week</p>
              <p className="text-xl font-bold text-amber-400 mt-1">3</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-500">Pending Reviews</p>
              <p className="text-xl font-bold text-red-400 mt-1">5</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-gray-500 text-sm mt-4">
        Support module — user assistance and content moderation
      </p>
    </div>
  );
}
