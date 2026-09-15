import { API_BASE_URL } from "../api";

// Admin session helpers.
// Admin access token lives in localStorage (existing behavior).
// Admin refresh token lives ONLY in the httpOnly cookie set by the backend.

let refreshPromise = null;

export const getAdminToken = () => localStorage.getItem("adminToken");

export const setAdminToken = (token) => {
  localStorage.setItem("adminToken", token);
};

export const clearAdminState = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
  try {
    window.dispatchEvent(new Event("auth-change"));
  } catch (_) {
    // ignore
  }
};

// Single-flight refresh: concurrent callers share one request.
export const refreshAdminToken = async () => {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.token) {
        setAdminToken(data.token);
        if (data.user) {
          localStorage.setItem("adminUser", JSON.stringify(data.user));
        }
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

// Axios interceptor: attach the access token + auto-refresh once on 401.
export const setupAdminAxiosAuth = (axiosInstance) => {
  axiosInstance.interceptors.request.use((config) => {
    const token = getAdminToken();
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

      const newToken = await refreshAdminToken();
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(config);
      }

      clearAdminState();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
      return Promise.reject(error);
    }
  );
};
