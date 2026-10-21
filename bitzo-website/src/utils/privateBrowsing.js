const PRIVATE_STORAGE_QUOTA_LIMIT = 2 * 1024 * 1024 * 1024;

export const isLikelyPrivateBrowsing = async (userAgent, storage) => {
  if (typeof userAgent !== "string" || !userAgent.trim()) return true;
  if (typeof storage?.estimate !== "function") return true;

  const estimate = await storage.estimate();
  const { quota } = estimate || {};
  if (!Number.isFinite(quota) || quota <= 0) return true;

  return quota <= PRIVATE_STORAGE_QUOTA_LIMIT;
};
