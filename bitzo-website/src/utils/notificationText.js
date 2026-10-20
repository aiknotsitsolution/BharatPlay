export const getNotificationText = (notification) => {
  const actorName = notification.actor?.name || "Someone";
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
    case "copyright_takedown_received":
      return `A copyright takedown request has been filed for "${videoTitle}"`;
    case "copyright_strike_received":
      return `Your video "${videoTitle}" has received a copyright strike`;
    case "copyright_dispute_filed":
      return `A dispute has been filed for the copyright claim on "${videoTitle}"`;
    case "copyright_dispute_resolved":
      return `Your copyright dispute for "${videoTitle}" has been resolved`;
    case "copyright_case_assigned":
      return `The copyright case involving "${videoTitle}" has been assigned for review`;
    case "copyright_case_resolved":
      return `A copyright case involving "${videoTitle}" has been resolved`;
    case "copyright_case_created":
      return `A new copyright claim has been filed on "${videoTitle}"`;
    case "support_reply":
      return "The support team replied to your request";
    case "support_status":
      return "Your support request status has been updated";
    default:
      return "You have a new notification";
  }
};
