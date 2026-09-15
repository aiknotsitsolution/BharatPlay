import { API_ORIGIN } from "../config/api";

/**
 * Resolves a media/thumbnail path to a full URL.
 * - Absolute http(s) URLs are returned as-is (backslashes normalized).
 * - Relative paths (uploads/..., /uploads/...) are prefixed with the backend origin.
 * - Empty/null values return an empty string.
 */
export const resolveMediaUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value.replace(/\\/g, "/");

  const normalized = value.replace(/\\/g, "/");
  if (normalized.startsWith("/uploads/")) return `${API_ORIGIN}${normalized}`;
  if (normalized.startsWith("uploads/")) return `${API_ORIGIN}/${normalized}`;
  if (normalized.includes("uploads/"))
    return `${API_ORIGIN}/${normalized.split("uploads/").pop()}`;
  return `${API_ORIGIN}/${normalized}`;
};
