import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CheckCheck, Trash2, Loader2, Bell } from "lucide-react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
} from "../../features/notifications/notificationsSlice";
import { API_ORIGIN as BACKEND_URL } from "../../config/api";

const resolveUrl = (url) =>
  url
    ? url.startsWith("http")
      ? url.replace(/\\/g, "/")
      : `${BACKEND_URL}/${url.replace(/\\/g, "/")}`
    : null;

const getNotificationText = (notification) => {
  const actorName = notification.actor?.name || "System";
  const videoTitle = notification.video?.title || "your video";

  switch (notification.type) {
    case "subscribe":
      return `${actorName} subscribed to your channel`;
    case "like":
      return `${actorName} liked your video "${videoTitle}"`;
    case "comment":
      return `${actorName} commented on your video "${videoTitle}"`;
    case "upload":
      return `${actorName} uploaded a new video "${videoTitle}"`;
    case "copyright_takedown_approved":
      return `Your video "${videoTitle}" has been removed due to a copyright takedown`;
    case "copyright_takedown_rejected":
      return `A copyright takedown request on "${videoTitle}" was rejected`;
    case "copyright_dispute_filed":
      return `A dispute has been filed for the copyright claim on "${videoTitle}"`;
    case "copyright_dispute_resolved":
      return `Your copyright dispute for "${videoTitle}" has been resolved`;
    case "copyright_case_resolved":
      return `A copyright case involving "${videoTitle}" has been resolved`;
    case "copyright_case_created":
      return `A new copyright claim has been filed on "${videoTitle}"`;
    default:
      return "You have a new notification";
  }
};

const getNotificationTarget = (notification) => {
  if (notification.type === "subscribe") {
    const channelId = notification.channel?._id || notification.channel;
    return channelId ? `/channel/${channelId}` : null;
  }
  if (notification.type?.startsWith("copyright_")) {
    return "/copyright";
  }
  const videoId = notification.video?._id || notification.video;
  return videoId ? `/video/${videoId}` : null;
};

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

export default function NotificationPanel({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading } = useSelector(
    (state) => state.notifications,
  );

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotifications());
    }
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const handleItemClick = (notification) => {
    if (!notification.isRead) {
      dispatch(markNotificationRead(notification._id));
    }
    onClose();
    const target = getNotificationTarget(notification);
    if (target) navigate(target);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    dispatch(deleteNotification(id));
  };

  const handleMarkAll = () => {
    if (unreadCount > 0) {
      dispatch(markAllNotificationsRead());
    }
  };

  return (
    <div className="absolute right-0 mt-3 w-[min(20rem,calc(100vw-2rem))] max-h-[calc(100dvh-5rem)] overflow-y-auto overflow-x-hidden scroll-smooth bg-[#0f0f0f] border border-gray-700 rounded-xl shadow-2xl z-50 text-white">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#0f0f0f]">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-gray-300" />
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-600 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            <CheckCheck size={15} />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="px-4 py-10 text-center text-gray-500 text-sm">
          <Bell size={28} className="mx-auto mb-2 text-gray-600" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="py-1">
          {notifications.map((notification) => {
            const avatarUrl = resolveUrl(notification.actor?.avatar);
            const actorName = notification.actor?.name || "Someone";
            return (
              <div
                key={notification._id}
                onClick={() => handleItemClick(notification)}
                className={`w-full px-4 py-3 text-left flex items-start gap-3 transition cursor-pointer ${
                  notification.isRead
                    ? "hover:bg-[#272727]"
                    : "bg-[#1a1a1a] hover:bg-[#2a2a2a]"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-sm font-semibold mt-0.5">
                  {actorName.charAt(0).toUpperCase()}
                  {avatarUrl && (
                    <img
                      src={avatarUrl}
                      alt={actorName}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">
                    {getNotificationText(notification)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(notification.createdAt)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {!notification.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  )}
                  <button
                    onClick={(e) => handleDelete(e, notification._id)}
                    className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors"
                    aria-label="Delete notification"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
