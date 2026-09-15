import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  User,
  FileText,
  Calendar,
  Scale,
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchCopyrightStrikeById } from "../../../api";

const statusColors = {
  active: "bg-red-500/15 text-red-400 border-red-500/30",
  expired: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  disputed: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  removed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const statusIcons = {
  active: AlertTriangle,
  expired: Clock,
  disputed: Scale,
  removed: CheckCircle,
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2.5">
    <Icon className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-sm text-gray-200 mt-0.5 break-words">{value || "-"}</p>
    </div>
  </div>
);

export default function CopyrightStrikeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [strike, setStrike] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStrike = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCopyrightStrikeById(id);
      setStrike(res.data?.data || null);
    } catch (err) {
      console.error("Failed to fetch strike:", err);
      setError("Failed to load strike details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrike();
  }, [id]);

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

  const formatExpiry = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    const now = new Date();
    const diff = d - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return `Expired ${Math.abs(days)} days ago`;
    if (days === 0) return "Expires today";
    return `Expires in ${days} days (${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading strike details...</p>
        </div>
      </div>
    );
  }

  if (error || !strike) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-red-400 font-medium">{error || "Strike not found"}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcons[strike.status] || AlertTriangle;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white">Strike Detail</h1>
          <p className="text-gray-400 mt-0.5 truncate">
            {strike.content?.title || strike._id}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full border ${
            statusColors[strike.status] || statusColors.active
          }`}
        >
          <StatusIcon className="w-4 h-4" />
          {strike.status?.charAt(0).toUpperCase() + strike.status?.slice(1)}
        </span>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Strike Info */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-indigo-400" />
              Strike Information
            </h2>
            <div className="divide-y divide-gray-800">
              <InfoRow
                icon={FileText}
                label="Strike ID"
                value={strike._id}
              />
              <InfoRow
                icon={Shield}
                label="Reason"
                value={strike.reason}
              />
              <InfoRow
                icon={Clock}
                label="Status"
                value={strike.status?.charAt(0).toUpperCase() + strike.status?.slice(1)}
              />
              <InfoRow
                icon={Calendar}
                label="Issued"
                value={formatDate(strike.createdAt)}
              />
              <InfoRow
                icon={Calendar}
                label="Expiry"
                value={formatExpiry(strike.expiresAt)}
              />
              <InfoRow
                icon={User}
                label="Issued By"
                value={strike.issuedBy
                  ? `${strike.issuedBy.name || "Admin"} (${strike.issuedBy.email || ""})`
                  : "System"}
              />
              {strike.resolvedBy && (
                <InfoRow
                  icon={User}
                  label="Resolved By"
                  value={`${strike.resolvedBy.name || "Admin"} (${strike.resolvedBy.email || ""})`}
                />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Struck Content</h2>
            <div className="divide-y divide-gray-800">
              <InfoRow
                icon={FileText}
                label="Video Title"
                value={strike.content?.title || "Untitled"}
              />
              {strike.content?.video && (
                <InfoRow
                  icon={FileText}
                  label="Video ID"
                  value={typeof strike.content.video === "object" ? strike.content.video._id : strike.content.video}
                />
              )}
              {strike.content?.video?.videoUrl && (
                <InfoRow
                  icon={FileText}
                  label="Video URL"
                  value={strike.content.video.videoUrl}
                />
              )}
              {strike.content?.video?.thumbnail && (
                <div className="py-3">
                  <p className="text-xs text-gray-500 font-medium mb-2">Thumbnail</p>
                  <img
                    src={strike.content.video.thumbnail}
                    alt="Video thumbnail"
                    className="w-48 h-28 object-cover rounded-lg border border-gray-700"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Linked Case */}
          {strike.case && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Linked Case</h2>
              <div
                onClick={() => navigate(`/copyright/cases/${strike.case._id || strike.case}`)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-800/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-200">
                      {strike.case?.caseNumber || "Case"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {strike.case?.status?.replace(/_/g, " ") || "View case"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Dispute + History */}
        <div className="space-y-6">
          {/* Dispute Details */}
          {strike.dispute?.filed && (
            <div className="bg-gray-900 rounded-2xl border border-orange-500/20 p-6">
              <h2 className="text-lg font-semibold text-orange-400 flex items-center gap-2 mb-4">
                <Scale className="w-5 h-5" />
                Dispute Details
              </h2>
              <div className="divide-y divide-gray-800">
                <InfoRow icon={Clock} label="Filed At" value={formatDate(strike.dispute.filedAt)} />
                <InfoRow icon={FileText} label="Reason" value={strike.dispute.reason} />
                {strike.dispute.additionalInfo && (
                  <InfoRow icon={FileText} label="Additional Info" value={strike.dispute.additionalInfo} />
                )}
                {strike.dispute.outcome && (
                  <>
                    <InfoRow
                      icon={strike.dispute.outcome === "upheld" ? XCircle : CheckCircle}
                      label="Outcome"
                      value={strike.dispute.outcome.charAt(0).toUpperCase() + strike.dispute.outcome.slice(1)}
                    />
                    <InfoRow icon={Calendar} label="Resolved At" value={formatDate(strike.dispute.resolvedAt)} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Status History */}
          {strike.statusHistory?.length > 0 && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Status History</h2>
              <div className="space-y-3">
                {strike.statusHistory.map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5" />
                      {idx < strike.statusHistory.length - 1 && (
                        <div className="w-px h-full bg-gray-700 mt-1" />
                      )}
                    </div>
                    <div className="pb-3 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.from && (
                          <span className="text-gray-400">{entry.from.replace(/_/g, " ")}</span>
                        )}
                        {entry.from && (
                          <span className="text-gray-600">→</span>
                        )}
                        <span className="text-gray-200 font-medium">{entry.to.replace(/_/g, " ")}</span>
                      </div>
                      {entry.reason && (
                        <p className="text-gray-500 mt-0.5 text-xs">{entry.reason}</p>
                      )}
                      <p className="text-gray-600 text-xs mt-0.5">{formatDate(entry.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Info */}
          {strike.user && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">User</h2>
              <div
                onClick={() => navigate(`/users/${strike.user._id || strike.user}`)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/70 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                  {strike.user.channelImage ? (
                    <img
                      src={strike.user.channelImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-200 truncate">
                    {strike.user.name || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {strike.user.email || ""}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
