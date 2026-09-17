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
  <div className="stat-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-bp-text-secondary font-medium">{title}</p>
        <p className="text-2xl font-bold text-bp-text mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  </div>
);

const statusColors = {
  pending: "bg-bp-yellow/15 text-bp-yellow border-bp-yellow/30",
  under_review: "bg-bp-blue/15 text-bp-blue border-bp-blue/30",
  takedown_approved: "bg-red-500/15 text-red-400 border-red-500/30",
  takedown_rejected: "bg-bp-text-muted/15 text-bp-text-muted border-bp-text-muted/30",
  disputed: "bg-bp-orange/15 text-bp-orange border-bp-orange/30",
  dispute_under_review: "bg-bp-cyan/15 text-bp-cyan border-bp-cyan/30",
  dispute_upheld: "bg-red-500/15 text-red-400 border-red-500/30",
  dispute_overturned: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  withdrawn: "bg-bp-text-muted/15 text-bp-text-muted border-bp-text-muted/30",
};

const priorityColors = {
  low: "text-bp-text-muted",
  medium: "text-bp-yellow",
  high: "text-bp-orange",
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

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-bp-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-bp-text-secondary">Loading copyright dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-red-400 font-medium">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 text-sm bg-bp-card hover:bg-bp-elevated text-white rounded-lg border border-bp-border">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-bp-text">Copyright Management</h1>
          <p className="text-[13px] text-bp-text-secondary mt-1">Manage copyright cases, strikes, and disputes</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 text-sm bg-bp-card hover:bg-bp-elevated text-white rounded-lg border border-bp-border transition-colors">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Cases" value={stats?.cases?.total ?? 0} icon={FileText} color="text-bp-blue" bg="bg-bp-blue/15" />
        <StatCard title="Pending Cases" value={stats?.cases?.pending ?? 0} icon={Clock} color="text-bp-yellow" bg="bg-bp-yellow/15" />
        <StatCard title="Active Strikes" value={stats?.strikes?.active ?? 0} icon={AlertTriangle} color="text-red-400" bg="bg-red-500/15" />
        <StatCard title="Resolved Cases" value={stats?.cases?.resolved ?? 0} icon={CheckCircle} color="text-emerald-400" bg="bg-emerald-500/15" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="bg-bp-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-bp-text mb-5">Quick Actions</h2>
          <div className="space-y-3">
            {hasFeature("canCreateCopyrightCase") && (
              <button onClick={() => navigate("/copyright/cases/new")} className="w-full flex items-center justify-between p-3.5 bg-bp-blue/10 rounded-xl hover:bg-bp-blue/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-bp-blue/20 rounded-lg"><Plus className="w-4 h-4 text-bp-blue" /></div>
                  <span className="text-sm font-medium text-white">Create New Case</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-bp-blue" />
              </button>
            )}
            <button onClick={() => navigate("/copyright/cases")} className="w-full flex items-center justify-between p-3.5 bg-bp-blue/10 rounded-xl hover:bg-bp-blue/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-bp-blue/20 rounded-lg"><FileText className="w-4 h-4 text-bp-blue" /></div>
                <span className="text-sm font-medium text-white">View All Cases</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-bp-blue" />
            </button>
            <button onClick={() => navigate("/copyright/strikes")} className="w-full flex items-center justify-between p-3.5 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg"><AlertTriangle className="w-4 h-4 text-red-400" /></div>
                <span className="text-sm font-medium text-white">View All Strikes</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-red-400" />
            </button>
            <button onClick={() => navigate("/copyright/cases?status=pending")} className="w-full flex items-center justify-between p-3.5 bg-bp-yellow/10 rounded-xl hover:bg-bp-yellow/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-bp-yellow/20 rounded-lg"><Clock className="w-4 h-4 text-bp-yellow" /></div>
                <span className="text-sm font-medium text-white">Pending Cases</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-bp-yellow" />
            </button>
          </div>
        </div>

        <div className="xl:col-span-2 bg-bp-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-bp-text flex items-center gap-2">
              <Shield className="w-5 h-5 text-bp-blue" />
              Recent Cases
            </h2>
            <button onClick={() => navigate("/copyright/cases")} className="text-sm text-bp-blue hover:text-bp-cyan font-medium flex items-center gap-1 transition-colors">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentCases.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-bp-border mx-auto mb-3" />
              <p className="text-bp-text-muted">No copyright cases yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCases.map((c) => (
                <div
                  key={c._id}
                  onClick={() => navigate(`/copyright/cases/${c._id}`)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-bp-elevated transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-bp-elevated rounded-lg">
                      <FileText className="w-4 h-4 text-bp-text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{c.caseNumber}</p>
                      <p className="text-sm text-bp-text-muted truncate">{c.claimant?.name} â†’ {c.content?.title || "Untitled"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${statusColors[c.status] || "bg-bp-text-muted/15 text-bp-text-muted border-bp-text-muted/30"}`}>
                      {c.status?.replace(/_/g, " ")}
                    </span>
                    <span className={`text-xs font-medium ${priorityColors[c.priority] || "text-bp-text-muted"}`}>
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
