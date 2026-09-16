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
  <div className="bg-bp-card p-5 rounded-2xl border border-bp-border hover:border-bp-elevated transition-all">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-bp-text-secondary font-medium">{title}</p>
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

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const { data, generatedAt, loading, error, refetch } = useDashboardData();
  const [stats, setStats] = useState({
    totalRevenue: "â‚¹1,24,890",
    pendingPayments: "â‚¹45,320",
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
          <div className="w-8 h-8 border-4 border-bp-yellow border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-bp-text-secondary">Loading finance dashboard...</p>
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
          <h1 className="text-2xl font-bold text-white">Finance Dashboard</h1>
          <p className="text-[13px] text-bp-text-secondary mt-1">Financial overview and transaction analytics</p>
        </div>
        <button onClick={refetch} className="flex items-center gap-2 px-4 py-2 text-sm bg-bp-card hover:bg-bp-elevated text-white rounded-lg border border-bp-border transition-colors">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={stats.totalRevenue} change="+12.5%" icon={DollarSign} color="text-emerald-400" bg="bg-emerald-500/15" />
        <StatCard title="Pending Payments" value={stats.pendingPayments} change="-2.1%" icon={Wallet} color="text-bp-yellow" bg="bg-bp-yellow/15" />
        <StatCard title="Transactions" value={stats.totalTransactions.toLocaleString()} icon={CreditCard} color="text-bp-blue" bg="bg-bp-blue/15" />
        <StatCard title="Active Users" value={stats.activeUsers.toLocaleString()} icon={Users} color="text-bp-cyan" bg="bg-bp-cyan/15" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-bp-card rounded-2xl border border-bp-border p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-bp-yellow" />
            Financial Metrics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-bp-elevated rounded-xl">
              <p className="text-sm text-bp-text-muted">Average Transaction</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">â‚¹2,456</p>
            </div>
            <div className="p-4 bg-bp-elevated rounded-xl">
              <p className="text-sm text-bp-text-muted">Success Rate</p>
              <p className="text-xl font-bold text-bp-blue mt-1">98.5%</p>
            </div>
            <div className="p-4 bg-bp-elevated rounded-xl">
              <p className="text-sm text-bp-text-muted">Platform Fees</p>
              <p className="text-xl font-bold text-bp-yellow mt-1">â‚¹12,450</p>
            </div>
            <div className="p-4 bg-bp-elevated rounded-xl">
              <p className="text-sm text-bp-text-muted">Refund Rate</p>
              <p className="text-xl font-bold text-red-400 mt-1">1.2%</p>
            </div>
          </div>
        </div>

        <div className="bg-bp-card rounded-2xl border border-bp-border p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Quick Access</h2>
          <div className="space-y-3">
            <button onClick={() => navigate("/alluser")} className="w-full flex items-center justify-between p-3.5 bg-bp-blue/10 border border-bp-blue/20 rounded-xl hover:bg-bp-blue/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-bp-blue/20 rounded-lg"><Eye className="w-4 h-4 text-bp-blue" /></div>
                <span className="text-sm font-medium text-white">View Users (Read-Only)</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-bp-blue" />
            </button>
            <button onClick={() => navigate("/copyright")} className="w-full flex items-center justify-between p-3.5 bg-bp-cyan/10 border border-bp-cyan/20 rounded-xl hover:bg-bp-cyan/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-bp-cyan/20 rounded-lg"><Eye className="w-4 h-4 text-bp-cyan" /></div>
                <span className="text-sm font-medium text-white">View Copyright Cases (Read-Only)</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-bp-cyan" />
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-bp-text-muted text-sm mt-4">Finance module â€” read-only access to financial data</p>
    </div>
  );
}
