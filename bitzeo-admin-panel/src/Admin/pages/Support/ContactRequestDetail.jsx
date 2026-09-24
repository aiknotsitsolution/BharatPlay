import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  User,
  Tag,
  Calendar,
  Send,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { fetchContactRequestById, updateContactRequest } from "../../../api";
import useSupportEmployees from "../../../hooks/useSupportEmployees";
import { hasFeature } from "../../../config/roleConfig";
import toast from "react-hot-toast";
import { formatTicketId } from "../../../utils/ticketId";
import PageHeader from "../../../components/layout/PageHeader";

function assignedByLabel(id) {
  if (!id) return "-";
  if (id === "system") return "System (auto-assigned)";
  try {
    const admin = JSON.parse(localStorage.getItem("adminUser") || "null");
    if (admin && String(admin.id) === String(id)) return admin.name;
  } catch {
    /* ignore */
  }
  return id;
}

const statusOptions = [
  { value: "pending", label: "Pending", color: "bg-bp-yellow/15 text-bp-yellow" },
  { value: "in-progress", label: "In Progress", color: "bg-bp-cyan/15 text-bp-cyan" },
  { value: "resolved", label: "Resolved", color: "bg-emerald-500/15 text-emerald-400" },
  { value: "closed", label: "Closed", color: "bg-bp-text-muted/15 text-bp-text-secondary" },
];

const inquiryTypeColors = {
  "General Inquiry": "bg-bp-blue/15 text-bp-blue border-bp-blue/30",
  "Technical Support": "bg-bp-orange/15 text-bp-orange border-bp-orange/30",
  "Privacy Request": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "Data Deletion": "bg-red-500/15 text-red-400 border-red-500/30",
  Complaint: "bg-bp-yellow/15 text-bp-yellow border-bp-yellow/30",
  "Business Inquiry": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Other: "bg-bp-text-muted/15 text-bp-text-secondary border-bp-text-muted/30",
  Copyright: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  Account: "bg-bp-blue/15 text-bp-blue border-bp-blue/30",
  Billing: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export default function ContactRequestDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { employees } = useSupportEmployees();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [adminReply, setAdminReply] = useState("");
  const [assignee, setAssignee] = useState("");

  const fetchRequest = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchContactRequestById(id);
      if (res.data?.success) {
        setRequest(res.data.request);
        setAssignee(res.data.request.assignedTo || "");
      } else {
        setError(res.data?.message || "Request not found");
      }
    } catch (err) {
      console.error("Failed to fetch contact request:", err);
      setError(err.response?.data?.message || "Failed to load request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      const res = await updateContactRequest(id, { status: newStatus });
      if (res.data?.success) {
        setRequest((prev) => ({ ...prev, status: newStatus }));
        toast.success(`Status updated to ${newStatus}`);
      } else {
        toast.error(res.data?.message || "Failed to update status");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleReply = async () => {
    if (!adminReply.trim()) return;
    setUpdating(true);
    try {
      const res = await updateContactRequest(id, {
        adminReply: adminReply.trim(),
      });
      if (res.data?.success) {
        setRequest((prev) => ({
          ...prev,
          adminReply: adminReply.trim(),
          repliedAt: new Date().toISOString(),
        }));
        setAdminReply("");
        toast.success("Reply saved");
      } else {
        toast.error(res.data?.message || "Failed to save reply");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save reply");
    } finally {
      setUpdating(false);
    }
  };

  const handleReassign = async (e) => {
    const value = e.target.value;
    const previous = assignee;
    setAssignee(value);
    setUpdating(true);
    try {
      const res = await updateContactRequest(id, { assignedTo: value || null });
      if (res.data?.success) {
        setRequest((prev) => ({
          ...prev,
          assignedTo: value || null,
          assignedAt: res.data.request.assignedAt,
          assignedBy: res.data.request.assignedBy,
        }));
        toast.success(
          value
            ? `Assigned to ${
                employees.find((e) => String(e.id) === String(value))?.name ||
                "support employee"
              }`
            : "Ticket marked as unassigned"
        );
      } else {
        setAssignee(previous);
        toast.error(res.data?.message || "Failed to update assignee");
      }
    } catch (err) {
      setAssignee(previous);
      toast.error(err.response?.data?.message || "Failed to update assignee");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-bp-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-bp-text-secondary">Loading contact request...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-red-500 font-medium">{error || "Request not found"}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchRequest}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-bp-card hover:bg-bp-elevated text-bp-text rounded-lg border border-bp-border"
            >
              <RotateCcw size={14} />
              Retry
            </button>
            <button
              onClick={() => navigate("/support/contact")}
              className="px-4 py-2 text-sm bg-bp-card hover:bg-bp-elevated text-bp-text rounded-lg border border-bp-border"
            >
              Back to list
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Contact Request"
        subtitle={`${request.name} — ${request.inquiryType} · ${formatTicketId(request._id)}`}
        className="mb-6"
      >
        <button
          onClick={() => navigate("/support/contact")}
          className="inline-flex items-center gap-2 bg-bp-elevated border border-bp-border text-bp-text-secondary hover:text-bp-text hover:bg-bp-hover px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
        >
          <ArrowLeft size={18} />
          Back to List
        </button>
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full border ${
            inquiryTypeColors[request.inquiryType] || "bg-bp-text-muted/15 text-bp-text-secondary border-bp-text-muted/30"
          }`}
        >
          {request.inquiryType}
        </span>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Request details */}
          <div className="bg-bp-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-bp-blue/10">
                <User size={18} className="text-bp-blue" />
              </div>
              <div>
                <p className="text-sm font-semibold text-bp-text">{request.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Mail size={12} className="text-bp-text-muted" />
                  <p className="text-xs text-bp-text-muted">{request.email}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-bp-text-secondary">
              <Calendar size={14} className="text-bp-text-muted" />
              <span>{formatDate(request.createdAt)}</span>
            </div>

            <div>
              <p className="text-xs font-medium text-bp-text-muted uppercase tracking-wider mb-2">
                Subject
              </p>
              <p className="text-sm text-bp-text font-semibold">{request.subject}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-bp-text-muted uppercase tracking-wider mb-2">
                Message
              </p>
              <div className="bg-bp-elevated rounded-xl p-4">
                <p className="text-sm text-bp-text leading-relaxed whitespace-pre-wrap">
                  {request.message}
                </p>
              </div>
            </div>

            {request.adminReply && (
              <div>
                <p className="text-xs font-medium text-bp-text-muted uppercase tracking-wider mb-2">
                  Admin Reply
                </p>
                <div className="bg-bp-blue/5 border border-bp-blue/20 rounded-xl p-4">
                  <p className="text-sm text-bp-text leading-relaxed whitespace-pre-wrap">
                    {request.adminReply}
                  </p>
                  {request.repliedAt && (
                    <p className="text-xs text-bp-text-muted mt-2">
                      Replied {formatDate(request.repliedAt)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reply */}
          <div className="bg-bp-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-bp-text mb-4">Reply</h2>
            <textarea
              value={adminReply}
              onChange={(e) => setAdminReply(e.target.value)}
              rows={4}
              placeholder="Type your reply to this request..."
              className="w-full px-4 py-3 bg-bp-elevated border border-bp-border rounded-xl text-bp-text text-sm placeholder:text-bp-text-muted focus:outline-none focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 resize-none"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleReply}
                disabled={updating || !adminReply.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-bp-blue text-white text-sm font-medium rounded-xl hover:bg-bp-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {updating ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-bp-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-bp-text mb-4">Status</h2>
            <div className="space-y-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusUpdate(opt.value)}
                  disabled={updating || request.status === opt.value}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 ${
                    request.status === opt.value
                      ? `${opt.color} border-current ring-1 ring-current/20`
                      : "bg-bp-elevated border-bp-border hover:bg-bp-hover text-bp-text-secondary hover:border-bp-text-muted"
                  } disabled:cursor-not-allowed`}
                >
                  <div
                    className={`w-3 h-3 rounded-full transition-colors ${
                      request.status === opt.value ? "bg-current" : "bg-bp-text-muted"
                    }`}
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Assignment */}
          <div className="bg-bp-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-bp-text mb-4">Assign To</h2>
            {hasFeature("canAssignTicket") ? (
              <select
                value={assignee}
                onChange={handleReassign}
                disabled={updating}
                className="w-full px-3 py-2 bg-bp-elevated border border-bp-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-bp-blue disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">Unassigned</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-bp-text">
                {assignee
                  ? employees.find(
                      (e) =>
                        String(e.id) === String(assignee) ||
                        e.username === assignee ||
                        e.name === assignee
                    )?.name || assignee
                  : "Unassigned"}
              </p>
            )}
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-bp-text-muted mb-0.5">Assigned At</p>
                <p className="text-sm text-bp-text">
                  {request.assignedAt ? formatDate(request.assignedAt) : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-bp-text-muted mb-0.5">Assigned By</p>
                <p className="text-sm text-bp-text break-all">
                  {request.assignedByName || assignedByLabel(request.assignedBy)}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-bp-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-bp-text mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-bp-text-muted mb-1">Ticket ID</p>
                <p className="text-sm text-bp-text font-mono font-semibold break-all">
                  {formatTicketId(request._id)}
                </p>
              </div>
              <div>
                <p className="text-xs text-bp-text-muted mb-1">Created</p>
                <p className="text-sm text-bp-text">{formatDate(request.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-bp-text-muted mb-1">Last Updated</p>
                <p className="text-sm text-bp-text">{formatDate(request.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
