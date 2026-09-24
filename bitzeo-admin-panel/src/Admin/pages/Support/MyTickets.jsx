import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import {
  MessageSquare,
  Trash2,
  Eye,
  Loader2,
  Inbox,
  RefreshCw,
} from "lucide-react";
import { fetchContactRequests, fetchDeletionRequests } from "../../../api";
import { formatTicketId } from "../../../utils/ticketId";
import PageHeader from "../../../components/layout/PageHeader";
import tableCustomStyles from "../../../utils/tableStyles";

const statusColors = {
  pending: "bg-bp-yellow/15 text-bp-yellow border-bp-yellow/30",
  "in-progress": "bg-bp-cyan/15 text-bp-cyan border-bp-cyan/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  closed: "bg-bp-text-muted/15 text-bp-text-secondary border-bp-text-muted/30",
  verified: "bg-bp-cyan/15 text-bp-cyan border-bp-cyan/30",
  processing: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
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

const getMyAdminId = () => {
  try {
    return JSON.parse(localStorage.getItem("adminUser") || "null")?.id || null;
  } catch {
    return null;
  }
};

export default function MyTickets() {
  const navigate = useNavigate();
  const myId = getMyAdminId();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(myId));
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!myId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      const [contactResult, deletionResult] = await Promise.allSettled([
        fetchContactRequests({ assignedTo: myId, page: 1, limit: 50 }),
        fetchDeletionRequests({ assignedTo: myId, page: 1, limit: 50 }),
      ]);
      if (cancelled) return;

      const failed =
        contactResult.status === "rejected" ||
        deletionResult.status === "rejected";
      if (failed) {
        setError("Failed to load your tickets.");
        setLoading(false);
        return;
      }

      const merged = [
        ...(contactResult.value.data?.requests || []).map((r) => ({
          ...r,
          ticketType: "contact",
        })),
        ...(deletionResult.value.data?.requests || []).map((r) => ({
          ...r,
          ticketType: "deletion",
        })),
      ];
      merged.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setItems(merged);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [myId, refreshKey]);

  const pendingCount = items.filter((t) => t.status === "pending").length;

  const gotoTicket = (t) =>
    navigate(
      t.ticketType === "contact"
        ? `/support/contact/${t._id}`
        : `/support/deletion/${t._id}`
    );

  const columns = [
    {
      name: "Ticket ID",
      width: "125px",
      cell: (t) => (
        <span className="font-mono text-xs font-semibold text-bp-blue">
          {formatTicketId(t._id)}
        </span>
      ),
    },
    {
      name: "Type",
      width: "120px",
      cell: (t) => {
        const isContact = t.ticketType === "contact";
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border ${
              isContact
                ? "bg-bp-blue/10 text-bp-blue border-bp-blue/30"
                : "bg-red-500/10 text-red-400 border-red-500/30"
            }`}
          >
            {isContact ? <MessageSquare size={12} /> : <Trash2 size={12} />}
            {isContact ? "Contact" : "Deletion"}
          </span>
        );
      },
    },
    {
      name: "Subject",
      grow: 2,
      minWidth: "240px",
      cell: (t) => {
        const isContact = t.ticketType === "contact";
        const title = isContact
          ? t.subject
          : `Account deletion Â· ${t.accountIdentifier || t.email}`;
        return (
          <div>
            <p className="text-sm text-bp-text truncate max-w-[240px]">
              {title}
            </p>
            {!isContact && (
              <p className="text-xs text-bp-text-muted truncate max-w-[240px]">
                {t.email}
              </p>
            )}
          </div>
        );
      },
    },
    {
      name: "Status",
      width: "135px",
      cell: (t) => (
        <span
          className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${
            statusColors[t.status] ||
            "bg-bp-text-muted/15 text-bp-text-secondary border-bp-text-muted/30"
          }`}
        >
          {t.status}
        </span>
      ),
    },
    {
      name: "Date",
      width: "185px",
      cell: (t) => (
        <span className="text-sm text-bp-text-muted">
          {formatDate(t.createdAt)}
        </span>
      ),
    },
    {
      name: "Actions",
      width: "80px",
      cell: (t) => (
        <button
          onClick={() => gotoTicket(t)}
          className="p-1.5 text-bp-blue hover:text-bp-cyan hover:bg-bp-blue/10 rounded-lg transition-colors"
          title="View ticket"
        >
          <Eye size={18} />
        </button>
      ),
    },
  ];

  let body;
  if (loading) {
    body = (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-bp-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-bp-text-secondary">Loading your tickets...</p>
        </div>
      </div>
    );
  } else if (error) {
    body = (
      <div className="text-center py-16">
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm bg-bp-card hover:bg-bp-elevated text-bp-text rounded-lg border border-bp-border"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  } else if (!myId) {
    body = (
      <div className="text-center py-16">
        <Inbox className="w-12 h-12 text-bp-text-muted mx-auto mb-3" />
        <p className="text-bp-text font-medium">Could not identify your account</p>
        <p className="text-sm text-bp-text-muted mt-1">
          Please log out and log back in to see your assigned tickets.
        </p>
      </div>
    );
  } else if (items.length === 0) {
    body = (
      <div className="text-center py-16">
        <Inbox className="w-14 h-14 text-bp-text-muted mx-auto mb-4" />
        <p className="text-lg font-medium text-bp-text">No tickets assigned to you yet</p>
        <p className="text-sm text-bp-text-muted mt-2 max-w-md mx-auto">
          New contact and deletion requests are auto-assigned round-robin across
          active support employees. Your queue will fill up as tickets arrive.
        </p>
      </div>
    );
  } else {
    body = (
      <div className="bg-bp-card rounded-2xl overflow-hidden">
        <DataTable
          columns={columns}
          data={items}
          customStyles={tableCustomStyles}
          highlightOnHover
          pointerOnHover
          progressPending={loading}
          noDataComponent={
            <div className="text-center py-16">
              <Inbox className="w-14 h-14 text-bp-text-muted mx-auto mb-4" />
              <p className="text-lg font-medium text-bp-text">
                No tickets assigned to you yet
              </p>
            </div>
          }
        />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Tickets"
        subtitle={
          !loading && !error && myId && items.length > 0
            ? `${items.length} ticket${items.length === 1 ? "" : "s"} assigned to you Â· ${pendingCount} pending`
            : "Tickets assigned to you"
        }
      />
      {body}
    </div>
  );
}
