import { API_USERVIDEO } from "../../../config/api";
import { getAccessToken } from "../../../utils/session";

async function apiFetch(endpoint, options = {}) {
  const url = `${API_USERVIDEO}${endpoint}`;
  const token = getAccessToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      // Add Authorization if you use JWT / cookies
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    credentials: "include", // if using cookies/sessions
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const getChannel = (id) => apiFetch(`/channel/${id}`);

export const getMyChannels = () => apiFetch("/channel");

export const createChannel = (data) =>
  apiFetch("/createchannel", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const uploadVideo = (channelHandle, formData) =>
  fetch(`${API_USERVIDEO}/upload/${channelHandle}`, {
    method: "POST",
    body: formData, // ← no Content-Type header! (browser sets multipart)
    credentials: "include",
  }).then((res) => {
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  });
