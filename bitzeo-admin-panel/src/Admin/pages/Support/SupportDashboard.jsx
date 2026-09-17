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
  <div className="stat-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-bp-text-secondary font-medium">{title}</p>
        <p className="text-2xl font-bold text-bp-text mt-1">{value}</p>
        {change && (
          <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${
            change.startsWith("+") ? "text-emerald-600" : "text-red-600"
          }`}>
            <TrendingUp className="w-3.5 h-3.5" />
            {change} from last week
          </p>
        )}
      </div>
      <div className={`p-2.5 rounded-lg ${bg}`}>
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
          <div className="w-7 h-7 border-2 border-bp-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-bp-text-secondary">Loading support dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={refetch} className="px-4 py-2 text-sm bg-bp-card hover:bg-bp-elevated text-bp-text rounded-lg border border-bp-border">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-bp-text tracking-tight">Support Dashboard</h1>
          <p className="text-[13px] text-bp-text-secondary mt-1">User assistance and content moderation tools</p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-bp-card hover:bg-bp-elevated text-bp-text border border-bp-border rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Active Users" value={stats.activeUsers.toLocaleString()} icon={Users} color="text-bp-blue" bg="bg-bp-blue/10" />
        <StatCard title="Open Issues" value="12" icon={AlertCircle} color="text-red-600" bg="bg-red-50" />
        <StatCard title="Resolved Today" value="8" change="+15%" icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard title="Avg Response" value="18m" icon={Clock} color="text-bp-cyan" bg="bg-bp-cyan/10" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bp-card p-6">
          <h2 className="text-base font-semibold text-bp-text mb-5">Quick Actions</h2>
          <div className="space-y-2.5">
            <button onClick={() => navigate("/alluser")} className="w-full flex items-center justify-between p-3.5 bg-bp-elevated border border-bp-border rounded-xl hover:bg-bp-border transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg"><Users className="w-4 h-4 text-bp-blue" /></div>
                <span className="text-sm font-medium text-bp-text">View Users</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-bp-text-muted" />
            </button>
            <button onClick={() => navigate("/video")} className="w-full flex items-center justify-between p-3.5 bg-bp-elevated border border-bp-border rounded-xl hover:bg-bp-border transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg"><Eye className="w-4 h-4 text-bp-orange" /></div>
                <span className="text-sm font-medium text-bp-text">Review Videos</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-bp-text-muted" />
            </button>
            <button onClick={() => navigate("/copyright")} className="w-full flex items-center justify-between p-3.5 bg-bp-elevated border border-bp-border rounded-xl hover:bg-bp-border transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg"><Shield className="w-4 h-4 text-bp-cyan" /></div>
                <span className="text-sm font-medium text-bp-text">Manage Copyright Cases</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-bp-text-muted" />
            </button>
            <button onClick={() => navigate("/copyright/cases?status=pending")} className="w-full flex items-center justify-between p-3.5 bg-bp-elevated border border-bp-border rounded-xl hover:bg-bp-border transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg"><FileText className="w-4 h-4 text-bp-yellow" /></div>
                <span className="text-sm font-medium text-bp-text">Pending Copyright Cases</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-bp-text-muted" />
            </button>
          </div>
        </div>

        <div className="bp-card p-6">
          <h2 className="text-base font-semibold text-bp-text mb-5">Support Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-bp-elevated rounded-xl">
              <p className="text-sm text-bp-text-muted">Customer Satisfaction</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">4.8/5.0</p>
            </div>
            <div className="p-4 bg-bp-elevated rounded-xl">
              <p className="text-sm text-bp-text-muted">Resolution Rate</p>
              <p className="text-xl font-bold text-bp-text mt-1">94.2%</p>
            </div>
            <div className="p-4 bg-bp-elevated rounded-xl">
              <p className="text-sm text-bp-text-muted">Escalations This Week</p>
              <p className="text-xl font-bold text-bp-yellow mt-1">3</p>
            </div>
            <div className="p-4 bg-bp-elevated rounded-xl">
              <p className="text-sm text-bp-text-muted">Pending Reviews</p>
              <p className="text-xl font-bold text-red-600 mt-1">5</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-bp-text-muted text-sm mt-4">Support module — user assistance and content moderation</p>
    </div>
  );
}