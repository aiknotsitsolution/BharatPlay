import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  User,
  Tag,
  Calendar,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react";
import { fetchContactRequests, updateContactRequest } from "../../../api";
import toast from "react-hot-toast";

const statusOptions = [
  { value: "pending", label: "Pending", color: "bg-bp-yellow/15 text-bp-yellow" },
  { value: "in-progress", label: "In Progress", color: "bg-bp-cyan/15 text-bp-cyan" },
  { value: "resolved", label: "Resolved", color: "bg-emerald-500/15 text-emerald-400" },
  { value: "closed", label: "Closed", color: "bg-bp-text-muted/15 text-bp-text-secondary" },
];

export default function ContactRequestDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [adminReply, setAdminReply] = useState("");

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const res = await fetchContactRequests({ page: 1, limit: 100 });
      const found = (res.data?.requests || []).find((r) => r._id === id);
      setRequest(found || null);
    } catch (err) {
      console.error("Failed to fetch contact request:", err);
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
      toast.error("Failed to update status");
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
        status: "in-progress",
      });
      if (res.data?.success) {
        setRequest((prev) => ({
          ...prev,
          adminReply: adminReply.trim(),
          repliedAt: new Date().toISOString(),
          status: "in-progress",
        }));
        setAdminReply("");
        toast.success("Reply saved and status updated to in-progress");
      } else {
        toast.error(res.data?.message || "Failed to save reply");
      }
    } catch (err) {
      toast.error("Failed to save reply");
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
          <p className="text-sm text-bp-text-secondary">
            Loading contact request...
          </p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-red-600 font-medium">Request not found</p>
          <button
            onClick={() => navigate("/support/contact")}
            className="px-4 py-2 text-sm bg-bp-card hover:bg-bp-elevated text-bp-text rounded-lg border border-bp-border"
          >
            Back to list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/support/contact")}
          className="p-2 hover:bg-bp-elevated rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-bp-text-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-bp-text">Contact Request</h1>
          <p className="text-[13px] text-bp-text-secondary mt-1">
            {request.name} &mdash; {request.inquiryType}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Request details */}
          <div className="bg-bp-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-bp-blue/10">
                <User size={18} className="text-bp-blue" />
              </div>
              <div>
                <p className="text-sm font-medium text-bp-text">
                  {request.name}
                </p>
                <p className="text-xs text-bp-text-muted">{request.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-bp-text-muted" />
                <span className="text-sm text-bp-text-secondary">
                  {request.inquiryType}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-bp-text-muted" />
                <span className="text-sm text-bp-text-secondary">
                  {formatDate(request.createdAt)}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-bp-text-muted uppercase tracking-wider mb-2">
                Subject
              </p>
              <p className="text-sm text-bp-text font-medium">
                {request.subject}
              </p>
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
            <h2 className="text-base font-semibold text-bp-text mb-4">
              Reply
            </h2>
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
                {updating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {updating ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-bp-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-bp-text mb-4">
              Status
            </h2>
            <div className="space-y-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusUpdate(opt.value)}
                  disabled={updating || request.status === opt.value}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    request.status === opt.value
                      ? `${opt.color} border-current`
                      : "bg-bp-elevated border-bp-border hover:bg-bp-hover text-bp-text-secondary"
                  } disabled:cursor-not-allowed`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      request.status === opt.value ? "bg-current" : "bg-bp-text-muted"
                    }`}
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-bp-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-bp-text mb-4">
              Details
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-bp-text-muted">Request ID</p>
                <p className="text-sm text-bp-text font-mono">{request._id}</p>
              </div>
              <div>
                <p className="text-xs text-bp-text-muted">Created</p>
                <p className="text-sm text-bp-text">
                  {formatDate(request.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-bp-text-muted">Last Updated</p>
                <p className="text-sm text-bp-text">
                  {formatDate(request.updatedAt)}
                </p>
              </div>
              {request.userId && (
                <div>
                  <p className="text-xs text-bp-text-muted">User ID</p>
                  <p className="text-sm text-bp-text font-mono">
                    {request.userId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
