import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  X,
} from "lucide-react";
import { fetchContactRequests } from "../../../api";
import useSupportEmployees from "../../../hooks/useSupportEmployees";
import PageHeader from "../../../components/layout/PageHeader";
import { formatTicketId } from "../../../utils/ticketId";
import tableCustomStyles from "../../../utils/tableStyles";

const statusColors = {
  pending: "bg-bp-yellow/15 text-bp-yellow border-bp-yellow/30",
  "in-progress": "bg-bp-cyan/15 text-bp-cyan border-bp-cyan/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  closed: "bg-bp-text-muted/15 text-bp-text-secondary border-bp-text-muted/30",
};

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const inquiryTypeColors = {
  "General Inquiry": "text-bp-blue",
  "Technical Support": "text-bp-orange",
  "Privacy Request": "text-purple-400",
  "Data Deletion": "text-red-400",
  Complaint: "text-bp-yellow",
  "Business Inquiry": "text-emerald-400",
  Other: "text-bp-text-muted",
  Copyright: "text-rose-400",
  Account: "text-bp-blue",
  Billing: "text-emerald-400",
};

export default function ContactRequestList({ hideHeader = false }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { employees } = useSupportEmployees();

  const employeeName = (id) =>
    employees.find((e) => String(e.id) === String(id))?.name || null;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 1,
  });

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [assignedTo, setAssignedTo] = useState(searchParams.get("assignedTo") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);

  const fetchData = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (status) params.status = status;
      if (assignedTo) params.assignedTo = assignedTo;

      const res = await fetchContactRequests(params);
      setRequests(res.data?.requests || []);
      setPagination(
        res.data?.pagination || { total: 0, page: 1, limit: 20, pages: 1 }
      );
    } catch (err) {
      console.error("Failed to fetch contact requests:", err);
      setFetchError(err.response?.data?.message || "Failed to load contact requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, status, assignedTo]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns = [
    {
      name: "Sr. No.",
      width: "80px",
      selector: (row, index) =>
        (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      name: "Ticket ID",
      width: "130px",
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-bp-cyan">
          {formatTicketId(row._id)}
        </span>
      ),
    },
    {
      name: "Type",
      minWidth: "130px",
      cell: (row) => (
        <span
          className={`text-xs font-medium ${
            inquiryTypeColors[row.inquiryType] || "text-bp-text-muted"
          }`}
        >
          {row.inquiryType}
        </span>
      ),
    },
    {
      name: "Subject",
      minWidth: "200px",
      grow: 2,
      cell: (row) => (
        <p className="text-sm text-white truncate max-w-[200px]">{row.subject}</p>
      ),
    },
    {
      name: "Status",
      minWidth: "120px",
      cell: (row) => (
        <span
          className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${
            statusColors[row.status] ||
            "bg-bp-text-muted/15 text-bp-text-secondary border-bp-text-muted/30"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      name: "Assigned To",
      minWidth: "140px",
      cell: (row) => (
        <span
          className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${
            row.assignedTo
              ? "bg-bp-blue/10 text-bp-blue border-bp-blue/30"
              : "bg-bp-text-muted/10 text-bp-text-secondary border-bp-text-muted/30"
          }`}
        >
          {employeeName(row.assignedTo) || "Unassigned"}
        </span>
      ),
    },
    {
      name: "Date",
      width: "170px",
      cell: (row) => (
        <span className="text-sm text-bp-text-muted">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      name: "Actions",
      minWidth: "110px",
      cell: (row) => (
        <button
          onClick={() => navigate(`/support/contact/${row._id}`)}
          className="p-1.5 text-bp-blue hover:text-bp-cyan hover:bg-bp-blue/10 rounded-lg transition-colors"
        >
          <Eye size={18} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      {!hideHeader && (
        <PageHeader title="General Queries" subtitle={`${pagination.total} total requests`} />
      )}

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
                placeholder="Search by name, email, subject, or ticket ID (BP-...)"
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
              value={assignedTo}
              onChange={(e) => {
                setAssignedTo(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-bp-elevated border border-bp-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-bp-blue"
            >
              <option value="">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-bp-elevated border border-bp-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-bp-blue"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-bp-card rounded-2xl overflow-hidden">
        {fetchError ? (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-bp-orange mx-auto mb-3" />
            <p className="text-bp-text font-medium">{fetchError}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 text-sm bg-bp-card hover:bg-bp-elevated text-bp-text rounded-lg border border-bp-border"
            >
              Retry
            </button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={requests}
            customStyles={tableCustomStyles}
            progressPending={loading}
            progressComponent={
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-bp-blue border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-bp-text-secondary">
                    Loading contact requests...
                  </p>
                </div>
              </div>
            }
            noDataComponent={
              <div className="text-center py-16">
                <MessageSquare className="w-12 h-12 text-bp-text-muted mx-auto mb-3" />
                <p className="text-bp-text-muted">No contact requests found</p>
              </div>
            }
            highlightOnHover
            pointerOnHover
            onRowClicked={(row) => navigate(`/support/contact/${row._id}`)}
          />
        )}

        {/* Pagination */}
        {!fetchError && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-bp-border">
            <p className="text-sm text-bp-text-muted">
              Page {pagination.page} of {pagination.pages} ({pagination.total}{" "}
              requests)
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
                onClick={() =>
                  setPage((p) => Math.min(pagination.pages, p + 1))
                }
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
