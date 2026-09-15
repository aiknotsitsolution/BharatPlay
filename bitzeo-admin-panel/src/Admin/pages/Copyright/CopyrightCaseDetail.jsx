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
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  under_review: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  takedown_approved: "bg-red-500/15 text-red-400 border-red-500/30",
  takedown_rejected: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  disputed: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  dispute_under_review: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  dispute_upheld: "bg-red-500/15 text-red-400 border-red-500/30",
  dispute_overturned: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  withdrawn: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

const priorityColors = {
  low: "text-gray-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
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
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-gray-200 font-medium">Case not found</p>
          <button
            onClick={() => navigate("/copyright/cases")}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
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
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{caseData.caseNumber}</h1>
            <span
              className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${
                statusColors[caseData.status] || "bg-gray-500/15 text-gray-400 border-gray-500/30"
              }`}
            >
              {statusLabels[caseData.status]}
            </span>
            <span className={`text-xs font-medium capitalize ${priorityColors[caseData.priority] || "text-gray-400"}`}>
              {caseData.priority} priority
            </span>
          </div>
          <p className="text-gray-400 mt-0.5">Created {formatDate(caseData.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Claim Details */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Claim Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Claim Type</p>
                <p className="text-sm text-gray-200 capitalize">{caseData.claim?.type?.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Original Work</p>
                <p className="text-sm text-gray-200">{caseData.claim?.originalWork || "-"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-sm text-gray-200">{caseData.claim?.description || "-"}</p>
              </div>
            </div>
          </div>

          {/* Content Under Dispute */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-blue-400" />
              Content Under Dispute
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gray-800 flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <p className="font-medium text-gray-200">{caseData.content?.title || "Untitled"}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Video ID: {caseData.content?.video?._id || caseData.content?.video}
                </p>
              </div>
            </div>
          </div>

          {/* Evidence */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              Evidence ({caseData.evidence?.length || 0})
            </h2>
            {caseData.evidence?.length > 0 ? (
              <div className="space-y-3">
                {caseData.evidence.map((e, idx) => (
                  <div key={idx} className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-700 text-gray-300 rounded">
                        {e.type}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(e.createdAt)}</span>
                    </div>
                    {e.title && <p className="text-sm text-gray-200 mt-2">{e.title}</p>}
                    {e.description && <p className="text-sm text-gray-400 mt-1">{e.description}</p>}
                    {e.url && (
                      <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline mt-1 inline-block">
                        {e.url}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No evidence submitted yet</p>
            )}

            {/* Add Evidence Form */}
            <div className="mt-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Add Evidence</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={evidenceForm.type}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, type: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  value={evidenceForm.url}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, url: e.target.value })}
                  placeholder="URL"
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  value={evidenceForm.description}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })}
                  placeholder="Description"
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              Notes ({caseData.notes?.length || 0})
            </h2>
            {caseData.notes?.length > 0 ? (
              <div className="space-y-3 mb-4">
                {caseData.notes.map((n, idx) => (
                  <div key={idx} className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <p className="text-sm text-gray-200">{n.text}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {n.author?.name || "Admin"} · {formatDate(n.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">No notes yet</p>
            )}

            {/* Add Note Form */}
            <div className="flex gap-3">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              />
              {hasFeature("canUpdateCopyrightStatus") && (
                <button
                  onClick={handleAddNote}
                  disabled={updating || !noteText.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  <Send size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Status History */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Status History
            </h2>
            {caseData.statusHistory?.length > 0 ? (
              <div className="space-y-3">
                {caseData.statusHistory.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-200">
                        {h.from ? statusLabels[h.from] || h.from : "Created"} → {statusLabels[h.to] || h.to}
                      </p>
                      {h.reason && <p className="text-xs text-gray-500 mt-0.5">{h.reason}</p>}
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(h.timestamp)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No status changes yet</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Claimant Info */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Claimant</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-200">{caseData.claimant?.name}</p>
              <p className="text-sm text-gray-500">{caseData.claimant?.email}</p>
              {caseData.claimant?.organization && (
                <p className="text-sm text-gray-500">{caseData.claimant.organization}</p>
              )}
            </div>
          </div>

          {/* Respondent Info */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Respondent</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-200">{caseData.respondent?.name || "-"}</p>
              <p className="text-sm text-gray-500">{caseData.respondent?.email || "-"}</p>
            </div>
          </div>

          {/* Assigned To */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Assigned To</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-200">{caseData.assignedTo?.name || "Unassigned"}</p>
              {caseData.assignedTo?.email && (
                <p className="text-sm text-gray-500">{caseData.assignedTo.email}</p>
              )}
            </div>
          </div>

          {/* Status Update */}
          {allowedTransitions.length > 0 && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Update Status</h3>
              <div className="space-y-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                {hasFeature("canUpdateCopyrightStatus") && (
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updating || !newStatus}
                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
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
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Resolution</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-200 capitalize">
                  {caseData.resolution.decision.replace(/_/g, " ")}
                </p>
                {caseData.resolution.reason && (
                  <p className="text-sm text-gray-500">{caseData.resolution.reason}</p>
                )}
                {caseData.resolution.resolvedAt && (
                  <p className="text-xs text-gray-500">
                    Resolved {formatDate(caseData.resolution.resolvedAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Linked Strike */}
          {caseData.strike && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Linked Strike</h3>
              <button
                onClick={() => navigate(`/copyright/strikes/${caseData.strike._id || caseData.strike}`)}
                className="w-full text-left p-3 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition-colors"
              >
                <p className="text-sm text-indigo-400 font-medium">
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
