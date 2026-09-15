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
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading finance dashboard...</p>
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
          <h1 className="text-2xl font-bold text-white">Finance Dashboard</h1>
          <p className="text-gray-400 mt-0.5">
            Financial overview and transaction analytics
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
          title="Total Revenue"
          value={stats.totalRevenue}
          change="+12.5%"
          icon={DollarSign}
          color="text-emerald-400"
          bg="bg-emerald-500/15"
        />
        <StatCard
          title="Pending Payments"
          value={stats.pendingPayments}
          change="-2.1%"
          icon={Wallet}
          color="text-amber-400"
          bg="bg-amber-500/15"
        />
        <StatCard
          title="Transactions"
          value={stats.totalTransactions.toLocaleString()}
          icon={CreditCard}
          color="text-blue-400"
          bg="bg-blue-500/15"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers.toLocaleString()}
          icon={Users}
          color="text-violet-400"
          bg="bg-violet-500/15"
        />
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Financial Metrics */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Financial Metrics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-500">Average Transaction</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">₹2,456</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-500">Success Rate</p>
              <p className="text-xl font-bold text-blue-400 mt-1">98.5%</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-500">Platform Fees</p>
              <p className="text-xl font-bold text-amber-400 mt-1">₹12,450</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <p className="text-sm text-gray-500">Refund Rate</p>
              <p className="text-xl font-bold text-red-400 mt-1">1.2%</p>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Quick Access</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/alluser")}
              className="w-full flex items-center justify-between p-3.5 bg-violet-500/10 border border-violet-500/20 rounded-xl hover:bg-violet-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                  <Eye className="w-4 h-4 text-violet-400" />
                </div>
                <span className="text-sm font-medium text-gray-200">View Users (Read-Only)</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-violet-400" />
            </button>
            <button
              onClick={() => navigate("/copyright")}
              className="w-full flex items-center justify-between p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Eye className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-sm font-medium text-gray-200">View Copyright Cases (Read-Only)</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-indigo-400" />
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-gray-500 text-sm mt-4">
        Finance module — read-only access to financial data
      </p>
    </div>
  );
}
