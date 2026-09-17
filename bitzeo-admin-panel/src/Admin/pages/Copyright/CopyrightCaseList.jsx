import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  Plus,
  X,
} from "lucide-react";
import { fetchCopyrightCases } from "../../../api";
import { hasFeature } from "../../../config/roleConfig";

const statusColors = {
  pending: "bg-bp-yellow/15 text-bp-yellow border-bp-yellow/30",
  under_review: "bg-bp-cyan/15 text-bp-cyan border-bp-cyan/30",
  takedown_approved: "bg-red-500/15 text-red-400 border-red-500/30",
  takedown_rejected: "bg-bp-text-muted/15 text-bp-text-secondary border-bp-text-muted/30",
  disputed: "bg-bp-orange/15 text-bp-orange border-bp-orange/30",
  dispute_under_review: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  dispute_upheld: "bg-red-500/15 text-red-400 border-red-500/30",
  dispute_overturned: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  withdrawn: "bg-bp-text-muted/15 text-bp-text-secondary border-bp-text-muted/30",
};

const priorityColors = {
  low: "text-bp-text-secondary",
  medium: "text-bp-yellow",
  high: "text-bp-orange",
  urgent: "text-red-400",
};

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "takedown_approved", label: "Takedown Approved" },
  { value: "takedown_rejected", label: "Takedown Rejected" },
  { value: "disputed", label: "Disputed" },
  { value: "dispute_under_review", label: "Dispute Under Review" },
  { value: "resolved", label: "Resolved" },
  { value: "withdrawn", label: "Withdrawn" },
];

const priorityOptions = [
  { value: "", label: "All Priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function CopyrightCaseList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [priority, setPriority] = useState(searchParams.get("priority") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (status) params.status = status;
      if (priority) params.priority = priority;

      const res = await fetchCopyrightCases(params);
      setCases(res.data?.data || []);
      setPagination(res.data?.pagination || { total: 0, page: 1, limit: 20, pages: 1 });
    } catch (err) {
      console.error("Failed to fetch cases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [page, status, priority]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCases();
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bp-text">Copyright Cases</h1>
          <p className="text-[13px] text-bp-text-secondary mt-1">
            {pagination.total} total cases
          </p>
        </div>
        {hasFeature("canCreateCopyrightCase") && (
          <button
            onClick={() => navigate("/copyright/cases/new")}
            className="inline-flex items-center gap-2 bg-bp-elevated border border-bp-border text-bp-text-secondary hover:text-bp-text hover:bg-bp-hover px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            New Case
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-bp-card rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bp-text-muted pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by case number, claimant name, or email..."
                className="w-full pl-9 pr-9 py-2 bg-bp-surface/60 border border-bp-border/50 rounded-xl text-bp-text text-sm placeholder:text-bp-text-muted focus:outline-none focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border transition-colors duration-200"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-bp-text-muted hover:text-bp-text hover:bg-bp-elevated transition-colors duration-150"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </form>
          <div className="flex gap-3">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-bp-elevated border border-bp-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-bp-blue"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-bp-elevated border border-bp-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-bp-blue"
            >
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-bp-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-bp-blue border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-bp-text-secondary">Loading cases...</p>
            </div>
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-bp-text-muted mx-auto mb-3" />
            <p className="text-bp-text-muted">No cases found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-bp-border">
              <thead className="bg-bp-elevated/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-bp-text-secondary uppercase tracking-wider">Case #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-bp-text-secondary uppercase tracking-wider">Claimant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-bp-text-secondary uppercase tracking-wider">Content</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-bp-text-secondary uppercase tracking-wider">Respondent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-bp-text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-bp-text-secondary uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-bp-text-secondary uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-bp-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bp-border">
                {cases.map((c) => (
                  <tr key={c._id} className="hover:bg-bp-elevated/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-bp-blue">{c.caseNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm text-white">{c.claimant?.name}</p>
                        <p className="text-xs text-bp-text-muted">{c.claimant?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-white truncate max-w-[200px]">
                        {c.content?.title || "Untitled"}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-white">
                        {c.respondent?.name || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${
                          statusColors[c.status] || "bg-bp-text-muted/15 text-bp-text-secondary border-bp-text-muted/30"
                        }`}
                      >
                        {c.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-medium capitalize ${priorityColors[c.priority] || "text-bp-text-secondary"}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-bp-text-muted">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => navigate(`/copyright/cases/${c._id}`)}
                        className="p-1.5 text-bp-blue hover:text-bp-cyan hover:bg-bp-blue/10 rounded-lg transition-colors"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-bp-border">
            <p className="text-sm text-bp-text-muted">
              Page {pagination.page} of {pagination.pages} ({pagination.total} cases)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 text-bp-text-secondary hover:text-bp-text hover:bg-bp-elevated rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="p-2 text-bp-text-secondary hover:text-bp-text hover:bg-bp-elevated rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
