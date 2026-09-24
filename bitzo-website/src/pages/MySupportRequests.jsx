import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LifeBuoy,
  Clock,
  CheckCircle,
  XCircle,
  Ellipsis,
  MessageSquare,
  UserX,
  ArrowLeft,
  Loader2,
  Inbox,
  Reply,
  ShieldAlert,
  BadgeCheck,
} from "lucide-react";
import {
  getMyContactRequests,
  getMyDeletionRequests,
} from "../api/support";
import { formatTicketId } from "../utils/ticketId";

const contactStatusConfig = {
  pending: {
    color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    icon: Clock,
    label: "Pending",
  },
  "in-progress": {
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: Ellipsis,
    label: "In Progress",
  },
  resolved: {
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle,
    label: "Resolved",
  },
  closed: {
    color: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    icon: XCircle,
    label: "Closed",
  },
};

const deletionStatusConfig = {
  pending: {
    color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    icon: Clock,
    label: "Pending",
  },
  verified: {
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: BadgeCheck,
    label: "Verified",
  },
  processing: {
    color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    icon: Ellipsis,
    label: "Processing",
  },
  completed: {
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle,
    label: "Completed",
  },
  rejected: {
    color: "bg-red-500/15 text-red-400 border-red-500/30",
    icon: XCircle,
    label: "Rejected",
  },
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function RequestCard({ request, statusConfig, type }) {
  const status = statusConfig[request.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const reply = type === "contact" ? request.adminReply : request.adminNotes;
  const replyDate =
    type === "contact" ? request.repliedAt : request.processedAt;

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 md:p-5 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-zinc-800 shrink-0">
            <StatusIcon className="w-5 h-5 text-zinc-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${status.color}`}
              >
                {status.label}
              </span>
              <span className="text-xs text-zinc-500">
                {formatDate(request.createdAt)}
              </span>
              <span className="px-2 py-0.5 text-xs font-mono font-semibold text-red-400 bg-red-500/10 border border-red-500/30 rounded-md">
                {formatTicketId(request._id)}
              </span>
            </div>

            <p className="text-sm text-white font-medium mt-2">
              {type === "contact" ? request.subject : "Account deletion request"}
            </p>
            {type === "contact" ? (
              <>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-3">
                  {request.message}
                </p>
                <p className="text-xs text-zinc-500 mt-1.5">
                  <span className="capitalize">{request.inquiryType}</span>
                  {" · "}
                  {request.email}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-zinc-500 mt-1">
                  {request.email}
                  {request.accountIdentifier && (
                    <>
                      {" · "}
                      <span className="font-mono">{request.accountIdentifier}</span>
                    </>
                  )}
                </p>
                {request.reason && (
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                    {request.reason}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {reply ? (
        <div className="mt-4 rounded-lg bg-zinc-800/50 border border-zinc-700/60 p-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium mb-1.5">
            <Reply className="w-3.5 h-3.5" />
            {type === "contact" ? "Admin Reply" : "Admin Notes"}
            {replyDate && (
              <span className="text-zinc-600">{formatDate(replyDate)}</span>
            )}
          </div>
          <p className="text-sm text-zinc-200 whitespace-pre-wrap">{reply}</p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-zinc-600">
          No reply yet — our team will respond soon.
        </p>
      )}
    </div>
  );
}

function RequestsList({ type }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetcher =
      type === "contact" ? getMyContactRequests : getMyDeletionRequests;

    const run = async () => {
      const result = await fetcher();
      if (cancelled) return;
      if (result.success) {
        setRequests(result.requests || []);
        setError(null);
      } else {
        setRequests([]);
        setError(result.message || "Failed to load your requests");
      }
      setLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [type, refreshKey]);

  const retry = () => {
    setLoading(true);
    setError(null);
    setRefreshKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
          <p className="text-sm text-zinc-400">
            Loading your {type === "contact" ? "contact" : "deletion"} requests...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-red-500/50 mx-auto" />
          <p className="text-zinc-400 font-medium">{error}</p>
          <button
            onClick={retry}
            className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    const isContact = type === "contact";
    return (
      <div className="text-center py-20">
        <Inbox className="w-14 h-14 text-zinc-700 mx-auto mb-4" />
        <p className="text-lg font-medium text-zinc-300">
          No {isContact ? "contact" : "deletion"} requests found
        </p>
        <p className="text-sm text-zinc-500 mt-2 mb-6">
          {isContact
            ? "You haven't submitted any contact/support requests yet."
            : "You haven't submitted any account deletion requests yet."}
        </p>
        <Link
          to={isContact ? "/contact" : "/delete-account"}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {isContact ? (
            <MessageSquare className="w-4 h-4" />
          ) : (
            <UserX className="w-4 h-4" />
          )}
          {isContact ? "Contact Support" : "Request Deletion"}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <RequestCard
          key={request._id}
          request={request}
          type={type}
          statusConfig={type === "contact" ? contactStatusConfig : deletionStatusConfig}
        />
      ))}
    </div>
  );
}

export default function MySupportRequests() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("contact");

  const tabs = [
    { id: "contact", label: "Contact Requests", icon: MessageSquare },
    { id: "deletion", label: "Deletion Requests", icon: UserX },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(-1)}
          className="mt-1 p-2 rounded-lg border border-gray-700 bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            My Support Requests
          </h1>
          <p className="text-zinc-400 mt-1">
            Track the status and replies for the requests you've submitted
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-red-600 text-white"
                  : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <RequestsList type={activeTab} />
    </div>
  );
}