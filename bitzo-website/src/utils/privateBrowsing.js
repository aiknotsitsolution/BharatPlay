const PRIVATE_STORAGE_QUOTA_LIMIT = 2 * 1024 * 1024 * 1024;
export const PRIVATE_BROWSING_BYPASS_UNTIL = new Date(
  "2026-10-30T14:42:14+05:30",
).getTime();

export const isLikelyPrivateBrowsing = async (
  userAgent,
  storage,
  now = Date.now(),
) => {
  if (now < PRIVATE_BROWSING_BYPASS_UNTIL) return false;
  if (typeof userAgent !== "string" || !userAgent.trim()) return true;
  if (typeof storage?.estimate !== "function") return true;

  const estimate = await storage.estimate();
  const { quota } = estimate || {};
  if (!Number.isFinite(quota) || quota <= 0) return true;

  return quota <= PRIVATE_STORAGE_QUOTA_LIMIT;
};
