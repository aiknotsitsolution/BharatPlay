"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  LayoutDashboard,
  DollarSign,
  Wallet,
  Shield,
  AlertTriangle,
  Users,
  Settings,
  FileText,
  Lock,
  TrendingUp,
  TrendingDown,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Globe,
  Activity,
  UserX,
  Unlock,
  History,
  ChevronRight,
} from "lucide-react";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// ========== MOCK DATA (replace with API) ==========
const MOCK_OVERVIEW = {
  revenue: {
    today: 12450,
    week: 89200,
    month: 342800,
  },
  payouts: {
    viewer: 28400,
    creator: 156200,
  },
  platformNet: 158200,
  dau: 18420,
  mau: 142300,
  cpm: {
    current: 2.45,
    trend: 5.2, // %
  },
};

const MOCK_CPM = [
  { network: "AdMob", type: "Banner", india: 1.2, intl: 3.8, status: "synced" },
  {
    network: "AdMob",
    type: "Interstitial",
    india: 2.8,
    intl: 6.2,
    status: "synced",
  },
  {
    network: "Unity",
    type: "Rewarded",
    india: 3.1,
    intl: 7.5,
    status: "synced",
  },
  { network: "Meta", type: "Native", india: 1.9, intl: 4.4, status: "pending" },
];

const MOCK_WALLETS = {
  viewerPending: 12400,
  viewerConfirmed: 48200,
  creatorPending: 38600,
  creatorConfirmed: 210400,
  withdrawalQueue: [
    {
      id: "w1",
      user: "Rahul S.",
      type: "viewer",
      amount: 850,
      status: "pending",
      date: "2026-08-16",
    },
    {
      id: "w2",
      user: "Priya M.",
      type: "creator",
      amount: 4200,
      status: "pending",
      date: "2026-08-16",
    },
    {
      id: "w3",
      user: "Amit K.",
      type: "creator",
      amount: 1800,
      status: "pending",
      date: "2026-08-15",
    },
    {
      id: "w4",
      user: "Sneha R.",
      type: "viewer",
      amount: 320,
      status: "pending",
      date: "2026-08-15",
    },
  ],
};

const MOCK_FLAGGED = [
  {
    id: "f1",
    user: "bot_user_92",
    reason: "VPN",
    score: 12,
    evidence: "IP mismatch x14",
    date: "2026-08-16",
  },
  {
    id: "f2",
    user: "loop_watch_01",
    reason: "Loop",
    score: 8,
    evidence: "Same video 200x",
    date: "2026-08-16",
  },
  {
    id: "f3",
    user: "farm_acc_77",
    reason: "Bot",
    score: 5,
    evidence: "Device fingerprint match",
    date: "2026-08-15",
  },
];

const MOCK_CREATORS = [
  {
    id: "c1",
    name: "TechWithRaj",
    earnings: 28400,
    videos: 42,
    flags: 0,
    status: "active",
  },
  {
    id: "c2",
    name: "ComedyKing",
    earnings: 51200,
    videos: 128,
    flags: 2,
    status: "active",
  },
  {
    id: "c3",
    name: "MusicVibe",
    earnings: 9800,
    videos: 19,
    flags: 1,
    status: "flagged",
  },
];

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "revenue", label: "Ad Revenue", icon: DollarSign },
  { id: "wallets", label: "Wallets & Payouts", icon: Wallet },
  { id: "trust", label: "Trust & Users", icon: Shield },
  { id: "fraud", label: "Fraud Detection", icon: AlertTriangle },
  { id: "creators", label: "Creators", icon: Users },
  { id: "config", label: "System Config", icon: Settings },
  { id: "logs", label: "Audit Logs", icon: FileText },
];

function StatCard({ title, value, sub, icon: Icon, trend, color = "indigo" }) {
  const colors = {
    indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    rose: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  };

  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1 text-white">{value}</p>
          {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
        </div>
        <div className="p-2 rounded-lg bg-black/20">
          <Icon size={20} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend >= 0 ? (
            <ArrowUpRight size={14} className="text-emerald-400" />
          ) : (
            <ArrowDownRight size={14} className="text-rose-400" />
          )}
          <span className={trend >= 0 ? "text-emerald-400" : "text-rose-400"}>
            {Math.abs(trend)}%
          </span>
          <span className="text-gray-500">vs last period</span>
        </div>
      )}
    </div>
  );
}

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [indiaEnabled, setIndiaEnabled] = useState(true);
  const [intlEnabled, setIntlEnabled] = useState(true);

  // In real app: fetch from API
  // useEffect(() => { fetchDashboard(); }, []);

  const formatINR = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  const handlePayoutAction = (id, action) => {
    toast.success(`Payout ${action}ed successfully`);
    // API call here
  };

  const handleFraudAction = (id, action) => {
    toast.success(`User ${action}ed`);
    // API call here
  };

  const handleTrustAdjust = () => {
    toast.success("Trust score updated (logged)");
  };

  // ================= OVERVIEW =================
  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenue Today"
          value={formatINR(MOCK_OVERVIEW.revenue.today)}
          sub={`7d: ${formatINR(MOCK_OVERVIEW.revenue.week)}`}
          icon={DollarSign}
          color="emerald"
          trend={8.4}
        />
        <StatCard
          title="Platform Net"
          value={formatINR(MOCK_OVERVIEW.platformNet)}
          sub="After all payouts"
          icon={TrendingUp}
          color="indigo"
          trend={3.1}
        />
        <StatCard
          title="Viewer Payouts"
          value={formatINR(MOCK_OVERVIEW.payouts.viewer)}
          sub={`Creator: ${formatINR(MOCK_OVERVIEW.payouts.creator)}`}
          icon={Wallet}
          color="amber"
        />
        <StatCard
          title="CPM Snapshot"
          value={`$${MOCK_OVERVIEW.cpm.current}`}
          sub="Avg blended"
          icon={Activity}
          color="purple"
          trend={MOCK_OVERVIEW.cpm.trend}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="DAU"
          value={MOCK_OVERVIEW.dau.toLocaleString()}
          sub="Daily Active Users"
          icon={Eye}
          color="blue"
          trend={2.8}
        />
        <StatCard
          title="MAU"
          value={MOCK_OVERVIEW.mau.toLocaleString()}
          sub="Monthly Active Users"
          icon={Users}
          color="rose"
          trend={5.6}
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveTab("wallets")}
            className="px-4 py-2 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-sm hover:bg-indigo-600/30 transition"
          >
            Review Withdrawals
          </button>
          <button
            onClick={() => setActiveTab("fraud")}
            className="px-4 py-2 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-lg text-sm hover:bg-rose-600/30 transition"
          >
            Fraud Queue ({MOCK_FLAGGED.length})
          </button>
          <button
            onClick={() => setActiveTab("revenue")}
            className="px-4 py-2 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-sm hover:bg-emerald-600/30 transition"
          >
            CPM Status
          </button>
        </div>
      </div>
    </div>
  );

  // ================= AD REVENUE =================
  const renderRevenue = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Ad Revenue Monitoring
          </h2>
          <p className="text-sm text-gray-500">Last sync: 12 min ago</p>
        </div>
        <div className="flex gap-2">
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Countries</option>
            <option value="india">India</option>
            <option value="intl">International</option>
          </select>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 transition">
            <RefreshCw size={14} />
            Sync Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="India CPM Avg"
          value="$2.15"
          icon={Globe}
          color="amber"
          trend={-1.2}
        />
        <StatCard
          title="Intl CPM Avg"
          value="$5.48"
          icon={Globe}
          color="blue"
          trend={4.8}
        />
        <StatCard
          title="7-day Rolling"
          value="$3.21"
          icon={TrendingUp}
          color="emerald"
          trend={2.1}
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-5 py-3 text-left">Network</th>
              <th className="px-5 py-3 text-left">Ad Type</th>
              <th className="px-5 py-3 text-right">India CPM</th>
              <th className="px-5 py-3 text-right">Intl CPM</th>
              <th className="px-5 py-3 text-center">Sync</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {MOCK_CPM.map((row, i) => (
              <tr key={i} className="hover:bg-gray-800/40 transition">
                <td className="px-5 py-3.5 font-medium text-gray-200">
                  {row.network}
                </td>
                <td className="px-5 py-3.5 text-gray-400">{row.type}</td>
                <td className="px-5 py-3.5 text-right text-gray-300">
                  ${row.india}
                </td>
                <td className="px-5 py-3.5 text-right text-gray-300">
                  ${row.intl}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      row.status === "synced"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle
          size={18}
          className="text-amber-400 mt-0.5 flex-shrink-0"
        />
        <div>
          <p className="text-sm font-medium text-amber-300">CPM Alert</p>
          <p className="text-xs text-amber-400/80 mt-0.5">
            Meta Native India CPM dropped 18% in last 24h. Review recommended.
          </p>
        </div>
      </div>
    </div>
  );

  // ================= WALLETS =================
  const renderWallets = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Viewer Pending"
          value={formatINR(MOCK_WALLETS.viewerPending)}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Viewer Confirmed"
          value={formatINR(MOCK_WALLETS.viewerConfirmed)}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Creator Pending"
          value={formatINR(MOCK_WALLETS.creatorPending)}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Creator Confirmed"
          value={formatINR(MOCK_WALLETS.creatorConfirmed)}
          icon={CheckCircle}
          color="indigo"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold text-white">Withdrawal Queue</h3>
          <span className="text-xs text-gray-500">
            {MOCK_WALLETS.withdrawalQueue.length} pending
          </span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-5 py-3 text-left">User</th>
              <th className="px-5 py-3 text-left">Type</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-left">Date</th>
              <th className="px-5 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {MOCK_WALLETS.withdrawalQueue.map((w) => (
              <tr key={w.id} className="hover:bg-gray-800/40 transition">
                <td className="px-5 py-3.5 font-medium text-gray-200">
                  {w.user}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                      w.type === "creator"
                        ? "bg-indigo-500/15 text-indigo-400"
                        : "bg-blue-500/15 text-blue-400"
                    }`}
                  >
                    {w.type}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right font-medium text-gray-200">
                  {formatINR(w.amount)}
                </td>
                <td className="px-5 py-3.5 text-gray-500">{w.date}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePayoutAction(w.id, "approve")}
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition"
                      title="Approve"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button
                      onClick={() => handlePayoutAction(w.id, "reject")}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition"
                      title="Reject"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ================= TRUST =================
  const renderTrust = () => (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="font-semibold text-white mb-4">Manual Trust Adjust</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            placeholder="User email or ID"
            className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="number"
            placeholder="New score (0-100)"
            min={0}
            max={100}
            className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleTrustAdjust}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition"
          >
            Update Score
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          All adjustments are logged with admin ID + timestamp.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Ban size={18} className="text-rose-400" />
            Freeze User
          </h3>
          <input
            placeholder="User email or ID"
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
          />
          <div className="flex gap-2">
            <button className="flex-1 py-2 bg-amber-600/20 text-amber-300 border border-amber-500/30 rounded-lg text-sm hover:bg-amber-600/30 transition">
              Temporary
            </button>
            <button className="flex-1 py-2 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-lg text-sm hover:bg-rose-600/30 transition">
              Permanent
            </button>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Unlock size={18} className="text-emerald-400" />
            Unfreeze User
          </h3>
          <input
            placeholder="User email or ID"
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
          />
          <button className="w-full py-2 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-sm hover:bg-emerald-600/30 transition">
            Restore Account
          </button>
        </div>
      </div>
    </div>
  );

  // ================= FRAUD =================
  const renderFraud = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Flagged Users</h2>
        <span className="text-sm text-rose-400">
          {MOCK_FLAGGED.length} active flags
        </span>
      </div>

      <div className="space-y-3">
        {MOCK_FLAGGED.map((f) => (
          <div
            key={f.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-200">{f.user}</p>
                <span className="px-2 py-0.5 text-xs rounded-full bg-rose-500/15 text-rose-400">
                  {f.reason}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{f.evidence}</p>
              <p className="text-xs text-gray-600 mt-1">
                Trust: {f.score} • {f.date}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => handleFraudAction(f.id, "freeze")}
                className="px-3 py-1.5 text-sm bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition"
              >
                Freeze
              </button>
              <button
                onClick={() => handleFraudAction(f.id, "clear")}
                className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-700 transition"
              >
                Clear
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ================= CREATORS =================
  const renderCreators = () => (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search creators..."
          className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-5 py-3 text-left">Creator</th>
              <th className="px-5 py-3 text-right">Earnings</th>
              <th className="px-5 py-3 text-center">Videos</th>
              <th className="px-5 py-3 text-center">Flags</th>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {MOCK_CREATORS.filter((c) =>
              c.name.toLowerCase().includes(search.toLowerCase()),
            ).map((c) => (
              <tr key={c.id} className="hover:bg-gray-800/40 transition">
                <td className="px-5 py-3.5 font-medium text-gray-200">
                  {c.name}
                </td>
                <td className="px-5 py-3.5 text-right text-emerald-400">
                  {formatINR(c.earnings)}
                </td>
                <td className="px-5 py-3.5 text-center text-gray-300">
                  {c.videos}
                </td>
                <td className="px-5 py-3.5 text-center">
                  {c.flags > 0 ? (
                    <span className="text-rose-400 font-medium">{c.flags}</span>
                  ) : (
                    <span className="text-gray-500">0</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                      c.status === "active"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <button className="text-indigo-400 hover:text-indigo-300 text-sm">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ================= CONFIG =================
  const renderConfig = () => (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
        <h3 className="font-semibold text-white">Revenue Share</h3>
        <div className="flex items-center justify-between py-3 border-b border-gray-800">
          <div>
            <p className="text-gray-200">Platform / Creator / Viewer</p>
            <p className="text-xs text-gray-500">
              Locked — contact Super Admin
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-sm text-gray-400">
            <Lock size={14} />
            40 / 40 / 20
          </span>
        </div>

        <h3 className="font-semibold text-white pt-2">Country Availability</h3>
        <div className="flex items-center justify-between py-2">
          <span className="text-gray-300">India</span>
          <button
            onClick={() => setIndiaEnabled(!indiaEnabled)}
            className={`w-11 h-6 rounded-full transition relative ${
              indiaEnabled ? "bg-indigo-600" : "bg-gray-700"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${
                indiaEnabled ? "left-5.5 right-0.5" : "left-0.5"
              }`}
              style={{ left: indiaEnabled ? "22px" : "2px" }}
            />
          </button>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-gray-300">International</span>
          <button
            onClick={() => setIntlEnabled(!intlEnabled)}
            className={`w-11 h-6 rounded-full transition relative ${
              intlEnabled ? "bg-indigo-600" : "bg-gray-700"
            }`}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition"
              style={{ left: intlEnabled ? "22px" : "2px" }}
            />
          </button>
        </div>

        <h3 className="font-semibold text-white pt-2">Maintenance Mode</h3>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-gray-300">Platform maintenance</p>
            <p className="text-xs text-gray-500">
              Users see maintenance screen
            </p>
          </div>
          <button
            onClick={() => {
              setMaintenanceMode(!maintenanceMode);
              toast.info(
                maintenanceMode ? "Maintenance OFF" : "Maintenance ON",
              );
            }}
            className={`w-11 h-6 rounded-full transition relative ${
              maintenanceMode ? "bg-rose-600" : "bg-gray-700"
            }`}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition"
              style={{ left: maintenanceMode ? "22px" : "2px" }}
            />
          </button>
        </div>
      </div>
    </div>
  );

  // ================= LOGS =================
  const renderLogs = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["All", "Admin", "Earnings", "Fraud"].map((t) => (
          <button
            key={t}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition"
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
        {[
          {
            action: "Payout approved",
            user: "admin@vidoo",
            target: "Rahul S. ₹850",
            time: "10 min ago",
          },
          {
            action: "Trust score adjusted",
            user: "finance@vidoo",
            target: "user_882 → 45",
            time: "1h ago",
          },
          {
            action: "User frozen",
            user: "support@vidoo",
            target: "bot_user_92",
            time: "2h ago",
          },
          {
            action: "CPM sync completed",
            user: "system",
            target: "AdMob + Unity",
            time: "3h ago",
          },
          {
            action: "Withdrawal rejected",
            user: "finance@vidoo",
            target: "Unknown ₹1200",
            time: "5h ago",
          },
        ].map((log, i) => (
          <div
            key={i}
            className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-800/30 transition"
          >
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
              <History size={14} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200">{log.action}</p>
              <p className="text-xs text-gray-500">
                {log.user} → {log.target}
              </p>
            </div>
            <span className="text-xs text-gray-600 flex-shrink-0">
              {log.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const content = {
    overview: renderOverview,
    revenue: renderRevenue,
    wallets: renderWallets,
    trust: renderTrust,
    fraud: renderFraud,
    creators: renderCreators,
    config: renderConfig,
    logs: renderLogs,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Finance Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Earning monitoring • Security controls • System oversight
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-900 text-gray-400 border border-gray-800 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="min-h-[400px]">{content[activeTab]?.()}</div>
      </div>
    </div>
  );
}
