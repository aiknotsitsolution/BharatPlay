import { API_BASE } from "../../../config/api";

async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

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

export const getChannel = (handle) => apiFetch(`/channels/${handle}`);

export const getMyChannels = () => apiFetch(`/users/me/channels`); // ← returns list of channels owned by current user

export const createChannel = (data) =>
  apiFetch("/channels", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const uploadVideo = (channelHandle, formData) =>
  fetch(`${API_BASE}/channels/${channelHandle}/videos`, {
    method: "POST",
    body: formData, // ← no Content-Type header! (browser sets multipart)
    credentials: "include",
  }).then((res) => {
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  });
