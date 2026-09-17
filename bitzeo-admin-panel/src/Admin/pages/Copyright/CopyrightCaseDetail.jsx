import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  User,
  FileText,
  Shield,
  MessageSquare,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchCopyrightCaseById,
  updateCopyrightCaseStatus,
  assignCopyrightCase,
  addCopyrightEvidence,
  addCopyrightNote,
} from "../../../api";
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

const VALID_CASE_TRANSITIONS = {
  pending: ["under_review", "withdrawn"],
  under_review: ["takedown_approved", "takedown_rejected", "disputed", "withdrawn"],
  takedown_approved: ["resolved"],
  takedown_rejected: ["resolved"],
  disputed: ["dispute_under_review"],
  dispute_under_review: ["dispute_upheld", "dispute_overturned"],
  dispute_upheld: ["resolved"],
  dispute_overturned: ["resolved"],
  resolved: [],
  withdrawn: [],
};

const statusLabels = {
  pending: "Pending",
  under_review: "Under Review",
  takedown_approved: "Takedown Approved",
  takedown_rejected: "Takedown Rejected",
  disputed: "Disputed",
  dispute_under_review: "Dispute Under Review",
  dispute_upheld: "Dispute Upheld",
  dispute_overturned: "Dispute Overturned",
  resolved: "Resolved",
  withdrawn: "Withdrawn",
};

export default function CopyrightCaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [noteText, setNoteText] = useState("");
  const [evidenceForm, setEvidenceForm] = useState({
    type: "url",
    title: "",
    description: "",
    url: "",
  });

  const fetchCase = async () => {
    setLoading(true);
    try {
      const res = await fetchCopyrightCaseById(id);
      setCaseData(res.data?.data || null);
    } catch (err) {
      console.error("Failed to fetch case:", err);
      toast.error("Failed to load case details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      toast.error("Please select a status");
      return;
    }
    setUpdating(true);
    try {
      await updateCopyrightCaseStatus(id, { status: newStatus, reason: statusReason });
      toast.success(`Status updated to ${statusLabels[newStatus]}`);
      setNewStatus("");
      setStatusReason("");
      fetchCase();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      toast.error("Please enter a note");
      return;
    }
    setUpdating(true);
    try {
      await addCopyrightNote(id, { text: noteText });
      toast.success("Note added");
      setNoteText("");
      fetchCase();
    } catch (err) {
      toast.error("Failed to add note");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddEvidence = async () => {
    if (!evidenceForm.title && !evidenceForm.url) {
      toast.error("Please provide a title or URL");
      return;
    }
    setUpdating(true);
    try {
      await addCopyrightEvidence(id, evidenceForm);
      toast.success("Evidence added");
      setEvidenceForm({ type: "url", title: "", description: "", url: "" });
      fetchCase();
    } catch (err) {
      toast.error("Failed to add evidence");
    } finally {
      setUpdating(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-bp-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-bp-text-secondary">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-white font-medium">Case not found</p>
          <button
            onClick={() => navigate("/copyright/cases")}
            className="px-4 py-2 text-sm bg-bp-blue hover:bg-bp-blue text-white rounded-lg"
          >
            Back to Cases
          </button>
        </div>
      </div>
    );
  }

  const allowedTransitions = VALID_CASE_TRANSITIONS[caseData.status] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/copyright/cases")}
          className="p-2 text-bp-text-secondary hover:text-bp-text hover:bg-bp-elevated rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-bp-text">{caseData.caseNumber}</h1>
            <span
              className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${
                statusColors[caseData.status] || "bg-bp-text-muted/15 text-bp-text-secondary border-bp-text-muted/30"
              }`}
            >
              {statusLabels[caseData.status]}
            </span>
            <span className={`text-xs font-medium capitalize ${priorityColors[caseData.priority] || "text-bp-text-secondary"}`}>
              {caseData.priority} priority
            </span>
          </div>
          <p className="text-bp-text-secondary mt-0.5">Created {formatDate(caseData.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Claim Details */}
          <div className="bg-bp-card rounded-2xl border border-bp-border p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-bp-blue" />
              Claim Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-bp-text-muted">Claim Type</p>
                <p className="text-sm text-white capitalize">{caseData.claim?.type?.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-sm text-bp-text-muted">Original Work</p>
                <p className="text-sm text-white">{caseData.claim?.originalWork || "-"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-bp-text-muted">Description</p>
                <p className="text-sm text-white">{caseData.claim?.description || "-"}</p>
              </div>
            </div>
          </div>

          {/* Content Under Dispute */}
          <div className="bg-bp-card rounded-2xl border border-bp-border p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-bp-cyan" />
              Content Under Dispute
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-bp-elevated flex items-center justify-center">
                <FileText className="w-6 h-6 text-bp-text-muted" />
              </div>
              <div>
                <p className="font-medium text-white">{caseData.content?.title || "Untitled"}</p>
                <p className="text-sm text-bp-text-muted mt-0.5">
                  Video ID: {caseData.content?.video?._id || caseData.content?.video}
                </p>
              </div>
            </div>
          </div>

          {/* Evidence */}
          <div className="bg-bp-card rounded-2xl border border-bp-border p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              Evidence ({caseData.evidence?.length || 0})
            </h2>
            {caseData.evidence?.length > 0 ? (
              <div className="space-y-3">
                {caseData.evidence.map((e, idx) => (
                  <div key={idx} className="p-3 bg-bp-elevated/50 rounded-xl border border-bp-border/50">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-xs font-medium bg-bp-border text-white rounded">
                        {e.type}
                      </span>
                      <span className="text-xs text-bp-text-muted">{formatDate(e.createdAt)}</span>
                    </div>
                    {e.title && <p className="text-sm text-white mt-2">{e.title}</p>}
                    {e.description && <p className="text-sm text-bp-text-secondary mt-1">{e.description}</p>}
                    {e.url && (
                      <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-sm text-bp-cyan hover:underline mt-1 inline-block">
                        {e.url}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-bp-text-muted">No evidence submitted yet</p>
            )}

            {/* Add Evidence Form */}
            <div className="mt-4 p-4 bg-bp-elevated/30 rounded-xl border border-bp-border/30">
              <h3 className="text-sm font-medium text-white mb-3">Add Evidence</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={evidenceForm.type}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, type: e.target.value })}
                  className="px-3 py-2 bg-bp-elevated border border-bp-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-bp-blue"
                >
                  <option value="url">URL</option>
                  <option value="document">Document</option>
                  <option value="screenshot">Screenshot</option>
                  <option value="legal_notice">Legal Notice</option>
                  <option value="ownership_proof">Ownership Proof</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="text"
                  value={evidenceForm.title}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, title: e.target.value })}
                  placeholder="Title"
                  className="px-3 py-2 bg-bp-elevated border border-bp-border rounded-lg text-white text-sm placeholder:text-bp-text-muted focus:outline-none focus:ring-2 focus:ring-bp-blue"
                />
                <input
                  type="text"
                  value={evidenceForm.url}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, url: e.target.value })}
                  placeholder="URL"
                  className="px-3 py-2 bg-bp-elevated border border-bp-border rounded-lg text-white text-sm placeholder:text-bp-text-muted focus:outline-none focus:ring-2 focus:ring-bp-blue"
                />
                <input
                  type="text"
                  value={evidenceForm.description}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })}
                  placeholder="Description"
                  className="px-3 py-2 bg-bp-elevated border border-bp-border rounded-lg text-white text-sm placeholder:text-bp-text-muted focus:outline-none focus:ring-2 focus:ring-bp-blue"
                />
              </div>
              {hasFeature("canUpdateCopyrightStatus") && (
                <button
                  onClick={handleAddEvidence}
                  disabled={updating}
                  className="mt-3 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  Add Evidence
                </button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-bp-card rounded-2xl border border-bp-border p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-bp-yellow" />
              Notes ({caseData.notes?.length || 0})
            </h2>
            {caseData.notes?.length > 0 ? (
              <div className="space-y-3 mb-4">
                {caseData.notes.map((n, idx) => (
                  <div key={idx} className="p-3 bg-bp-elevated/50 rounded-xl border border-bp-border/50">
                    <p className="text-sm text-white">{n.text}</p>
                    <p className="text-xs text-bp-text-muted mt-2">
                      {n.author?.name || "Admin"} Â· {formatDate(n.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-bp-text-muted mb-4">No notes yet</p>
            )}

            {/* Add Note Form */}
            <div className="flex gap-3">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 px-3 py-2 bg-bp-elevated border border-bp-border rounded-lg text-white text-sm placeholder:text-bp-text-muted focus:outline-none focus:ring-2 focus:ring-bp-blue"
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              />
              {hasFeature("canUpdateCopyrightStatus") && (
                <button
                  onClick={handleAddNote}
                  disabled={updating || !noteText.trim()}
                  className="px-4 py-2 bg-bp-blue hover:bg-bp-blue text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  <Send size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Status History */}
          <div className="bg-bp-card rounded-2xl border border-bp-border p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Status History
            </h2>
            {caseData.statusHistory?.length > 0 ? (
              <div className="space-y-3">
                {caseData.statusHistory.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-bp-blue"></div>
                    <div className="flex-1">
                      <p className="text-sm text-white">
                        {h.from ? statusLabels[h.from] || h.from : "Created"} â†’ {statusLabels[h.to] || h.to}
                      </p>
                      {h.reason && <p className="text-xs text-bp-text-muted mt-0.5">{h.reason}</p>}
                    </div>
                    <span className="text-xs text-bp-text-muted">{formatDate(h.timestamp)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-bp-text-muted">No status changes yet</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Claimant Info */}
          <div className="bg-bp-card rounded-2xl border border-bp-border p-6">
            <h3 className="text-sm font-medium text-bp-text-secondary mb-3">Claimant</h3>
            <div className="space-y-2">
              <p className="text-sm text-white">{caseData.claimant?.name}</p>
              <p className="text-sm text-bp-text-muted">{caseData.claimant?.email}</p>
              {caseData.claimant?.organization && (
                <p className="text-sm text-bp-text-muted">{caseData.claimant.organization}</p>
              )}
            </div>
          </div>

          {/* Respondent Info */}
          <div className="bg-bp-card rounded-2xl border border-bp-border p-6">
            <h3 className="text-sm font-medium text-bp-text-secondary mb-3">Respondent</h3>
            <div className="space-y-2">
              <p className="text-sm text-white">{caseData.respondent?.name || "-"}</p>
              <p className="text-sm text-bp-text-muted">{caseData.respondent?.email || "-"}</p>
            </div>
          </div>

          {/* Assigned To */}
          <div className="bg-bp-card rounded-2xl border border-bp-border p-6">
            <h3 className="text-sm font-medium text-bp-text-secondary mb-3">Assigned To</h3>
            <div className="space-y-2">
              <p className="text-sm text-white">{caseData.assignedTo?.name || "Unassigned"}</p>
              {caseData.assignedTo?.email && (
                <p className="text-sm text-bp-text-muted">{caseData.assignedTo.email}</p>
              )}
            </div>
          </div>

          {/* Status Update */}
          {allowedTransitions.length > 0 && (
            <div className="bg-bp-card rounded-2xl border border-bp-border p-6">
              <h3 className="text-sm font-medium text-bp-text-secondary mb-3">Update Status</h3>
              <div className="space-y-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-bp-elevated border border-bp-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-bp-blue"
                >
                  <option value="">Select status...</option>
                  {allowedTransitions.map((s) => (
                    <option key={s} value={s}>{statusLabels[s]}</option>
                  ))}
                </select>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Reason (optional)"
                  rows={3}
                  className="w-full px-3 py-2 bg-bp-elevated border border-bp-border rounded-lg text-white text-sm placeholder:text-bp-text-muted focus:outline-none focus:ring-2 focus:ring-bp-blue resize-none"
                />
                {hasFeature("canUpdateCopyrightStatus") && (
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updating || !newStatus}
                    className="w-full px-4 py-2 bg-bp-blue hover:bg-bp-blue text-white rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {updating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Update Status
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Resolution */}
          {caseData.resolution?.decision && (
            <div className="bg-bp-card rounded-2xl border border-bp-border p-6">
              <h3 className="text-sm font-medium text-bp-text-secondary mb-3">Resolution</h3>
              <div className="space-y-2">
                <p className="text-sm text-white capitalize">
                  {caseData.resolution.decision.replace(/_/g, " ")}
                </p>
                {caseData.resolution.reason && (
                  <p className="text-sm text-bp-text-muted">{caseData.resolution.reason}</p>
                )}
                {caseData.resolution.resolvedAt && (
                  <p className="text-xs text-bp-text-muted">
                    Resolved {formatDate(caseData.resolution.resolvedAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Linked Strike */}
          {caseData.strike && (
            <div className="bg-bp-card rounded-2xl border border-bp-border p-6">
              <h3 className="text-sm font-medium text-bp-text-secondary mb-3">Linked Strike</h3>
              <button
                onClick={() => navigate(`/copyright/strikes/${caseData.strike._id || caseData.strike}`)}
                className="w-full text-left p-3 bg-bp-elevated/50 rounded-xl border border-bp-border/50 hover:bg-bp-elevated transition-colors"
              >
                <p className="text-sm text-bp-blue font-medium">
                  {caseData.strike.status || "View Strike"}
                </p>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
