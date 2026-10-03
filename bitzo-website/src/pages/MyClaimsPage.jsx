import { useCallback, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  FileText,
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Film,
  RotateCcw,
} from "lucide-react";
import { API_ORIGIN } from "../config/api";
import { resolveMediaUrl } from "../utils/mediaUrl";

const getToken = () => localStorage.getItem("token");
const CLAIMS_PER_PAGE = 5;

const statusConfig = {
  pending: {
    color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    icon: Clock,
    label: "Pending Review",
  },
  under_review: {
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: Search,
    label: "Under Review",
  },
  action_pending: {
    color: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    icon: Clock,
    label: "Action Pending",
  },
  more_information_required: {
    color: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    icon: AlertTriangle,
    label: "More Info Needed",
  },
  takedown_approved: {
    color: "bg-red-500/15 text-red-400 border-red-500/30",
    icon: CheckCircle,
    label: "Takedown Approved",
  },
  takedown_rejected: {
    color: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    icon: XCircle,
    label: "Takedown Rejected",
  },
  resolved: {
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle,
    label: "Resolved",
  },
  withdrawn: {
    color: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    icon: XCircle,
    label: "Withdrawn",
  },
  disputed: {
    color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    icon: AlertTriangle,
    label: "Disputed",
  },
  dispute_under_review: {
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: Search,
    label: "Dispute Under Review",
  },
  dispute_upheld: {
    color: "bg-red-500/15 text-red-400 border-red-500/30",
    icon: CheckCircle,
    label: "Dispute Upheld",
  },
  dispute_overturned: {
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle,
    label: "Dispute Overturned",
  },
};

export default function MyClaimsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedCaseNumber = searchParams.get("case");
  const [claims, setClaims] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCaseNumber, setSelectedCaseNumber] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClaims = async () => {
      const token = getToken();
      if (!token) {
        setError("Please login to view your claims");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_ORIGIN}/api/copyright/my-claims`, {
          headers: { Authorization: "Bearer " + getToken() },
        });
        const data = await res.json();

        if (data.success) {
          setClaims(data.data || []);
        } else {
          setError(data.message || "Failed to load claims");
        }
      } catch (err) {
        console.error("Failed to fetch claims:", err);
        setError("Failed to load your claims");
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, []);

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const totalPages = Math.ceil(claims.length / CLAIMS_PER_PAGE);
  const visibleClaims = claims.slice(
    (currentPage - 1) * CLAIMS_PER_PAGE,
    currentPage * CLAIMS_PER_PAGE,
  );

  const handleSelectClaim = useCallback(async (claim) => {
    if (selectedCaseNumber === claim.caseNumber) {
      setSelectedCaseNumber(null);
      setSelectedClaim(null);
      setDetailsError(null);
      if (requestedCaseNumber === claim.caseNumber) {
        navigate("/copyright/my-claims", { replace: true });
      }
      return;
    }

    setSelectedCaseNumber(claim.caseNumber);
    setSelectedClaim(null);
    setDetailsError(null);
    setWithdrawError(null);
    setDetailsLoading(true);
    try {
      const res = await fetch(
        `${API_ORIGIN}/api/copyright/my-claims/${encodeURIComponent(claim.caseNumber)}`,
        { headers: { Authorization: "Bearer " + getToken() } },
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load claim details");
      }
      setSelectedClaim(data.data);
    } catch (err) {
      console.error("Failed to load claim details:", err);
      setDetailsError(err.message || "Failed to load claim details");
    } finally {
      setDetailsLoading(false);
    }
  }, [navigate, requestedCaseNumber, selectedCaseNumber]);

  const handleWithdrawClaim = async () => {
    if (!selectedClaim?.caseNumber || withdrawing) return;
    const confirmed = window.confirm(
      `Withdraw copyright claim ${selectedClaim.caseNumber}? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setWithdrawing(true);
    setWithdrawError(null);
    try {
      const res = await fetch(
        `${API_ORIGIN}/api/copyright/my-claims/${encodeURIComponent(selectedClaim.caseNumber)}/withdraw`,
        {
          method: "PUT",
          headers: { Authorization: "Bearer " + getToken() },
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to withdraw claim");
      }
      setSelectedClaim((current) => ({ ...current, ...data.data }));
      setClaims((current) =>
        current.map((claim) =>
          claim.caseNumber === selectedClaim.caseNumber
            ? { ...claim, ...data.data }
            : claim,
        ),
      );
    } catch (err) {
      console.error("Failed to withdraw copyright claim:", err);
      setWithdrawError(err.message || "Failed to withdraw claim");
    } finally {
      setWithdrawing(false);
    }
  };

  const canWithdraw = [
    "pending",
    "under_review",
    "more_information_required",
  ].includes(selectedClaim?.status);

  useEffect(() => {
    if (!requestedCaseNumber || loading || selectedCaseNumber) return;
    const claimIndex = claims.findIndex(
      (claim) => claim.caseNumber === requestedCaseNumber,
    );
    if (claimIndex < 0) return;
    setCurrentPage(Math.floor(claimIndex / CLAIMS_PER_PAGE) + 1);
    handleSelectClaim(claims[claimIndex]);
  }, [
    claims,
    handleSelectClaim,
    loading,
    requestedCaseNumber,
    selectedCaseNumber,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm text-zinc-400">Loading your claims...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-12 h-12 text-red-500/50 mx-auto" />
          <p className="text-zinc-400 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(-1)}
          className="mt-1 p-2 rounded-lg border border-gray-700 bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">My Claims</h1>
          <p className="text-zinc-400 mt-1">
            Track the status of copyright claims you've submitted
          </p>
        </div>
      </div>

      {/* Claims List */}
      {claims.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-xl font-medium text-zinc-300">No claims yet</p>
          <p className="text-sm text-zinc-500 mt-2 mb-6">
            You haven't filed any copyright claims yet.
          </p>
          <button
            onClick={() => navigate("/copyright/claim")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Shield className="w-4 h-4" />
            File a Claim
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleClaims.map((claim) => {
            const status = statusConfig[claim.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <div
                key={claim._id}
                className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 md:p-5 hover:border-zinc-700 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => handleSelectClaim(claim)}
                  aria-expanded={selectedCaseNumber === claim.caseNumber}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-zinc-800 shrink-0">
                        <StatusIcon className={`w-5 h-5 ${
                          claim.status === "pending" ? "text-yellow-400" :
                          claim.status === "under_review" ? "text-blue-400" :
                          claim.status === "takedown_approved" ? "text-red-400" :
                          claim.status === "resolved" ? "text-emerald-400" :
                          "text-zinc-400"
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="text-xs text-zinc-500">
                            Filed {formatDate(claim.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-white font-medium mt-2 truncate">
                          {claim.content?.title || "Untitled video"}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                          {claim.claim?.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                          <span className="font-mono">{claim.caseNumber}</span>
                          <span className="capitalize">{claim.claim?.type?.replace(/_/g, " ")}</span>
                        </div>
                      </div>
                    </div>
                    {selectedCaseNumber === claim.caseNumber ? (
                      <ChevronUp className="w-5 h-5 text-zinc-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-400 shrink-0" />
                    )}
                  </div>
                </button>

                {selectedCaseNumber === claim.caseNumber && (
                  <div className="mt-5 border-t border-zinc-800 pt-5 space-y-5">
                    {detailsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading claim details...
                      </div>
                    ) : detailsError ? (
                      <p className="text-sm text-red-300">{detailsError}</p>
                    ) : selectedClaim ? (
                      <>
                        <div className="grid gap-5 md:grid-cols-2">
                          <section className="space-y-3">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                              <Film className="w-4 h-4 text-indigo-400" />
                              Reported video
                            </h3>
                            {selectedClaim.content?.video?.id && (
                              <Link
                                to={`/video/${selectedClaim.content.video.id}`}
                                className="group relative block overflow-hidden rounded-lg bg-zinc-950"
                              >
                                {selectedClaim.content.video.thumbnail ? (
                                  <img
                                    src={resolveMediaUrl(selectedClaim.content.video.thumbnail)}
                                    alt={`${selectedClaim.content.video.title || "Reported video"} thumbnail`}
                                    className="w-full aspect-video object-cover"
                                  />
                                ) : (
                                  <div className="flex aspect-video items-center justify-center text-zinc-500">
                                    <Film className="w-10 h-10" />
                                  </div>
                                )}
                              </Link>
                            )}
                            <p className="text-sm font-medium text-white">
                              {selectedClaim.content?.video?.title || selectedClaim.content?.title || "Video details unavailable"}
                            </p>
                            {selectedClaim.content?.video?.channel && (
                              <p className="text-sm text-zinc-400">
                                Channel: {selectedClaim.content.video.channel}
                              </p>
                            )}
                            {selectedClaim.content?.video?.description && (
                              <p className="text-sm text-zinc-400 whitespace-pre-wrap">
                                {selectedClaim.content.video.description}
                              </p>
                            )}
                            {selectedClaim.content?.video?.id && (
                              <Link
                                to={`/video/${selectedClaim.content.video.id}`}
                                className="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
                              >
                                Watch reported video <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </section>

                          <section className="space-y-3">
                            <h3 className="text-sm font-semibold text-white">
                              Original work
                            </h3>
                            <p className="text-sm text-zinc-200">
                              {selectedClaim.claim?.originalWork || "Not provided"}
                            </p>
                            {selectedClaim.claim?.originalWorkThumbnail && (
                              <a
                                href={
                                  selectedClaim.claim.originalWorkVideoId
                                    ? `/video/${selectedClaim.claim.originalWorkVideoId}`
                                    : selectedClaim.claim.originalWorkUrl
                                }
                                target={
                                  selectedClaim.claim.originalWorkVideoId
                                    ? undefined
                                    : "_blank"
                                }
                                rel={
                                  selectedClaim.claim.originalWorkVideoId
                                    ? undefined
                                    : "noreferrer"
                                }
                                className="block overflow-hidden rounded-lg bg-zinc-950"
                              >
                                <img
                                  src={resolveMediaUrl(selectedClaim.claim.originalWorkThumbnail)}
                                  alt={`${selectedClaim.claim.originalWork || "Original work"} thumbnail`}
                                  className="w-full aspect-video object-cover"
                                />
                              </a>
                            )}
                            {selectedClaim.claim?.originalWorkUrl && (
                              selectedClaim.claim.originalWorkVideoId ? (
                                <Link
                                  to={`/video/${selectedClaim.claim.originalWorkVideoId}`}
                                  className="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
                                >
                                  Watch original work <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              ) : (
                                <a
                                  href={selectedClaim.claim.originalWorkUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 break-all"
                                >
                                  Open original work <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )
                            )}
                          </section>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 text-sm">
                          <div>
                            <p className="text-xs text-zinc-500">Claim type</p>
                            <p className="mt-1 capitalize text-zinc-200">
                              {selectedClaim.claim?.type?.replace(/_/g, " ") || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500">Priority</p>
                            <p className="mt-1 capitalize text-zinc-200">
                              {selectedClaim.priority || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500">Claimant</p>
                            <p className="mt-1 text-zinc-200">
                              {selectedClaim.claimant?.name || "-"}
                              {selectedClaim.claimant?.organization
                                ? ` · ${selectedClaim.claimant.organization}`
                                : ""}
                            </p>
                            {selectedClaim.claimant?.email && (
                              <p className="text-zinc-400">{selectedClaim.claimant.email}</p>
                            )}
                            {selectedClaim.claimant?.phone && (
                              <p className="text-zinc-400">{selectedClaim.claimant.phone}</p>
                            )}
                            {selectedClaim.claimant?.address && (
                              <p className="text-zinc-400">{selectedClaim.claimant.address}</p>
                            )}
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-xs text-zinc-500">Claim description</p>
                            <p className="mt-1 whitespace-pre-wrap text-zinc-200">
                              {selectedClaim.claim?.description || "No description"}
                            </p>
                          </div>
                        </div>

                        {selectedClaim.resolution?.reason && (
                          <div className="rounded-lg bg-zinc-800/60 p-3">
                            <p className="text-xs text-zinc-500">
                              Resolution
                              {selectedClaim.resolution.decision
                                ? ` · ${selectedClaim.resolution.decision.replace(/_/g, " ")}`
                                : ""}
                            </p>
                            <p className="mt-1 text-sm text-zinc-200">
                              {selectedClaim.resolution.reason}
                            </p>
                          </div>
                        )}

                        {Array.isArray(selectedClaim.evidence) &&
                          selectedClaim.evidence.length > 0 && (
                            <section>
                              <h3 className="text-sm font-semibold text-white mb-2">
                                Submitted evidence
                              </h3>
                              <ul className="space-y-2">
                                {selectedClaim.evidence.map((item) => (
                                  <li
                                    key={item._id || `${item.type}-${item.title}`}
                                    className="rounded-lg bg-zinc-800/50 p-3"
                                  >
                                    <p className="text-sm text-zinc-200">
                                      {item.title || item.type?.replace(/_/g, " ")}
                                    </p>
                                    {item.description && (
                                      <p className="text-sm text-zinc-400 mt-1">
                                        {item.description}
                                      </p>
                                    )}
                                    {item.url?.startsWith("https://") ||
                                    item.url?.startsWith("http://") ? (
                                      <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 mt-2 text-sm text-indigo-400 hover:text-indigo-300 break-all"
                                      >
                                        View evidence <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            </section>
                          )}

                        {Array.isArray(selectedClaim.statusHistory) &&
                          selectedClaim.statusHistory.length > 0 && (
                            <section>
                              <h3 className="text-sm font-semibold text-white mb-2">
                                Status history
                              </h3>
                              <ul className="space-y-2">
                                {selectedClaim.statusHistory.map((entry, index) => (
                                  <li
                                    key={`${entry.timestamp || entry.to}-${index}`}
                                    className="flex flex-wrap justify-between gap-2 text-sm"
                                  >
                                    <span className="text-zinc-300">
                                      {entry.from ? `${entry.from.replace(/_/g, " ")} → ` : ""}
                                      {entry.to?.replace(/_/g, " ")}
                                      {entry.reason ? ` · ${entry.reason}` : ""}
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                      {formatDate(entry.timestamp)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </section>
                          )}

                        {withdrawError && (
                          <p role="alert" className="text-sm text-red-300">
                            {withdrawError}
                          </p>
                        )}
                        {canWithdraw && (
                          <button
                            type="button"
                            onClick={handleWithdrawClaim}
                            disabled={withdrawing}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {withdrawing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                            {withdrawing ? "Withdrawing..." : "Withdraw claim"}
                          </button>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3">
              <p className="text-sm text-zinc-500">
                Showing {(currentPage - 1) * CLAIMS_PER_PAGE + 1}-
                {Math.min(currentPage * CLAIMS_PER_PAGE, claims.length)} of{" "}
                {claims.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-zinc-400">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
