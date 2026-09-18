import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  User,
  Calendar,
  FileText,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { fetchDeletionRequests, updateDeletionRequest } from "../../../api";
import toast from "react-hot-toast";

const statusOptions = [
  { value: "pending", label: "Pending", color: "bg-bp-yellow/15 text-bp-yellow" },
  { value: "verified", label: "Verified", color: "bg-bp-cyan/15 text-bp-cyan" },
  { value: "processing", label: "Processing", color: "bg-purple-500/15 text-purple-400" },
  { value: "completed", label: "Completed", color: "bg-emerald-500/15 text-emerald-400" },
  { value: "rejected", label: "Rejected", color: "bg-red-500/15 text-red-400" },
];

export default function DeletionRequestDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const res = await fetchDeletionRequests({ page: 1, limit: 100 });
      const found = (res.data?.requests || []).find((r) => r._id === id);
      setRequest(found || null);
    } catch (err) {
      console.error("Failed to fetch deletion request:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    if (
      newStatus === "completed" &&
      !window.confirm(
        "Marking as completed will permanently delete the user account. Are you sure?"
      )
    ) {
      return;
    }

    setUpdating(true);
    try {
      const res = await updateDeletionRequest(id, {
        status: newStatus,
        adminNotes: adminNotes.trim() || undefined,
      });
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

  const handleSaveNotes = async () => {
    setUpdating(true);
    try {
      const res = await updateDeletionRequest(id, {
        adminNotes: adminNotes.trim(),
      });
      if (res.data?.success) {
        setRequest((prev) => ({ ...prev, adminNotes: adminNotes.trim() }));
        toast.success("Notes saved");
      } else {
        toast.error(res.data?.message || "Failed to save notes");
      }
    } catch (err) {
      toast.error("Failed to save notes");
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
            Loading deletion request...
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
            onClick={() => navigate("/support/deletion")}
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
          onClick={() => navigate("/support/deletion")}
          className="p-2 hover:bg-bp-elevated rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-bp-text-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-bp-text">
            Deletion Request
          </h1>
          <p className="text-[13px] text-bp-text-secondary mt-1">
            {request.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Request details */}
          <div className="bg-bp-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Mail size={18} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-bp-text">
                  {request.email}
                </p>
                {request.userId && (
                  <p className="text-xs text-bp-text-muted font-mono">
                    User ID: {request.userId}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User size={14} className="text-bp-text-muted" />
                <span className="text-sm text-bp-text-secondary">
                  Account: {request.accountIdentifier || "Not provided"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-bp-text-muted" />
                <span className="text-sm text-bp-text-secondary">
                  {formatDate(request.createdAt)}
                </span>
              </div>
            </div>

            {request.reason && (
              <div>
                <p className="text-xs font-medium text-bp-text-muted uppercase tracking-wider mb-2">
                  Reason
                </p>
                <div className="bg-bp-elevated rounded-xl p-4">
                  <p className="text-sm text-bp-text leading-relaxed whitespace-pre-wrap">
                    {request.reason}
                  </p>
                </div>
              </div>
            )}

            {request.adminNotes && (
              <div>
                <p className="text-xs font-medium text-bp-text-muted uppercase tracking-wider mb-2">
                  Admin Notes
                </p>
                <div className="bg-bp-blue/5 border border-bp-blue/20 rounded-xl p-4">
                  <p className="text-sm text-bp-text leading-relaxed whitespace-pre-wrap">
                    {request.adminNotes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Admin Notes */}
          <div className="bg-bp-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-bp-text mb-4">
              Admin Notes
            </h2>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              placeholder="Add internal notes about this deletion request..."
              className="w-full px-4 py-3 bg-bp-elevated border border-bp-border rounded-xl text-bp-text text-sm placeholder:text-bp-text-muted focus:outline-none focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 resize-none"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSaveNotes}
                disabled={updating}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-bp-elevated border border-bp-border text-bp-text text-sm font-medium rounded-xl hover:bg-bp-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                Save Notes
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

            {request.status === "completed" && request.userId && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-400">
                    User account has been marked as deleted. User status set to
                    &ldquo;deleted&rdquo; in the database.
                  </p>
                </div>
              </div>
            )}
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
              {request.processedBy && (
                <div>
                  <p className="text-xs text-bp-text-muted">Processed By</p>
                  <p className="text-sm text-bp-text font-mono">
                    {request.processedBy}
                  </p>
                </div>
              )}
              {request.processedAt && (
                <div>
                  <p className="text-xs text-bp-text-muted">Processed At</p>
                  <p className="text-sm text-bp-text">
                    {formatDate(request.processedAt)}
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
