const getDefaultApiOrigin = () => {
  if (
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    window.location.port === "5173" &&
    window.location.hostname
  ) {
    return `http://${window.location.hostname}:4000`;
  }

  return "http://192.168.1.20:5173/:4000";
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
