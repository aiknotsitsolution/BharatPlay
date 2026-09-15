// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   AlertTriangle,
//   Clock,
//   CheckCircle,
//   XCircle,
//   Send,
//   ArrowLeft,
//   ExternalLink,
//   Shield,
// } from "lucide-react";
// import { API_ORIGIN } from "../config/api";

// const getToken = () => localStorage.getItem("token");

// const statusColors = {
//   active: "bg-red-500/15 text-red-400 border-red-500/30",
//   expired: "bg-gray-500/15 text-gray-400 border-gray-500/30",
//   disputed: "bg-orange-500/15 text-orange-400 border-orange-500/30",
//   removed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
// };

// const statusIcons = {
//   active: AlertTriangle,
//   expired: Clock,
//   disputed: AlertTriangle,
//   removed: CheckCircle,
// };

// export default function CopyrightPage() {
//   const navigate = useNavigate();
//   const [strikes, setStrikes] = useState([]);
//   const [activeCount, setActiveCount] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const [disputeStrikeId, setDisputeStrikeId] = useState(null);
//   const [disputeReason, setDisputeReason] = useState("");
//   const [submitting, setSubmitting] = useState(false);

//   const fetchStrikes = async () => {
//     setLoading(true);
//     setError(null);
//     const token = getToken();
//     if (!token) {
//       setError("Please login to view your copyright strikes");
//       setLoading(false);
//       return;
//     }

//     try {
//       const res = await fetch(`${API_ORIGIN}/api/copyright/my-strikes`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();

//       if (data.success) {
//         setStrikes(data.data?.strikes || []);
//         setActiveCount(data.data?.activeCount || 0);
//       } else {
//         setError(data.message || "Failed to load strikes");
//       }
//     } catch (err) {
//       console.error("Failed to fetch strikes:", err);
//       setError("Failed to load copyright information");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchStrikes();
//   }, []);

//   const handleDispute = async (strikeId) => {
//     if (!disputeReason.trim()) return;
//     setSubmitting(true);

//     const token = getToken();
//     try {
//       const res = await fetch(`${API_ORIGIN}/api/copyright/counter-notification`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           strikeId,
//           reason: disputeReason,
//         }),
//       });

//       const data = await res.json();
//       if (data.success) {
//         setDisputeStrikeId(null);
//         setDisputeReason("");
//         fetchStrikes();
//       } else {
//         alert(data.message || "Failed to submit counter-notification");
//       }
//     } catch (err) {
//       console.error("Failed to submit dispute:", err);
//       alert("Failed to submit counter-notification");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const formatDate = (date) => {
//     if (!date) return "-";
//     return new Date(date).toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//     });
//   };

//   const formatExpiry = (date) => {
//     if (!date) return "-";
//     const d = new Date(date);
//     const now = new Date();
//     const diff = d - now;
//     if (diff <= 0) return "Expired";
//     const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
//     return `${days} days remaining`;
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-[60vh]">
//         <div className="flex flex-col items-center gap-3">
//           <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
//           <p className="text-sm text-zinc-400">Loading copyright information...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-[60vh]">
//         <div className="text-center space-y-3">
//           <AlertTriangle className="w-12 h-12 text-red-500/50 mx-auto" />
//           <p className="text-zinc-400 font-medium">{error}</p>
//           <button
//             onClick={fetchStrikes}
//             className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
//       {/* Header */}
//       <div className="flex items-start justify-between gap-4">
//         <div>
//           <h1 className="text-2xl md:text-3xl font-bold text-white">Copyright Center</h1>
//           <p className="text-zinc-400 mt-1">
//             View your copyright strikes and submit counter-notifications
//           </p>
//         </div>
//         <button
//           onClick={() => navigate("/copyright/claim")}
//           className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
//         >
//           <Shield size={16} />
//           File a Claim
//         </button>
//       </div>

//       {/* Active Strikes Warning */}
//       {activeCount > 0 && (
//         <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
//           <div className="flex items-center gap-3">
//             <AlertTriangle className="w-5 h-5 text-red-400" />
//             <div>
//               <p className="text-sm font-medium text-red-400">
//                 You have {activeCount} active copyright strike{activeCount > 1 ? "s" : ""}
//               </p>
//               <p className="text-xs text-zinc-400 mt-0.5">
//                 Active strikes may affect your account standing. You can file a counter-notification if you believe the strike was issued in error.
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Strikes List */}
//       {strikes.length === 0 ? (
//         <div className="text-center py-16">
//           <CheckCircle className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
//           <p className="text-xl font-medium text-zinc-300">No copyright strikes</p>
//           <p className="text-sm text-zinc-500 mt-2">
//             Your account is in good standing
//           </p>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {strikes.map((strike) => {
//             const StatusIcon = statusIcons[strike.status] || AlertTriangle;
//             const canDispute = strike.status === "active";

//             return (
//               <div
//                 key={strike._id}
//                 className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden"
//               >
//                 <div className="p-4 md:p-5">
//                   <div className="flex items-start justify-between gap-4">
//                     <div className="flex items-start gap-3">
//                       <div className={`p-2 rounded-lg ${
//                         strike.status === "active" ? "bg-red-500/15" :
//                         strike.status === "disputed" ? "bg-orange-500/15" :
//                         "bg-zinc-800"
//                       }`}>
//                         <StatusIcon className={`w-5 h-5 ${
//                           strike.status === "active" ? "text-red-400" :
//                           strike.status === "disputed" ? "text-orange-400" :
//                           "text-zinc-400"
//                         }`} />
//                       </div>
//                       <div>
//                         <div className="flex items-center gap-2 flex-wrap">
//                           <span
//                             className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${
//                               statusColors[strike.status] || "bg-gray-500/15 text-gray-400 border-gray-500/30"
//                             }`}
//                           >
//                             {strike.status?.charAt(0).toUpperCase() + strike.status?.slice(1)}
//                           </span>
//                           <span className="text-xs text-zinc-500">
//                             Issued {formatDate(strike.createdAt)}
//                           </span>
//                         </div>
//                         <p className="text-sm text-zinc-300 mt-2">
//                           {strike.content?.title || "Untitled content"}
//                         </p>
//                         {strike.reason && (
//                           <p className="text-xs text-zinc-500 mt-1">
//                             Reason: {strike.reason}
//                           </p>
//                         )}
//                         <p className="text-xs text-zinc-500 mt-1">
//                           Expires: {formatExpiry(strike.expiresAt)}
//                         </p>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Dispute Form */}
//                   {canDispute && disputeStrikeId === strike._id && (
//                     <div className="mt-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
//                       <h4 className="text-sm font-medium text-zinc-300 mb-3">
//                         Submit Counter-Notification
//                       </h4>
//                       <p className="text-xs text-zinc-500 mb-3">
//                         Explain why you believe this strike was issued in error. Provide any supporting evidence.
//                       </p>
//                       <textarea
//                         value={disputeReason}
//                         onChange={(e) => setDisputeReason(e.target.value)}
//                         placeholder="I believe this strike was issued in error because..."
//                         rows={4}
//                         className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
//                       />
//                       <div className="flex gap-3 mt-3">
//                         <button
//                           onClick={() => handleDispute(strike._id)}
//                           disabled={submitting || !disputeReason.trim()}
//                           className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
//                         >
//                           {submitting ? (
//                             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                           ) : (
//                             <Send size={14} />
//                           )}
//                           Submit Counter-Notification
//                         </button>
//                         <button
//                           onClick={() => { setDisputeStrikeId(null); setDisputeReason(""); }}
//                           className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
//                         >
//                           Cancel
//                         </button>
//                       </div>
//                     </div>
//                   )}

//                   {/* Dispute Status */}
//                   {strike.status === "disputed" && strike.dispute && (
//                     <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
//                       <p className="text-xs text-orange-400 font-medium">
//                         Counter-notification under review
//                       </p>
//                       <p className="text-xs text-zinc-500 mt-1">
//                         Filed on {formatDate(strike.dispute.filedAt)} — Our team will review your case.
//                       </p>
//                     </div>
//                   )}

//                   {/* Actions */}
//                   {canDispute && disputeStrikeId !== strike._id && (
//                     <div className="mt-3">
//                       <button
//                         onClick={() => { setDisputeStrikeId(strike._id); setDisputeReason(""); }}
//                         className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
//                       >
//                         <Send size={14} />
//                         File Counter-Notification
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  ArrowLeft,
  ExternalLink,
  Shield,
} from "lucide-react";
import { API_ORIGIN } from "../config/api";

const getToken = () => localStorage.getItem("token");

const statusColors = {
  active: "bg-red-500/15 text-red-400 border-red-500/30",
  expired: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  disputed: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  removed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const statusIcons = {
  active: AlertTriangle,
  expired: Clock,
  disputed: AlertTriangle,
  removed: CheckCircle,
};

export default function CopyrightPage() {
  const navigate = useNavigate();
  const [strikes, setStrikes] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [disputeStrikeId, setDisputeStrikeId] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchStrikes = async () => {
    setLoading(true);
    setError(null);
    const token = getToken();
    if (!token) {
      setError("Please login to view your copyright strikes");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_ORIGIN}/api/copyright/my-strikes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStrikes(data.data?.strikes || []);
        setActiveCount(data.data?.activeCount || 0);
      } else {
        setError(data.message || `Failed to load strikes (${res.status})`);
      }
    } catch (err) {
      console.error("Failed to fetch strikes:", err);
      setError("Failed to load copyright information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrikes();
  }, []);

  const handleDispute = async (strikeId) => {
    if (!disputeReason.trim()) return;
    setSubmitting(true);

    const token = getToken();
    try {
      const res = await fetch(
        `${API_ORIGIN}/api/copyright/counter-notification`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            strikeId,
            reason: disputeReason,
          }),
        },
      );

      const data = await res.json();
      if (data.success) {
        setDisputeStrikeId(null);
        setDisputeReason("");
        fetchStrikes();
      } else {
        alert(data.message || "Failed to submit counter-notification");
      }
    } catch (err) {
      console.error("Failed to submit dispute:", err);
      alert("Failed to submit counter-notification");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatExpiry = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    const now = new Date();
    const diff = d - now;
    if (diff <= 0) return "Expired";
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `${days} days remaining`;
  };

  // Helper to safely get video title (handles both populated & non-populated)
  const getVideoTitle = (strike) => {
    return (
      strike?.content?.video?.title ||
      strike?.content?.title ||
      "Untitled content"
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-zinc-400">
            Loading copyright information...
          </p>
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
            onClick={fetchStrikes}
            className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Copyright Center
          </h1>
          <p className="text-zinc-400 mt-1">
            View your copyright strikes and submit counter-notifications
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate("/copyright/my-claims")}
            className="flex items-center gap-2 px-4 py-2.5 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 text-sm font-medium rounded-xl transition-colors"
          >
            <ExternalLink size={16} />
            My Claims
          </button>
          <button
            onClick={() => navigate("/copyright/claim")}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Shield size={16} />
            File a Claim
          </button>
        </div>
      </div>

      {/* Active Strikes Warning */}
      {activeCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">
                You have {activeCount} active copyright strike
                {activeCount > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Active strikes may affect your account standing. You can file a
                counter-notification if you believe the strike was issued in
                error.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Strikes List */}
      {strikes.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
          <p className="text-xl font-medium text-zinc-300">
            No copyright strikes
          </p>
          <p className="text-sm text-zinc-500 mt-2">
            Your account is in good standing
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {strikes.map((strike) => {
            const StatusIcon = statusIcons[strike.status] || AlertTriangle;
            const canDispute = strike.status === "active";

            return (
              <div
                key={strike._id}
                className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden"
              >
                <div className="p-4 md:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          strike.status === "active"
                            ? "bg-red-500/15"
                            : strike.status === "disputed"
                              ? "bg-orange-500/15"
                              : "bg-zinc-800"
                        }`}
                      >
                        <StatusIcon
                          className={`w-5 h-5 ${
                            strike.status === "active"
                              ? "text-red-400"
                              : strike.status === "disputed"
                                ? "text-orange-400"
                                : "text-zinc-400"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${
                              statusColors[strike.status] ||
                              "bg-gray-500/15 text-gray-400 border-gray-500/30"
                            }`}
                          >
                            {strike.status?.charAt(0).toUpperCase() +
                              strike.status?.slice(1)}
                          </span>
                          <span className="text-xs text-zinc-500">
                            Issued {formatDate(strike.createdAt)}
                          </span>
                        </div>

                        {/* ✅ FIXED: Correct title path */}
                        <p className="text-sm text-zinc-300 mt-2">
                          {getVideoTitle(strike)}
                        </p>

                        {strike.reason && (
                          <p className="text-xs text-zinc-500 mt-1">
                            Reason: {strike.reason}
                          </p>
                        )}

                        <p className="text-xs text-zinc-500 mt-1">
                          Expires: {formatExpiry(strike.expiresAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dispute Form */}
                  {canDispute && disputeStrikeId === strike._id && (
                    <div className="mt-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                      <h4 className="text-sm font-medium text-zinc-300 mb-3">
                        Submit Counter-Notification
                      </h4>
                      <p className="text-xs text-zinc-500 mb-3">
                        Explain why you believe this strike was issued in error.
                        Provide any supporting evidence.
                      </p>
                      <textarea
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="I believe this strike was issued in error because..."
                        rows={4}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                      />
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleDispute(strike._id)}
                          disabled={submitting || !disputeReason.trim()}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
                        >
                          {submitting ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Send size={14} />
                          )}
                          Submit Counter-Notification
                        </button>
                        <button
                          onClick={() => {
                            setDisputeStrikeId(null);
                            setDisputeReason("");
                          }}
                          className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Dispute Status */}
                  {strike.status === "disputed" && strike.dispute && (
                    <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <p className="text-xs text-orange-400 font-medium">
                        Counter-notification under review
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Filed on {formatDate(strike.dispute.filedAt)} — Our team
                        will review your case.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {canDispute && disputeStrikeId !== strike._id && (
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          setDisputeStrikeId(strike._id);
                          setDisputeReason("");
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Send size={14} />
                        File Counter-Notification
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
