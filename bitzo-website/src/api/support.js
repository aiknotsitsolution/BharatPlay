import { API_BASE } from "../config/api";

const getToken = () => localStorage.getItem("token");

const authHeaders = (extra = {}) => {
  const token = getToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const submitContactForm = async (formData) => {
  try {
    const res = await fetch(`${API_BASE}/support/contact`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("[API] Contact form error:", err);
    return { success: false, message: "Network error. Please try again." };
  }
};

export const submitDeletionRequest = async (formData) => {
  try {
    const res = await fetch(`${API_BASE}/support/deletion-request`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("[API] Deletion request error:", err);
    return { success: false, message: "Network error. Please try again." };
  }
};

export const getMyContactRequests = async (params = {}) => {
  const token = getToken();
  if (!token) return { success: false, message: "Unauthorized" };

  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/support/contact/mine?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err) {
    console.error("[API] Get my contact requests error:", err);
    return { success: false, message: "Network error." };
  }
};

export const getMyDeletionRequests = async (params = {}) => {
  const token = getToken();
  if (!token) return { success: false, message: "Unauthorized" };

  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/support/deletion-request/mine?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err) {
    console.error("[API] Get my deletion requests error:", err);
    return { success: false, message: "Network error." };
  }
};

export const getContactRequests = async (params = {}) => {
  const token = getToken();
  if (!token) return { success: false, message: "Unauthorized" };

  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/support/contact?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err) {
    console.error("[API] Get contact requests error:", err);
    return { success: false, message: "Network error." };
  }
};

export const updateContactStatus = async (id, updates) => {
  const token = getToken();
  if (!token) return { success: false, message: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/support/contact/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    return await res.json();
  } catch (err) {
    console.error("[API] Update contact status error:", err);
    return { success: false, message: "Network error." };
  }
};

export const getDeletionRequests = async (params = {}) => {
  const token = getToken();
  if (!token) return { success: false, message: "Unauthorized" };

  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/support/deletion-request?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err) {
    console.error("[API] Get deletion requests error:", err);
    return { success: false, message: "Network error." };
  }
};

export const updateDeletionStatus = async (id, updates) => {
  const token = getToken();
  if (!token) return { success: false, message: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/support/deletion-request/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    return await res.json();
  } catch (err) {
    console.error("[API] Update deletion status error:", err);
    return { success: false, message: "Network error." };
  }
};
