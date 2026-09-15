import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { fetchCopyrightStrikes } from "../../../api";

const statusColors = {
  active: "bg-red-500/15 text-red-400 border-red-500/30",
  expired: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  disputed: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  removed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const statusIcons = {
  active: AlertTriangle,
  expired: Clock,
  disputed: AlertTriangle,
  removed: CheckCircle,
};

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "disputed", label: "Disputed" },
  { value: "removed", label: "Removed" },
];

export default function CopyrightStrikeList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [strikes, setStrikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });

  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);

  const fetchStrikes = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (status) params.status = status;

      const res = await fetchCopyrightStrikes(params);
      setStrikes(res.data?.data || []);
      setPagination(res.data?.pagination || { total: 0, page: 1, limit: 20, pages: 1 });
    } catch (err) {
      console.error("Failed to fetch strikes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrikes();
  }, [page, status]);

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatExpiry = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    const now = new Date();
    const diff = d - now;
    if (diff <= 0) return "Expired";
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `${days} days left`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Copyright Strikes</h1>
        <p className="text-gray-400 mt-0.5">
          {pagination.total} total strikes
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
        <div className="flex gap-3">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400">Loading strikes...</p>
            </div>
          </div>
        ) : strikes.length === 0 ? (
          <div className="text-center py-16">
            <AlertTriangle className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No strikes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Content</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Case</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Issued</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {strikes.map((s) => {
                  const StatusIcon = statusIcons[s.status] || AlertTriangle;
                  return (
                    <tr key={s._id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm text-gray-200">{s.user?.name || "-"}</p>
                          <p className="text-xs text-gray-500">{s.user?.email || "-"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-200 truncate max-w-[200px]">
                          {s.content?.title || "Untitled"}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/copyright/cases/${s.case?._id || s.case}`)}
                          className="text-sm text-indigo-400 hover:text-indigo-300"
                        >
                          {s.case?.caseNumber || "View Case"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border ${
                            statusColors[s.status] || "bg-gray-500/15 text-gray-400 border-gray-500/30"
                          }`}
                        >
                          <StatusIcon size={12} />
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(s.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatExpiry(s.expiresAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => navigate(`/copyright/strikes/${s._id}`)}
                          className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} strikes)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
