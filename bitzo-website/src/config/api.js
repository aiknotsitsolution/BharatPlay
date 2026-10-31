const getDefaultApiOrigin = () => {
  if (typeof window === "undefined") return "";

  if (import.meta.env.DEV && window.location.port === "5173") {
    return `http://${window.location.hostname}:4000`;
  }

  return window.location.origin;
};

const API_ORIGIN = String(
  import.meta.env.VITE_API_BASE_URL || getDefaultApiOrigin(),
).replace(/\/+$/, "");

const API_BASE = `${API_ORIGIN}/api`;
const API_USERVIDEO = `${API_ORIGIN}/api/uservideo`;
const AUTH_API = {
  register: `${API_BASE}/register`,
  login: `${API_BASE}/login`,
  mapPhone: `${API_BASE}/phone/map`,
  claimDevice: `${API_BASE}/claim-device`,
  google: `${API_BASE}/auth/google`,
  legacyMigration: `${API_BASE}/phone-auth/migrate`,
  verifyLegacyMigration: `${API_BASE}/phone-auth/migrate/verify`,
};

export { API_ORIGIN, API_BASE, API_USERVIDEO, AUTH_API };
