const VIDEO_BATCH_SIZE = 100;

const fetchAllVideoPages = async ({
  apiBase,
  endpoint,
  label,
  category,
  token,
  fetchImpl = fetch,
}) => {
  const videos = [];
  let total = null;
  let page = 1;

  while (total === null || videos.length < total) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(VIDEO_BATCH_SIZE),
    });
    if (category) params.set("category", category);

    const response = await fetchImpl(
      `${apiBase}/${endpoint}?${params.toString()}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    if (!response.ok) {
      throw new Error(`Failed to load ${label} (${response.status})`);
    }

    const data = await response.json();
    if (data.success === false) {
      throw new Error(data.message || `Failed to load ${label}`);
    }

    const batch = Array.isArray(data.videos) ? data.videos : [];
    if (page > 1 && batch.length === 0 && videos.length < total) {
      throw new Error(`${label} ended before all pages were loaded.`);
    }
    videos.push(...batch);

    const reportedTotal = Number(data.total);
    if (Number.isFinite(reportedTotal) && reportedTotal >= 0) {
      total = reportedTotal;
    } else if (batch.length < VIDEO_BATCH_SIZE) {
      total = videos.length;
    }

    if (
      batch.length === 0 ||
      (total === null && batch.length < VIDEO_BATCH_SIZE) ||
      (total !== null && videos.length >= total)
    ) {
      break;
    }
    page += 1;
  }

  return videos;
};

export const fetchAllRecommendedVideos = (options) =>
  fetchAllVideoPages({
    ...options,
    endpoint: "recommended",
    label: "recommended videos",
  });

export const fetchAllShortsVideos = (options) =>
  fetchAllVideoPages({
    ...options,
    endpoint: "trending-shorts",
    label: "trending Shorts",
  });
