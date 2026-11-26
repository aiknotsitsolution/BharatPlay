

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Play,
  FileText,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Info,
  Clock,
  Eye,
  Heart,
  Scissors,
  Ban,
  Scale,
  Phone,
  ShieldCheck,
  Link2,
} from "lucide-react";
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import {
  fetchCopyrightCases,
  fetchCopyrightCaseById,
  updateCopyrightCaseStatus,
} from "../../../api";
import { hasFeature } from "../../../config/roleConfig";
import PageHeader from "../../../components/layout/PageHeader";
import tableCustomStyles from "../../../utils/tableStyles";
import {
  PAGINATION_PER_PAGE,
  PAGINATION_OPTIONS,
} from "../../../utils/paginationConfig";
import {
  statusLabels,
  statusColors,
  priorityBadgeColors,
  relationshipLabels,
  statusOptions,
} from "./copyrightStatus";

/**
 * Claim review screen: claimant on the left, accused on the right.
 *
 * The whole decision is one button. The service walks the case through review
 * and the strike decision in a single call, and the guards there still apply, so
 * this stays simple without letting a claim skip review.
 */

const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

// Older uploads never stored a duration, so say that rather than showing a
// bare dash that looks like a loading failure.
const fmtDuration = (seconds) => {
  if (seconds === null || seconds === undefined) return "Not recorded";
  if (typeof seconds !== "number" || Number.isNaN(seconds)) return "Not recorded";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

const compact = (n) =>
  Number.isFinite(Number(n))
    ? new Intl.NumberFormat("en-US").format(Number(n))
    : "—";

// The model stores videoType as an array, so it can arrive as ["long"].
const videoTypeLabel = (video) => {
  const t = video?.videoType;
  const value = Array.isArray(t) ? t[0] : t;
  return value ? value.toUpperCase() : "—";
};

function Field({ label, value, mono }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-bp-text-muted uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`text-[13px] text-bp-text mt-0.5 break-words ${mono ? "font-mono" : ""}`}
      >
        {value === null || value === undefined || value === "" ? "—" : value}
      </p>
    </div>
  );
}

/**
 * Compares the claimant's original upload against the accused upload. Which one
 * came first is the single strongest signal in an infringement claim, so it is
 * surfaced as a headline instead of left for the reviewer to work out.
 */
function buildTimeline(original, claimed) {
  const o = original?.createdAt ? new Date(original.createdAt).getTime() : null;
  const c = claimed?.createdAt ? new Date(claimed.createdAt).getTime() : null;
  if (o === null || c === null) {
    return { tone: "muted", label: "Upload dates unavailable", detail: "" };
  }
  const dayMs = 86400000;
  // Compare calendar days rather than raw timestamps, so two uploads on the
  // same day are never reported as a one day gap.
  const midnight = (value) => {
    const d = new Date(value);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  };
  // Claimed minus original. Positive means the original predates the accused
  // upload, which is the direction that supports the claim.
  const days = Math.round((midnight(c) - midnight(o)) / dayMs);
  if (days > 0) {
    return {
      tone: "good",
      label: `Original uploaded ${days} day${days === 1 ? "" : "s"} first`,
      detail: "The original predates the claimed upload, which supports the claim.",
    };
  }
  if (days < 0) {
    const late = Math.abs(days);
    return {
      tone: "bad",
      label: `Claimed video uploaded ${late} day${late === 1 ? "" : "s"} first`,
      detail:
        "The accused upload is older than the original work, which weakens the claim.",
    };
  }
  return {
    tone: "muted",
    label: "Both uploaded the same day",
    detail: "Upload dates alone cannot separate the two works.",
  };
}

/** Video card with an inline player, so a reviewer never leaves the page. */
function VideoPanel({ video, label, username, channelName, emptyText }) {
  const [playing, setPlaying] = useState(false);

  if (!video) {
    return (
      <div className="bg-bp-elevated rounded-xl border border-bp-border p-4 h-full flex flex-col">
        <p className="text-xs font-semibold text-bp-text-muted uppercase tracking-wide">
          {label}
        </p>
        <div className="flex-1 flex items-center justify-center py-8 text-center">
          <p className="text-[13px] text-bp-text-muted">{emptyText}</p>
        </div>
      </div>
    );
  }

  const url = video.videoUrl;
  const isDisabled = video.status === "disabled";
  const isDeleted = Boolean(video.deletedAt);

  return (
    <div className="bg-bp-elevated rounded-xl border border-bp-border p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-bp-text-muted uppercase tracking-wide">
          {label}
        </p>
        <div className="flex items-center gap-1.5">
          {isDisabled && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-red-500/15 text-red-400 border-red-500/30">
              Disabled
            </span>
          )}
          {isDeleted && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-bp-text-muted/15 text-bp-text-secondary border-bp-text-muted/30">
              Deleted
            </span>
          )}
          {video.status === "active" && !isDeleted && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
              Live
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-bp-border bg-bp-card/70 px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-bp-cyan/10">
            <Eye size={17} className="text-bp-cyan" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-bp-text-muted">
              Views
            </p>
            <p className="text-base font-bold tabular-nums text-bp-text">
              {compact(video.views ?? video.viewsCount ?? 0)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-bp-border bg-bp-card/70 px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500/10">
            <Heart size={17} className="text-pink-400" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-bp-text-muted">
              Likes
            </p>
            <p className="text-base font-bold tabular-nums text-bp-text">
              {compact(video.likesCount ?? video.likes ?? video.likeCount ?? 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
        {playing && url ? (
          <video src={url} controls playsInline className="w-full h-full" />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group w-full h-full flex items-center justify-center"
            aria-label={`Play ${video.title || "video"}`}
          >
            {video.thumbnail ? (
              <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-bp-text-muted">
                <Play size={24} />
              </div>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                <Play size={22} className="text-white ml-0.5" />
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm text-bp-text font-medium line-clamp-2">
          {video.title || "Untitled video"}
        </p>
        <p className="text-xs text-bp-text-muted">
          <span className="text-bp-text-secondary">Username:</span>{" "}
          {username || "—"}
        </p>
        <p className="text-xs text-bp-text-muted">
          <span className="text-bp-text-secondary">Channel:</span>{" "}
          {channelName || "—"}
        </p>
      </div>

      {/* Everything a reviewer compares between the two uploads. */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-3 border-t border-bp-border">
        <Field label="Uploaded" value={fmtDateTime(video.createdAt)} />
        <Field label="Type" value={videoTypeLabel(video)} />
        <Field
          label="Duration"
          value={
            <span className="inline-flex items-center gap-1">
              <Scissors size={11} className="text-bp-text-muted" />
              {fmtDuration(video.duration)}
            </span>
          }
        />
        <Field label="Video ID" value={video._id} mono />
      </div>

      {video.description && (
        <div>
          <p className="text-[11px] text-bp-text-muted uppercase tracking-wide">
            Description
          </p>
          <p className="text-[13px] text-bp-text-secondary mt-0.5 whitespace-pre-wrap">
            {video.description}
          </p>
        </div>
      )}

      {(video.disableReason || video.deleteReason) && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <Ban size={14} className="text-red-400 shrink-0 mt-0.5" />
          <div className="text-[13px]">
            <p className="text-red-300 font-medium">
              {video.deletedAt ? "Deleted" : "Disabled"}
              {video.disabledAt ? ` on ${fmtDate(video.disabledAt)}` : ""}
            </p>
            <p className="text-bp-text-secondary mt-0.5">
              {video.deleteReason || video.disableReason}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-bp-cyan hover:underline"
          >
            <ExternalLink size={12} /> Open video
          </a>
        )}
      </div>
    </div>
  );
}

export function CopyrightCaseReview({ caseId, onBack }) {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const caseKey = caseId || routeId;
  const goBack = onBack || (() => navigate("/copyright/cases"));
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evidenceNote, setEvidenceNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [raising, setRaising] = useState(false);

  const load = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchCopyrightCaseById(id);
        setCaseData(res.data?.data || null);
        setEvidenceNote(res.data?.data?.strike?.evidenceNote || "");
      } catch (err) {
        setError(err.message || "Failed to load case");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (caseKey) load(caseKey);
    else setLoading(false);
  }, [caseKey, load]);

  const raiseStrike = async () => {
    setRaising(true);
    try {
      const res = await updateCopyrightCaseStatus(caseKey, {
        status: "takedown_approved",
        reason: evidenceNote.trim(),
      });
      if (res.data?.success) {
        toast.success(
          res.data.alreadyRaised
            ? "Strike was already raised on this claim"
            : "Strike raised and video disabled",
        );
        setConfirmOpen(false);
        await load(caseKey);
        goBack();
      } else {
        toast.error(res.data?.message || "Could not raise the strike");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Could not raise the strike";
      toast.error(msg);
    } finally {
      setRaising(false);
    }
  };

  if (!caseKey) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
        <p className="text-bp-text-secondary">No case was selected</p>
        <button
          type="button"
          onClick={goBack}
          className="px-4 py-2 text-sm bg-bp-elevated hover:bg-bp-hover text-bp-text rounded-lg"
        >
          Back to cases
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-7 h-7 text-bp-cyan animate-spin" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
        <p className="text-bp-text-secondary">{error || "Case not found"}</p>
        <button
          type="button"
          onClick={() => goBack()}
          className="px-4 py-2 text-sm bg-bp-elevated hover:bg-bp-hover text-bp-text rounded-lg"
        >
          Back to cases
        </button>
      </div>
    );
  }

  const claimantName = caseData.claimant?.name || "—";
  const respondent = caseData.respondent;
  const respondentName = respondent?.name || "Unknown user";
  const claimedVideo = caseData.content?.video;
  const respondentChannel =
    claimedVideo?.channel?.name || respondent?.channels?.[0]?.name || "—";
  const originalVideo = caseData.claim?.originalWorkVideo;
  const isClosed = ["resolved", "withdrawn", "takedown_rejected"].includes(
    caseData.status,
  );
  const alreadyStruck = Boolean(caseData.strike);
  const timeline = buildTimeline(originalVideo, claimedVideo);
  const history = [...(caseData.statusHistory || [])].reverse();
  const notes = [...(caseData.notes || [])].reverse();
  const evidence = caseData.evidence || [];

  // The claimant's channel is not stored on the case; their name stands in.
  const claimantChannel =
    caseData.claimant?.organization || caseData.claimant?.name || "—";

  const canRaise = caseData.status === "under_review" && !alreadyStruck;

  return (
    <div className="space-y-6">
      
      <PageHeader
        title={caseData.caseNumber || "Untitled case"}
        subtitle={
          <>
            <span className="font-medium text-bp-text">Claim Review</span>
            <span className="mx-1.5 text-bp-text-muted">&middot;</span>
            Submitted {fmtDateTime(caseData.createdAt)}
            <span className="mx-1.5 text-bp-text-muted">&middot;</span>
            {caseData.source === "public_submission"
              ? "Creator submission"
              : "Raised by admin"}
          </>
        }
      >
        <button
          type="button"
          onClick={() => navigate("/copyright/cases")}
          className="inline-flex items-center gap-2 rounded-xl border border-bp-border bg-bp-elevated px-4 py-2.5 text-sm font-medium text-bp-text-secondary hover:bg-bp-hover hover:text-bp-text transition-colors"
        >
          <ChevronLeft size={16} />
          Back to cases
        </button>
        {(caseData.priority || "medium") !== "medium" && (
          <span
            className={`px-2.5 py-1 text-xs font-medium rounded-full border capitalize ${
              priorityBadgeColors[caseData.priority] || priorityBadgeColors.medium
            }`}
          >
            {caseData.priority} priority
          </span>
        )}
        <span
          className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
            statusColors[caseData.status] || statusColors.pending
          }`}
        >
          {statusLabels[caseData.status] || caseData.status}
        </span>
      </PageHeader>

      <section className="relative overflow-hidden rounded-2xl border border-red-500/25 bg-gradient-to-br from-red-500/10 via-bp-card to-bp-card p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-red-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10">
              <ShieldAlert size={21} className="text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-300">
                Copyright strike target
              </p>
              <h2 className="mt-1 break-words text-xl font-bold text-bp-text sm:text-2xl">
                {respondentChannel}
              </h2>
              <p className="mt-1 text-sm text-bp-text-secondary">
                Reported video channel
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[460px]">
            <div className="rounded-xl border border-bp-border/80 bg-bp-card/80 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-bp-text-muted">
                User name
              </p>
              <p className="mt-1 break-words text-sm font-semibold text-bp-text">
                {respondentName}
              </p>
            </div>
            <div className="rounded-xl border border-bp-border/80 bg-bp-card/80 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-bp-text-muted">
                Email
              </p>
              <p className="mt-1 break-all text-sm font-semibold text-bp-text">
                {respondent?.email || "—"}
              </p>
            </div>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-3 border-t border-bp-border/70 pt-4 sm:grid-cols-4">
          <Field label="Case reference" value={caseData.caseNumber} mono />
          <Field
            label="Claim type"
            value={(caseData.claim?.type || "—").replace(/_/g, " ")}
          />
          <Field label="Filed" value={fmtDateTime(caseData.createdAt)} />
          <Field
            label="Assigned to"
            value={caseData.assignedTo?.name || "Unassigned"}
          />
        </div>
      </section>

      {/* Already decided */}
      {alreadyStruck && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
          <CheckCircle2 size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-300">Strike already raised</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Strike status" value={caseData.strike?.status} />
              <Field
                label="Issued"
                value={fmtDateTime(caseData.strike?.createdAt)}
              />
              <Field
                label="Expires"
                value={fmtDateTime(caseData.strike?.expiresAt)}
              />
              <Field
                label="Issued by"
                value={caseData.strike?.issuedBy?.name}
              />
            </div>
            {caseData.strike?.reason && (
              <p className="text-[13px] text-bp-text-secondary mt-3">
                Reason: {caseData.strike.reason}
              </p>
            )}
            {caseData.strike?.dispute?.filed && (
              <div className="mt-3 rounded-lg border border-bp-border/70 bg-bp-card/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-bp-text">
                  Strike dispute
                </p>
                <p className="mt-1 text-[13px] text-bp-text-secondary">
                  {caseData.strike.dispute.reason || "No dispute reason provided."}
                </p>
                {caseData.strike.dispute.additionalInfo && (
                  <p className="mt-2 text-[13px] text-bp-text-secondary whitespace-pre-wrap">
                    {caseData.strike.dispute.additionalInfo}
                  </p>
                )}
                <p className="mt-2 text-xs text-bp-text-muted">
                  Filed {fmtDateTime(caseData.strike.dispute.filedAt)}
                  {caseData.strike.dispute.outcome
                    ? ` · Outcome: ${caseData.strike.dispute.outcome}`
                    : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {isClosed && !alreadyStruck && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-bp-border bg-bp-elevated">
          <Info size={18} className="text-bp-text-muted shrink-0 mt-0.5" />
          <p className="text-[13px] text-bp-text-secondary">
            This claim is closed
            {caseData.resolution?.decision
              ? ` as "${caseData.resolution.decision}"`
              : ""}
            . A strike cannot be raised on a closed claim.
          </p>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-bp-text">Video comparison</h2>
            <p className="text-sm text-bp-text-muted">
              Review the original work alongside the reported upload.
            </p>
          </div>
          {timeline.tone === "muted" && (
            <span className="text-xs text-bp-text-muted">
              Upload date comparison unavailable
            </span>
          )}
        </div>
      {/* Two columns: claimant vs accused */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <VideoPanel
          label="Original Video (Claimant)"
          video={originalVideo}
          username={claimantName}
          channelName={claimantChannel}
          emptyText={
            caseData.claim?.originalWorkUrl
              ? "No video attached. The claimant supplied a link instead."
              : "The claimant did not attach an original video."
          }
        />

        <VideoPanel
          label="Claimed Video (Accused)"
          video={claimedVideo}
          username={respondentName}
          channelName={respondentChannel}
          emptyText="The claimed video is no longer available."
        />
      </div>
      </section>

      {/* Upload ordering: the strongest single signal in an infringement claim */}
      {timeline.tone !== "muted" && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border ${
            timeline.tone === "good"
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-red-500/30 bg-red-500/10"
          }`}
        >
          {timeline.tone === "good" ? (
            <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p
              className={`text-sm font-medium ${
                timeline.tone === "good" ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {timeline.label}
            </p>
            <p className="text-[13px] text-bp-text-secondary mt-0.5">
              {timeline.detail}
            </p>
          </div>
        </div>
      )}

      {/* Parties: who is claiming and who is being accused */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-bp-card rounded-xl border border-bp-border p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2 border-b border-bp-border pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bp-cyan/10">
              <Scale size={17} className="text-bp-cyan" />
            </div>
            <div className="mr-auto">
              <h2 className="text-sm font-semibold text-bp-text">Claimant details</h2>
              <p className="text-xs text-bp-text-muted">Copyright owner or representative</p>
            </div>
            {caseData.claimant?.declaration ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                Declaration signed
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-bp-yellow/15 text-bp-yellow border-bp-yellow/30">
                No declaration
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <Field label="Name" value={caseData.claimant?.name} />
            <Field
              label="Stands as"
              value={relationshipLabels[caseData.claimant?.relationship]}
            />
            <Field label="Email" value={caseData.claimant?.email} />
            <Field label="Phone" value={caseData.claimant?.phone} />
            <Field label="Organization" value={caseData.claimant?.organization} />
            <Field label="Submitted" value={fmtDateTime(caseData.createdAt)} />
          </div>

          {caseData.claimant?.address && (
            <Field label="Address" value={caseData.claimant.address} />
          )}

          {caseData.claimant?.userId && (
            <p className="text-xs text-bp-text-muted">
              Claimant is a registered user — identity can be verified internally.
            </p>
          )}
        </div>

        <div className="bg-bp-card rounded-xl border border-bp-border p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-bp-border pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bp-orange/10">
              <ShieldAlert size={17} className="text-bp-orange" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-bp-text">
                Respondent account
              </h2>
              <p className="text-xs text-bp-text-muted">Uploader receiving the claim</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <Field label="Name" value={respondent?.name} />
            <Field label="Email" value={respondent?.email} />
            <Field label="Phone" value={respondent?.phone} />
            <Field label="User ID" value={respondent?._id} mono />
            <Field label="Member since" value={fmtDate(respondent?.createdAt)} />
          </div>

          {respondent?.channels?.length > 0 && (
            <Field
              label="Channels"
              value={respondent.channels.map((c) => c.name).filter(Boolean).join(", ")}
            />
          )}

          {typeof caseData.respondentStrikeCount === "number" && (
            <div
              className={`flex items-start gap-2 p-3 rounded-lg border ${
                caseData.respondentStrikeCount > 0
                  ? "border-red-500/30 bg-red-500/10"
                  : "border-bp-border bg-bp-elevated"
              }`}
            >
              <ShieldAlert
                size={14}
                className={
                  caseData.respondentStrikeCount > 0
                    ? "text-red-400 shrink-0 mt-0.5"
                    : "text-bp-text-muted shrink-0 mt-0.5"
                }
              />
              <p className="text-[13px] text-bp-text-secondary">
                {caseData.respondentStrikeCount > 0 ? (
                  <>
                    <span className="text-red-300 font-medium">
                      {caseData.respondentStrikeCount} prior copyright strike
                      {caseData.respondentStrikeCount === 1 ? "" : "s"}.
                    </span>{" "}
                    Treat this as a repeat infringement.
                  </>
                ) : (
                  "No copyright strikes on this account."
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Full claim description and original-work details. */}
      <div className="bg-bp-card rounded-xl border border-bp-border p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-bp-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bp-cyan/10">
            <FileText size={17} className="text-bp-cyan" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-bp-text">Claim details</h2>
            <p className="text-xs text-bp-text-muted">
              Submission, ownership information and original-work reference
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-xl bg-bp-elevated/50 p-4 sm:grid-cols-3">
          <Field
            label="Claim type"
            value={(caseData.claim?.type || "—").replace(/_/g, " ")}
          />
          <Field
            label="Source"
            value={
              caseData.source === "public_submission"
                ? "Creator submission"
                : "Admin created"
            }
          />
          <Field label="Submitted" value={fmtDateTime(caseData.createdAt)} />
        </div>

        <div>
          <p className="text-xs text-bp-text-muted mb-1.5">Claim description</p>
          <p className="text-sm text-bp-text-secondary whitespace-pre-wrap leading-relaxed">
            {caseData.claim?.description || "No description provided."}
          </p>
        </div>

{caseData.claim?.originalWork && (
          <div>
            <p className="text-xs text-bp-text-muted mb-1">
              Original work title
            </p>
            <p className="text-sm text-bp-text">{caseData.claim.originalWork}</p>
          </div>
        )}

        {caseData.content?.url && (
          <div>
            <p className="text-xs text-bp-text-muted mb-1">
              Reported video link
            </p>
            <a
              href={caseData.content.url}
              target="_blank"
              rel="noreferrer"
              title={caseData.content.url}
              className="inline-flex items-center gap-1.5 text-sm text-bp-cyan hover:underline break-all"
            >
              <Link2 size={13} className="shrink-0" />
              Open reported video link
            </a>
          </div>
        )}

        {caseData.claim?.originalWorkUrl && (
          <div>
            <p className="text-xs text-bp-text-muted mb-1">
              Original work link (claimant supplied)
            </p>
            {/* The raw URL is often a very long filename, so show an action
                instead and keep the address in the tooltip. */}
            <a
              href={caseData.claim.originalWorkUrl}
              target="_blank"
              rel="noreferrer"
              title={caseData.claim.originalWorkUrl}
              className="inline-flex items-center gap-1.5 text-sm text-bp-cyan hover:underline"
            >
              <Link2 size={13} className="shrink-0" />
              Open in New Tab
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <p className="text-xs text-bp-text-muted">Priority</p>
            <span
              className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize border ${
                priorityBadgeColors[caseData.priority] || priorityBadgeColors.medium
              }`}
            >
              {caseData.priority || "medium"}
            </span>
          </div>
          <div>
            <p className="text-xs text-bp-text-muted">Assigned to</p>
            <p className="text-bp-text mt-0.5">
              {caseData.assignedTo?.name || "Unassigned"}
            </p>
          </div>
        </div>
      </div>

      <section className="bg-bp-card rounded-xl border border-bp-border p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-bp-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
            <Link2 size={17} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-bp-text">
              Submitted evidence
            </h2>
            <p className="text-xs text-bp-text-muted">
              Files and references attached to this copyright claim
            </p>
          </div>
          <span className="ml-auto rounded-full bg-bp-elevated px-2.5 py-1 text-xs text-bp-text-secondary">
            {evidence.length}
          </span>
        </div>
        {evidence.length === 0 ? (
          <p className="py-2 text-sm text-bp-text-muted">
            No additional evidence was submitted.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {evidence.map((item) => (
              <article
                key={item._id}
                className="rounded-xl border border-bp-border bg-bp-elevated/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-semibold text-bp-text">
                      {item.title || item.type?.replace(/_/g, " ") || "Evidence"}
                    </h3>
                    <p className="mt-1 text-xs capitalize text-bp-text-muted">
                      {item.type?.replace(/_/g, " ") || "Other"}
                      {item.createdAt ? ` · ${fmtDateTime(item.createdAt)}` : ""}
                    </p>
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-bp-border px-3 py-2 text-xs font-medium text-bp-cyan hover:bg-bp-cyan/10"
                    >
                      Open <ExternalLink size={13} />
                    </a>
                  )}
                </div>
                {item.description && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-bp-text-secondary">
                    {item.description}
                  </p>
                )}
                {item.uploadedBy?.name && (
                  <p className="mt-3 text-xs text-bp-text-muted">
                    Added by {item.uploadedBy.name}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Internal notes and audit trail: what admins have written on this case
          and what already happened. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-bp-card rounded-xl border border-bp-border p-5 space-y-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-bp-cyan" />
            <h2 className="text-sm font-semibold text-bp-text">
              Internal notes ({notes.length})
            </h2>
          </div>

          {notes.length === 0 ? (
            <p className="text-[13px] text-bp-text-muted">
              No internal notes yet.
            </p>
          ) : (
            <div className="space-y-2">
              {notes.map((note) => (
                <div key={note._id} className="text-[13px]">
                  <p className="text-bp-text-secondary whitespace-pre-wrap">
                    {note.text}
                  </p>
                  <p className="text-[11px] text-bp-text-muted mt-0.5">
                    {note.author?.name || "Unknown"} · {fmtDateTime(note.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-bp-card rounded-xl border border-bp-border p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-bp-cyan" />
            <h2 className="text-sm font-semibold text-bp-text">Case history</h2>
          </div>

          {history.length === 0 ? (
            <p className="text-[13px] text-bp-text-muted">
              No status changes recorded yet.
            </p>
          ) : (
            <ol className="space-y-3">
              {history.map((entry, i) => (
                <li key={`${entry.timestamp}-${i}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="w-2 h-2 rounded-full bg-bp-cyan mt-1.5 shrink-0" />
                    {i < history.length - 1 && (
                      <span className="w-px flex-1 bg-bp-border mt-1" />
                    )}
                  </div>
                  <div className="pb-1 min-w-0">
                    <p className="text-[13px] text-bp-text">
                      {entry.from ? `${entry.from} → ` : ""}
                      <span className="capitalize">{entry.to}</span>
                    </p>
                    {entry.reason && (
                      <p className="text-[13px] text-bp-text-secondary">
                        {entry.reason}
                      </p>
                    )}
                    <p className="text-[11px] text-bp-text-muted mt-0.5">
                      {entry.changedBy?.name || "System"} ·{" "}
                      {fmtDateTime(entry.timestamp)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {caseData.resolution?.resolvedAt && (
            <div className="pt-3 border-t border-bp-border space-y-1">
              <p className="text-[11px] text-bp-text-muted uppercase tracking-wide">
                Resolution
              </p>
              <p className="text-[13px] text-bp-text capitalize">
                {caseData.resolution.decision || "—"}
              </p>
              {caseData.resolution.reason && (
                <p className="text-[13px] text-bp-text-secondary">
                  {caseData.resolution.reason}
                </p>
              )}
              <p className="text-[11px] text-bp-text-muted">
                {caseData.resolution.resolvedBy?.name || "System"} ·{" "}
                {fmtDateTime(caseData.resolution.resolvedAt)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Evidence note + action */}
      <div className="bg-bp-card rounded-xl border border-bp-border p-5 space-y-4">
        <div>
          <label
            htmlFor="evidence-note"
            className="block text-sm font-medium text-bp-text mb-1.5"
          >
            Evidence Note
          </label>
          <p className="text-xs text-bp-text-muted mb-2">
            Saved with the strike. The uploader sees this on their strike details
            page, so keep it clear and factual.
          </p>
          <textarea
            id="evidence-note"
            value={evidenceNote}
            onChange={(e) => setEvidenceNote(e.target.value)}
            disabled={!canRaise || raising}
            rows={4}
            maxLength={5000}
            placeholder="e.g. The claimant's original video was uploaded on 12 Jan, three months before the claimed video."
            className="w-full px-4 py-3 bg-bp-input border border-bp-border rounded-xl text-sm text-bp-text placeholder:text-bp-text-muted focus:outline-none focus:border-bp-cyan transition-colors resize-none disabled:opacity-50"
          />
        </div>

        {canRaise ? (
          <>
            {!confirmOpen ? (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <ShieldAlert size={18} />
                Raise Strike to {respondentName}
                {respondentChannel !== "—" ? ` – ${respondentChannel}` : ""}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
                  <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div className="text-[13px] text-bp-text-secondary">
                    <p className="font-medium text-bp-text">
                      This will immediately:
                    </p>
                    <ul className="mt-1.5 space-y-0.5 list-disc pl-4">
                      <li>Disable the claimed video for viewers</li>
                      <li>Issue a copyright strike to {respondentName}</li>
                      <li>Recalculate the details</li>
                      <li>Close this claim</li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={raiseStrike}
                    disabled={raising}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    {raising ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Raising...
                      </>
                    ) : (
                      <>
                        <FileText size={16} /> Yes, raise the strike
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    disabled={raising}
                    className="px-5 py-3 bg-bp-elevated hover:bg-bp-hover disabled:opacity-50 text-bp-text text-sm font-medium rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => navigate("/copyright/cases")}
            className="w-full px-5 py-3 bg-bp-elevated hover:bg-bp-hover text-bp-text text-sm font-medium rounded-xl transition-colors"
          >
            Back to cases
          </button>
        )}
      </div>
    </div>
  );
}

  const priorityOptions = ["low", "medium", "high", "urgent"];

  const formatCaseDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  export default function CopyrightCaseList() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [cases, setCases] = useState([]);
    const [pagination, setPagination] = useState({
      total: 0,
      page: 1,
      limit: PAGINATION_PER_PAGE,
      pages: 1,
    });
    const [page, setPage] = useState(
      Math.max(1, Number(searchParams.get("page")) || 1),
    );
    const [limit, setLimit] = useState(PAGINATION_PER_PAGE);
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [appliedSearch, setAppliedSearch] = useState(
      searchParams.get("search") || "",
    );
    const [status, setStatus] = useState(searchParams.get("status") || "");
    const [priority, setPriority] = useState(
      searchParams.get("priority") || "",
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadCases = useCallback(async () => {
      setLoading(true);
      setError("");
      try {
        const params = { page, limit };
        if (appliedSearch.trim()) params.search = appliedSearch.trim();
        if (status) params.status = status;
        if (priority) params.priority = priority;

        const response = await fetchCopyrightCases(params);
        setCases(response.data?.data || []);
        setPagination(
          response.data?.pagination || {
            total: 0,
            page: 1,
            limit,
            pages: 1,
          },
        );
      } catch (err) {
        console.error("Failed to load copyright cases:", err);
        setError(
          err.response?.data?.message || err.message || "Failed to load cases",
        );
        setCases([]);
      } finally {
        setLoading(false);
      }
    }, [appliedSearch, limit, page, priority, status]);

    useEffect(() => {
      loadCases();
    }, [loadCases]);

    useEffect(() => {
      const params = new URLSearchParams();
      if (page > 1) params.set("page", String(page));
      if (appliedSearch) params.set("search", appliedSearch);
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      setSearchParams(params, { replace: true });
    }, [appliedSearch, page, priority, setSearchParams, status]);

    const submitSearch = (event) => {
      event.preventDefault();
      setPage(1);
      setAppliedSearch(search);
    };

    const columns = [
      {
        name: "Case",
        minWidth: "130px",
        cell: (item) => (
          <span className="text-sm font-mono text-bp-text">
            {item.caseNumber || "—"}
          </span>
        ),
      },
      {
        name: "Claimant",
        minWidth: "180px",
        cell: (item) => (
          <div>
            <p className="text-sm text-bp-text">{item.claimant?.name || "—"}</p>
            <p className="text-xs text-bp-text-muted">
              {item.claimant?.organization || item.claimant?.email || ""}
            </p>
          </div>
        ),
      },
      {
        name: "Reported video",
        minWidth: "200px",
        grow: 1,
        cell: (item) => (
          <p className="text-sm text-bp-text truncate max-w-[240px]">
            {item.content?.title ||
              item.content?.video?.title ||
              "Untitled video"}
          </p>
        ),
      },
      {
        name: "Status",
        minWidth: "130px",
        cell: (item) => (
          <span
            className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-medium ${
              statusColors[item.status] ||
              "bg-bp-elevated text-bp-text-secondary border-bp-border"
            }`}
          >
            {statusLabels[item.status] || item.status || "Unknown"}
          </span>
        ),
      },
      {
        name: "Filed",
        width: "120px",
        cell: (item) => (
          <span className="text-sm text-bp-text-secondary">
            {formatCaseDate(item.createdAt)}
          </span>
        ),
      },
      {
        name: "Priority",
        width: "110px",
        cell: (item) => (
          <span
            className={`text-xs font-semibold capitalize ${
              priorityBadgeColors[item.priority] || priorityBadgeColors.medium
            }`}
          >
            {item.priority || "medium"}
          </span>
        ),
      },
      {
        name: "Details",
        width: "90px",
        right: true,
        ignoreRowClick: true,
        cell: (item) => (
          <button
            type="button"
            onClick={() => navigate(`/copyright/cases/${item._id}`)}
            aria-label={`View full details for ${item.caseNumber}`}
            title="View full details"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-bp-border text-bp-cyan hover:bg-bp-cyan/10 focus:outline-none focus:ring-2 focus:ring-bp-cyan/50"
          >
            <Eye size={17} />
          </button>
        ),
      },
    ];

    return (
      <div className="space-y-6">
        <PageHeader
          title="Copyright Cases"
          subtitle={`${pagination.total} total cases`}
        >
          {hasFeature("canCreateCopyrightCase") && (
            <button
              type="button"
              onClick={() => navigate("/copyright/cases/new")}
              className="inline-flex items-center gap-2 bg-bp-elevated border border-bp-border text-bp-text-secondary hover:text-bp-text hover:bg-bp-hover px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus size={16} />
              New Case
            </button>
          )}
        </PageHeader>

        <section className="bg-bp-card border border-bp-border rounded-2xl p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <form onSubmit={submitSearch} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bp-text-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search case number or claimant..."
                className="w-full pl-9 pr-24 py-2.5 bg-bp-input border border-bp-border rounded-xl text-sm text-bp-text placeholder:text-bp-text-muted focus:outline-none focus:border-bp-cyan"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-bp-blue text-white text-xs font-medium hover:opacity-90"
              >
                Search
              </button>
            </form>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by copyright status"
              className="px-3 py-2.5 bg-bp-input border border-bp-border rounded-xl text-sm text-bp-text"
            >
              <option value="">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by priority"
              className="px-3 py-2.5 bg-bp-input border border-bp-border rounded-xl text-sm text-bp-text"
            >
              <option value="">All priorities</option>
              {priorityOptions.map((value) => (
                <option key={value} value={value}>
                  {value[0].toUpperCase() + value.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="bg-bp-card border border-bp-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-bp-text-secondary">
              <Loader2 className="w-5 h-5 animate-spin text-bp-cyan" />
              Loading copyright cases...
            </div>
          ) : error ? (
            <div className="text-center py-12 space-y-3">
              <p role="alert" className="text-sm text-red-400">{error}</p>
              <button
                type="button"
                onClick={loadCases}
                className="px-4 py-2 rounded-lg bg-bp-elevated text-sm text-bp-text hover:bg-bp-hover"
              >
                Try again
              </button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={cases}
              customStyles={tableCustomStyles}
              progressPending={loading}
              progressComponent={
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-bp-cyan" />
                </div>
              }
              noDataComponent={
                <div className="text-center py-16">
                  <FileText className="w-10 h-10 text-bp-text-muted mx-auto mb-3" />
                  <p className="text-sm text-bp-text-secondary">
                    No copyright cases found.
                  </p>
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
              onRowClicked={(item) => navigate(`/copyright/cases/${item._id}`)}
            />
          )}
        </section>
      </div>
    );
  }
