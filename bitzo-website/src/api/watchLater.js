import { toast } from "react-toastify";
import { API_BASE } from "../features/videos/videosSlice";

const getToken = () => localStorage.getItem("token");

const getVideoId = (video) => {
  if (video == null) return "";
  if (typeof video === "object") return video.id || video._id || "";
  return video;
};

export const addToWatchLater = async (video) => {
  const videoId = getVideoId(video);
  const token = getToken();
  if (!token) {
    toast.error("Please login first");
    return { success: false };
  }

  try {
    const res = await fetch(`${API_BASE}/watch-later/${videoId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "Added to Watch Later");
    } else {
      toast.error(data.message || "Failed to add");
    }
    return data;
  } catch (err) {
    console.error("Add to Watch Later error:", err);
    toast.error("Something went wrong");
    return { success: false };
  }
};

export const removeFromWatchLater = async (video) => {
  const videoId = getVideoId(video);
  const token = getToken();
  if (!token) {
    toast.error("Please login first");
    return { success: false };
  }

  try {
    const res = await fetch(`${API_BASE}/watch-later/${videoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "Removed from Watch Later");
    } else {
      toast.error(data.message || "Failed to remove");
    }
    return data;
  } catch (err) {
    console.error("Remove from Watch Later error:", err);
    toast.error("Something went wrong");
    return { success: false };
  }
};
