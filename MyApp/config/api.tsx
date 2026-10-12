import Constants from "expo-constants";

const normalizeOrigin = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";

const getExpoDevelopmentHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri;
  if (!hostUri) return "";

  const authority = hostUri
    .replace(/^[a-z][a-z\d+.-]*:\/\//i, "")
    .split(/[/?#]/, 1)[0];
  const host = authority.startsWith("[")
    ? authority.slice(1, authority.indexOf("]"))
    : authority.split(":", 1)[0];

  return host && !["localhost", "127.0.0.1", "0.0.0.0"].includes(host)
    ? host
    : "";
};

const getApiOrigin = () => {
  const fromConfig = normalizeOrigin(Constants.expoConfig?.extra?.apiBaseUrl);

  if (fromConfig) return fromConfig;

  if (__DEV__) {
    const devHost = getExpoDevelopmentHost();
    if (devHost) return `http://${devHost}:4000`;
  }

  const fromEnv = normalizeOrigin(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (fromEnv) return fromEnv;

  throw new Error(
    "API URL is not configured. Set EXPO_PUBLIC_API_BASE_URL to the reachable API origin.",
  );
};

const API_ORIGIN = getApiOrigin();
const API_SOCKET_ORIGIN =
  normalizeOrigin(Constants.expoConfig?.extra?.apiSocketBaseUrl) ||
  normalizeOrigin(process.env.EXPO_PUBLIC_SOCKET_BASE_URL) ||
  API_ORIGIN.replace(/:\d+$/, ":4003");
const API_BASE = `${API_ORIGIN}/api`;
const API_USERVIDEO = `${API_ORIGIN}/api/uservideo`;

// Sent with every request the app makes so the backend (auth-service) can
// tag any account created from this call as `platform: "app"`. The admin
// panel then uses this to show/filter "Website" vs "App" signups.
// Spread this into a fetch()'s headers object, e.g.:
//   headers: { "Content-Type": "application/json", ...API_PLATFORM_HEADER }
const API_PLATFORM_HEADER = { "X-Client-Platform": "app" };

export {
  API_ORIGIN,
  API_SOCKET_ORIGIN,
  API_BASE,
  API_USERVIDEO,
  API_PLATFORM_HEADER,
};
