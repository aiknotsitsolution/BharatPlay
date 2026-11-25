export const isShortVideo = (video) => {
  const rawTypes = video?.videoType ?? video?.raw?.videoType ?? [];
  const types = (Array.isArray(rawTypes) ? rawTypes : [rawTypes])
    .filter(Boolean)
    .map((type) => String(type).toLowerCase());

  return (
    Boolean(video?.isShort) ||
    types.some((type) => type === "short" || type === "shorts")
  );
};

export const filterChannelVideos = (videos, videoTypeFilter, searchQuery) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return videos.filter((video) => {
    const matchesType =
      videoTypeFilter === "all" ||
      (videoTypeFilter === "short"
        ? isShortVideo(video)
        : !isShortVideo(video));
    if (!matchesType || !normalizedQuery) return matchesType;

    const hashtags = Array.isArray(video.hashtags)
      ? video.hashtags
      : [video.hashtags];
    const searchableText = [
      video.title,
      video.name,
      video.description,
      video.category?.name,
      ...hashtags,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
};
