import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Headphones,
  Shield,
  Users,
  ArrowUpRight,
  RefreshCw,
  Eye,
  MessageSquare,
  Trash2,
  Clock,
  FileText,
} from "lucide-react";
import useDashboardData from "../../../hooks/useDashboardData";
import { fetchContactRequests, fetchDeletionRequests } from "../../../api";

const StatCard = ({ title, value, icon: Icon, color, bg, onClick }) => (
  <div
    className={`stat-card ${onClick ? "cursor-pointer hover:bg-bp-elevated transition-colors" : ""}`}
    onClick={onClick}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-bp-text-secondary font-medium">{title}</p>
        <p className="text-2xl font-bold text-bp-text mt-1">{value}</p>
      </div>
      <div className={`p-2.5 rounded-lg ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  </div>
);

export default function SupportDashboard() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useDashboardData();
  const [stats, setStats] = useState({ activeUsers: 0 });
  const [contactCount, setContactCount] = useState(0);
  const [pendingContactCount, setPendingContactCount] = useState(0);
  const [deletionCount, setDeletionCount] = useState(0);
  const [pendingDeletionCount, setPendingDeletionCount] = useState(0);

  const fetchStats = async () => {
    try {
      const [contactRes, deletionRes, pendingContactRes, pendingDeletionRes] =
        await Promise.allSettled([
          fetchContactRequests({ page: 1, limit: 1 }),
          fetchDeletionRequests({ page: 1, limit: 1 }),
          fetchContactRequests({ status: "pending", page: 1, limit: 1 }),
          fetchDeletionRequests({ status: "pending", page: 1, limit: 1 }),
        ]);

      if (contactRes.status === "fulfilled")
        setContactCount(contactRes.value.data?.pagination?.total || 0);
      if (deletionRes.status === "fulfilled")
        setDeletionCount(deletionRes.value.data?.pagination?.total || 0);
      if (pendingContactRes.status === "fulfilled")
        setPendingContactCount(pendingContactRes.value.data?.pagination?.total || 0);
      if (pendingDeletionRes.status === "fulfilled")
        setPendingDeletionCount(pendingDeletionRes.value.data?.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch support stats:", err);
    }
  };

  useEffect(() => {
    if (data?.stats) {
      setStats({ activeUsers: data.stats.activeUsers || 0 });
    }
  }, [data]);

  useEffect(() => {
    fetchStats();
  }, []);

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
          <button
            onClick={refetch}
            className="px-4 py-2 text-sm bg-bp-card hover:bg-bp-elevated text-bp-text rounded-lg border border-bp-border"
          >
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
          <h1 className="text-2xl font-semibold text-bp-text tracking-tight">
            Support Dashboard
          </h1>
          <p className="text-[13px] text-bp-text-secondary mt-1">
            User assistance, contact requests, and deletion management
          </p>
        </div>
        <button
          onClick={() => { refetch(); fetchStats(); }}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-bp-card hover:bg-bp-elevated text-bp-text border border-bp-border rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Active Users"
          value={stats.activeUsers.toLocaleString()}
          icon={Users}
          color="text-bp-blue"
          bg="bg-bp-blue/10"
          onClick={() => navigate("/alluser")}
        />
        <StatCard
          title="Contact Requests"
          value={contactCount}
          icon={MessageSquare}
          color="text-bp-cyan"
          bg="bg-bp-cyan/10"
          onClick={() => navigate("/support/contact")}
        />
        <StatCard
          title="Pending Contacts"
          value={pendingContactCount}
          icon={Clock}
          color="text-bp-yellow"
          bg="bg-bp-yellow/10"
          onClick={() => navigate("/support/contact?status=pending")}
        />
        <StatCard
          title="Deletion Requests"
          value={deletionCount}
          icon={Trash2}
          color="text-red-500"
          bg="bg-red-500/10"
          onClick={() => navigate("/support/deletion")}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bp-card p-6">
          <h2 className="text-base font-semibold text-bp-text mb-5">Quick Actions</h2>
          <div className="space-y-2.5">
            <button
              onClick={() => navigate("/support/contact")}
              className="w-full flex items-center justify-between p-3.5 bg-bp-elevated border border-bp-border rounded-xl hover:bg-bp-border transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-bp-cyan" />
                </div>
                <span className="text-sm font-medium text-bp-text">Contact Requests</span>
                {pendingContactCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-bp-yellow/15 text-bp-yellow rounded-full">
                    {pendingContactCount} pending
                  </span>
                )}
              </div>
              <ArrowUpRight className="w-4 h-4 text-bp-text-muted" />
            </button>
            <button
              onClick={() => navigate("/support/deletion")}
              className="w-full flex items-center justify-between p-3.5 bg-bp-elevated border border-bp-border rounded-xl hover:bg-bp-border transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-sm font-medium text-bp-text">Deletion Requests</span>
                {pendingDeletionCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-bp-yellow/15 text-bp-yellow rounded-full">
                    {pendingDeletionCount} pending
                  </span>
                )}
              </div>
              <ArrowUpRight className="w-4 h-4 text-bp-text-muted" />
            </button>
            <button
              onClick={() => navigate("/alluser")}
              className="w-full flex items-center justify-between p-3.5 bg-bp-elevated border border-bp-border rounded-xl hover:bg-bp-border transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg">
                  <Users className="w-4 h-4 text-bp-blue" />
                </div>
                <span className="text-sm font-medium text-bp-text">View Users</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-bp-text-muted" />
            </button>
            <button
              onClick={() => navigate("/video")}
              className="w-full flex items-center justify-between p-3.5 bg-bp-elevated border border-bp-border rounded-xl hover:bg-bp-border transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg">
                  <Eye className="w-4 h-4 text-bp-orange" />
                </div>
                <span className="text-sm font-medium text-bp-text">Review Videos</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-bp-text-muted" />
            </button>
            <button
              onClick={() => navigate("/copyright")}
              className="w-full flex items-center justify-between p-3.5 bg-bp-elevated border border-bp-border rounded-xl hover:bg-bp-border transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg">
                  <Shield className="w-4 h-4 text-bp-cyan" />
                </div>
                <span className="text-sm font-medium text-bp-text">Manage Copyright</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-bp-text-muted" />
            </button>
          </div>
        </div>

        <div className="bp-card p-6">
          <h2 className="text-base font-semibold text-bp-text mb-5">Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-bp-elevated rounded-xl">
              <p className="text-sm text-bp-text-muted">Total Contact Requests</p>
              <p className="text-xl font-bold text-bp-cyan mt-1">{contactCount}</p>
            </div>
            <div className="p-4 bg-bp-elevated rounded-xl">
              <p className="text-sm text-bp-text-muted">Pending Contacts</p>
              <p className="text-xl font-bold text-bp-yellow mt-1">{pendingContactCount}</p>
            </div>
            <div className="p-4 bg-bp-elevated rounded-xl">
              <p className="text-sm text-bp-text-muted">Total Deletion Requests</p>
              <p className="text-xl font-bold text-red-500 mt-1">{deletionCount}</p>
            </div>
            <div className="p-4 bg-bp-elevated rounded-xl">
              <p className="text-sm text-bp-text-muted">Pending Deletions</p>
              <p className="text-xl font-bold text-bp-yellow mt-1">{pendingDeletionCount}</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-bp-text-muted text-sm mt-4">
        Support module — contact requests, deletion management, and user assistance
      </p>
    </div>
  );
}
