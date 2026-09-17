import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  CreditCard,
  Clock,
  Users,
  ArrowUpRight,
  RefreshCw,
  Eye,
  BarChart3,
} from "lucide-react";
import useDashboardData from "../../hooks/useDashboardData";

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

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const { data, generatedAt, loading, error, refetch } = useDashboardData();
  const [stats, setStats] = useState({
    totalRevenue: "₹1,24,890",
    pendingPayments: "₹45,320",
    totalTransactions: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    if (data?.stats) {
      setStats((prev) => ({
        ...prev,
        totalTransactions: data.stats.totalVideos || 0,
        activeUsers: data.stats.activeUsers || 0,
      }));
    }
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-bp-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-bp-text-secondary">Loading finance dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={refetch} className="px-4 py-2 text-sm bg-bp-card hover:bg-bp-elevated text-bp-text rounded-lg border border-bp-border">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-bp-text tracking-tight">Finance Dashboard</h1>
          <p className="text-[13px] text-bp-text-secondary mt-1">Financial overview and transaction analytics</p>
        </div>
        <button onClick={refetch} className="flex items-center gap-2 px-4 py-2 text-sm bg-bp-card hover:bg-bp-elevated text-bp-text rounded-lg border border-bp-border transition-colors">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={stats.totalRevenue} change="+12.5%" icon={DollarSign} color="text-bp-yellow" bg="bg-bp-yellow/10" />
        <StatCard title="Pending Payments" value={stats.pendingPayments} change="-2.1%" icon={Wallet} color="text-bp-yellow" bg="bg-bp-yellow/10" />
        <StatCard title="Transactions" value={stats.totalTransactions.toLocaleString()} icon={CreditCard} color="text-bp-blue" bg="bg-bp-blue/10" />
        <StatCard title="Active Users" value={stats.activeUsers.toLocaleString()} icon={Users} color="text-bp-cyan" bg="bg-bp-cyan/10" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bp-card p-6">
          <h2 className="text-base font-semibold text-bp-text flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-bp-blue" />
            Financial Metrics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-bp-elevated rounded-xl">
              <p className="text-sm text-bp-text-muted">Average Transaction</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">₹2,456</p>
            </div>
            <div className="p-4 bg-bp-elevated rounded-xl">
              <p className="text-sm text-bp-text-muted">Success Rate</p>
              <p className="text-xl font-bold text-bp-text mt-1">98.5%</p>
            </div>
            <div className="p-4 bg-bp-elevated rounded-xl">
              <p className="text-sm text-bp-text-muted">Platform Fees</p>
              <p className="text-xl font-bold text-bp-yellow mt-1">₹12,450</p>
            </div>
            <div className="p-4 bg-bp-elevated rounded-xl">
              <p className="text-sm text-bp-text-muted">Refund Rate</p>
              <p className="text-xl font-bold text-red-600 mt-1">1.2%</p>
            </div>
          </div>
        </div>

        <div className="bp-card p-6">
          <h2 className="text-base font-semibold text-bp-text mb-5">Quick Access</h2>
          <div className="space-y-2.5">
            <button onClick={() => navigate("/alluser")} className="w-full flex items-center justify-between p-3.5 bg-bp-elevated border border-bp-border rounded-xl hover:bg-bp-border transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg"><Eye className="w-4 h-4 text-bp-blue" /></div>
                <span className="text-sm font-medium text-bp-text">View Users (Read-Only)</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-bp-text-muted" />
            </button>
            <button onClick={() => navigate("/copyright")} className="w-full flex items-center justify-between p-3.5 bg-bp-elevated border border-bp-border rounded-xl hover:bg-bp-border transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg"><Eye className="w-4 h-4 text-bp-cyan" /></div>
                <span className="text-sm font-medium text-bp-text">View Copyright Cases (Read-Only)</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-bp-text-muted" />
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-bp-text-muted text-sm mt-4">Finance module — read-only access to financial data</p>
    </div>
  );
}