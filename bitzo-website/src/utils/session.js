import { API_ORIGIN } from "../config/api";

// Centralized session helpers for the user app.
// Access token lives in localStorage (existing behavior).
// Refresh token lives ONLY in the httpOnly cookie set by the backend.

let refreshPromise = null;

export const getAccessToken = () => localStorage.getItem("token");

export const setAccessToken = (token) => {
  localStorage.setItem("token", token);
};

export const clearAuthState = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  try {
    window.dispatchEvent(new Event("auth-change"));
  } catch (_) {
    // ignore
  }
};

// Single-flight refresh: concurrent callers share one request.
export const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_ORIGIN}/api/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.token) {
        setAccessToken(data.token);
        return data.token;
      }
      return null;
    } catch (_) {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
};

// fetch wrapper with Authorization header + one automatic refresh-on-401.
export const authFetch = async (url, options = {}) => {
  const token = getAccessToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const doRequest = (authHeaders) =>
    fetch(url, { ...options, credentials: "include", headers: authHeaders });

  let res = await doRequest(headers);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doRequest({ ...headers, Authorization: `Bearer ${newToken}` });
    } else {
      clearAuthState();
    }
  }

  return res;
};

// Axios interceptors: attach the access token and auto-refresh once on 401.
export const setupAxiosAuth = (axiosInstance) => {
  axiosInstance.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.withCredentials = true;
    return config;
  });

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { config, response } = error;
      if (!response || response.status !== 401 || !config || config._authRetried) {
        return Promise.reject(error);
      }
      config._authRetried = true;

      const newToken = await refreshAccessToken();
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(config);
      }

      clearAuthState();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
      return Promise.reject(error);
    }
  );
};
