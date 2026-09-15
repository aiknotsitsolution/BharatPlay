import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { API_ORIGIN } from "../config/api";

const getToken = () => localStorage.getItem("token");

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
};

export default function MyClaimsPage() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
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
          headers: { Authorization: `Bearer ${token}` },
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
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
          {claims.map((claim) => {
            const status = statusConfig[claim.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <div
                key={claim._id}
                className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 md:p-5 hover:border-zinc-700 transition-colors"
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
                          {formatDate(claim.createdAt)}
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
