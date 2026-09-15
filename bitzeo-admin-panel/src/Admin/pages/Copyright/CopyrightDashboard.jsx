import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  ArrowUpRight,
  RefreshCw,
  Plus,
} from "lucide-react";
import { fetchCopyrightStats, fetchCopyrightCases } from "../../../api";
import { hasFeature } from "../../../config/roleConfig";

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all">
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

const statusColors = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  under_review: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  takedown_approved: "bg-red-500/15 text-red-400 border-red-500/30",
  takedown_rejected: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  disputed: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  dispute_under_review: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  dispute_upheld: "bg-red-500/15 text-red-400 border-red-500/30",
  dispute_overturned: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  withdrawn: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

const priorityColors = {
  low: "text-gray-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  urgent: "text-red-400",
};

export default function CopyrightDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, casesRes] = await Promise.all([
        fetchCopyrightStats(),
        fetchCopyrightCases({ limit: 5, sort: "-createdAt" }),
      ]);
      setStats(statsRes.data?.data || {});
      setRecentCases(casesRes.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch copyright data:", err);
      setError("Failed to load copyright dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400">Loading copyright dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-red-400 font-medium">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
          >
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
          <h1 className="text-2xl font-bold text-white">Copyright Management</h1>
          <p className="text-gray-400 mt-0.5">
            Manage copyright cases, strikes, and disputes
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Cases"
          value={stats?.cases?.total ?? 0}
          icon={FileText}
          color="text-indigo-400"
          bg="bg-indigo-500/15"
        />
        <StatCard
          title="Pending Cases"
          value={stats?.cases?.pending ?? 0}
          icon={Clock}
          color="text-yellow-400"
          bg="bg-yellow-500/15"
        />
        <StatCard
          title="Active Strikes"
          value={stats?.strikes?.active ?? 0}
          icon={AlertTriangle}
          color="text-red-400"
          bg="bg-red-500/15"
        />
        <StatCard
          title="Resolved Cases"
          value={stats?.cases?.resolved ?? 0}
          icon={CheckCircle}
          color="text-emerald-400"
          bg="bg-emerald-500/15"
        />
      </div>

      {/* Quick Actions + Recent Cases */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Quick Actions */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Quick Actions</h2>
          <div className="space-y-3">
            {hasFeature("canCreateCopyrightCase") && (
              <button
                onClick={() => navigate("/copyright/cases/new")}
                className="w-full flex items-center justify-between p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Plus className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-200">Create New Case</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-indigo-400" />
              </button>
            )}
            <button
              onClick={() => navigate("/copyright/cases")}
              className="w-full flex items-center justify-between p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <FileText className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-sm font-medium text-gray-200">View All Cases</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-indigo-400" />
            </button>
            <button
              onClick={() => navigate("/copyright/strikes")}
              className="w-full flex items-center justify-between p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-sm font-medium text-gray-200">View All Strikes</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-red-400" />
            </button>
            <button
              onClick={() => navigate("/copyright/cases?status=pending")}
              className="w-full flex items-center justify-between p-3.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl hover:bg-yellow-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock className="w-4 h-4 text-yellow-400" />
                </div>
                <span className="text-sm font-medium text-gray-200">Pending Cases</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-yellow-400" />
            </button>
          </div>
        </div>

        {/* Recent Cases */}
        <div className="xl:col-span-2 bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Recent Cases
            </h2>
            <button
              onClick={() => navigate("/copyright/cases")}
              className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentCases.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No copyright cases yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCases.map((c) => (
                <div
                  key={c._id}
                  onClick={() => navigate(`/copyright/cases/${c._id}`)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-800/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-gray-800 rounded-lg">
                      <FileText className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-200 truncate">
                        {c.caseNumber}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {c.claimant?.name} → {c.content?.title || "Untitled"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${
                        statusColors[c.status] || "bg-gray-500/15 text-gray-400 border-gray-500/30"
                      }`}
                    >
                      {c.status?.replace(/_/g, " ")}
                    </span>
                    <span className={`text-xs font-medium ${priorityColors[c.priority] || "text-gray-400"}`}>
                      {c.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
