import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import {
  Search,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { fetchCopyrightStrikes } from "../../../api";
import PageHeader from "../../../components/layout/PageHeader";
import tableCustomStyles from "../../../utils/tableStyles";
import {
  PAGINATION_PER_PAGE,
  PAGINATION_OPTIONS,
} from "../../../utils/paginationConfig";

const statusColors = {
  active: "bg-red-500/15 text-red-400 border-red-500/30",
  expired: "bg-bp-text-muted/15 text-bp-text-secondary border-bp-text-muted/30",
  disputed: "bg-bp-orange/15 text-bp-orange border-bp-orange/30",
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
  const [searchParams] = useSearchParams();

  const [strikes, setStrikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: PAGINATION_PER_PAGE, pages: 1 });

  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(PAGINATION_PER_PAGE);

  const fetchStrikes = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (status) params.status = status;

      const res = await fetchCopyrightStrikes(params);
      setStrikes(res.data?.data || []);
      setPagination(res.data?.pagination || { total: 0, page: 1, limit, pages: 1 });
    } catch (err) {
      console.error("Failed to fetch strikes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrikes();
  }, [page, limit, status]);

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

  const columns = [
    {
      name: "User",
      minWidth: "180px",
      cell: (s) => (
        <div>
          <p className="text-sm text-white">{s.user?.name || "-"}</p>
          <p className="text-xs text-bp-text-muted">{s.user?.email || "-"}</p>
        </div>
      ),
    },
    {
      name: "Content",
      minWidth: "200px",
      grow: 1,
      cell: (s) => (
        <p className="text-sm text-white truncate max-w-[240px]">
          {s.content?.title || "Untitled"}
        </p>
      ),
    },
    {
      name: "Case",
      minWidth: "130px",
      ignoreRowClick: true,
      cell: (s) => (
        <button
          onClick={() => navigate(`/copyright/cases/${s.case?._id || s.case}`)}
          className="text-sm text-bp-blue hover:text-bp-cyan"
        >
          {s.case?.caseNumber || "View Case"}
        </button>
      ),
    },
    {
      name: "Status",
      minWidth: "130px",
      cell: (s) => {
        const StatusIcon = statusIcons[s.status] || AlertTriangle;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border ${
              statusColors[s.status] || "bg-bp-text-muted/15 text-bp-text-secondary border-bp-text-muted/30"
            }`}
          >
            <StatusIcon size={12} />
            {s.status}
          </span>
        );
      },
    },
    {
      name: "Issued",
      width: "120px",
      cell: (s) => (
        <span className="text-sm text-bp-text-muted">{formatDate(s.createdAt)}</span>
      ),
    },
    {
      name: "Expires",
      width: "130px",
      cell: (s) => (
        <span className="text-sm text-bp-text-muted">{formatExpiry(s.expiresAt)}</span>
      ),
    },
    {
      name: "Actions",
      width: "70px",
      right: true,
      ignoreRowClick: true,
      cell: (s) => (
        <button
          onClick={() => navigate(`/copyright/strikes/${s._id}`)}
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
      <PageHeader title="Copyright Strikes" subtitle={`${pagination.total} total strikes`} />

      {/* Filters */}
      <div className="bg-bp-card rounded-2xl border border-bp-border p-4">
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-bp-card rounded-2xl overflow-hidden">
        <DataTable
          columns={columns}
          data={strikes}
          customStyles={tableCustomStyles}
          progressPending={loading}
          progressComponent={
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-bp-blue border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-bp-text-secondary">Loading strikes...</p>
              </div>
            </div>
          }
          noDataComponent={
            <div className="text-center py-16">
              <AlertTriangle className="w-12 h-12 text-bp-text-muted mx-auto mb-3" />
              <p className="text-bp-text-muted">No strikes found</p>
            </div>
          }
          pagination
          paginationServer
          paginationTotalRows={pagination.total || 0}
          paginationPerPage={limit}
          paginationRowsPerPageOptions={PAGINATION_OPTIONS}
          paginationDefaultPage={page}
          onChangePage={(p) => setPage(p)}
          onChangeRowsPerPage={(rows) => {
            setLimit(rows);
            setPage(1);
          }}
          highlightOnHover
          pointerOnHover
          onRowClicked={(s) => navigate(`/copyright/strikes/${s._id}`)}
        />
      </div>
    </div>
  );
}
