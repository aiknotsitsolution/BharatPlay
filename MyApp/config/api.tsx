import Constants from "expo-constants";

const getApiOrigin = () => {
  const fromEnv =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    Constants.expoConfig?.extra?.apiBaseUrl;

  if (fromEnv) {
    return String(fromEnv).replace(/\/+$/, "");
  }

  return "http://10.54.131.82:4000";
};

const API_ORIGIN = getApiOrigin();
const API_SOCKET_ORIGIN =
  process.env.EXPO_PUBLIC_SOCKET_BASE_URL ||
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
