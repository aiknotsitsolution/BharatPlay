import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import videosReducer, {
  fetchHomeVideos,
  fetchNextHomeSection,
  fetchShortsFeed,
  prioritizeCategoryChannels,
  rankShortsByEngagement,
  shuffleAfterPinnedItems,
} from "./videosSlice";

describe("Shorts feed pagination", () => {
  let store;

  beforeEach(() => {
    localStorage.clear();
    store = configureStore({
      reducer: { videos: videosReducer },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("keeps pinned items in place and shuffles the rest", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const items = ["top-1", "top-2", "top-3", "other-1", "other-2"];

    expect(shuffleAfterPinnedItems(items, 3)).toEqual([
      "top-1",
      "top-2",
      "top-3",
      "other-2",
      "other-1",
    ]);
    expect(items).toEqual([
      "top-1",
      "top-2",
      "top-3",
      "other-1",
      "other-2",
    ]);
  });

  it("puts matching channel categories first and shuffles both groups", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const videos = [
      { id: "other-1", channel: { category: "category-b" } },
      { id: "match-1", channel: { category: { _id: "category-a" } } },
      { id: "other-2", channel: { category: "category-c" } },
      { id: "match-2", channel: { category: "category-a" } },
    ];

    expect(
      prioritizeCategoryChannels(videos, { _id: "category-a" }).map(
        (video) => video.id,
      ),
    ).toEqual(["match-2", "match-1", "other-2", "other-1"]);
    expect(prioritizeCategoryChannels(videos, null)).toHaveLength(4);
  });

  it("prioritizes selected-category channels in the Home Recommended section", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const recommendedUrls = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        const parsedUrl = new URL(url);
        const section = parsedUrl.pathname.split("/").pop();
        if (section === "recommended") {
          recommendedUrls.push(parsedUrl);
          return {
            ok: true,
            json: async () => ({
              success: true,
              total: 4,
              videos: [
                { _id: "other-1", channel: { category: "category-b" } },
                {
                  _id: "match-1",
                  channel: { category: { _id: "category-a" } },
                },
                { _id: "other-2", channel: { category: "category-c" } },
                { _id: "match-2", channel: { category: "category-a" } },
              ],
            }),
          };
        }

        return {
          ok: true,
          json: async () => ({ success: true, total: 0, videos: [] }),
        };
      }),
    );

    await store
      .dispatch(fetchHomeVideos({ category: "category-a", limit: 5 }))
      .unwrap();

    expect(store.getState().videos.recommended.map((video) => video.id)).toEqual(
      ["match-2", "match-1", "other-2", "other-1"],
    );
    expect(recommendedUrls).toHaveLength(1);
    expect(recommendedUrls[0].searchParams.has("category")).toBe(false);
  });

  it("keeps only the top two Shorts fixed and shuffles all the rest", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        const section = new URL(url).pathname.split("/").pop();
        return {
          ok: true,
          json: async () => ({
            total: section === "trending-shorts" ? 7 : 5,
            videos:
              section === "trending-shorts"
                ? Array.from({ length: 7 }, (_, index) => ({
                    _id: `short-${index + 1}`,
                    views: index + 1,
                    likesCount: index + 1,
                    comments: Array(index + 1).fill({}),
                  }))
                : Array.from({ length: 5 }, (_, index) => ({
                    _id: `${section}-${index + 1}`,
                  })),
          }),
        };
      }),
    );

    await store.dispatch(fetchHomeVideos({ limit: 5 })).unwrap();
    const { recommended, trending, shorts } = store.getState().videos;

    expect(recommended.map((item) => item.id)).not.toEqual([
      "recommended-1",
      "recommended-2",
      "recommended-3",
      "recommended-4",
      "recommended-5",
    ]);
    expect(trending.map((item) => item.id)).toEqual([
      "trending-1",
      "trending-2",
      "trending-4",
      "trending-5",
      "trending-3",
    ]);
    expect(shorts.slice(0, 2).map((item) => item.id)).toEqual([
      "short-7",
      "short-6",
    ]);
    expect(shorts.slice(2).map((item) => item.id)).toEqual([
      "short-4",
      "short-3",
      "short-2",
      "short-1",
      "short-5",
    ]);
  });

  it("ranks Shorts by balanced views, likes, and comments performance", () => {
    const shorts = [
      { id: "views-heavy", views: 1000, likes: 1, comments: 1 },
      { id: "balanced", views: 500, likes: 100, comments: 100 },
      { id: "likes-heavy", views: 1, likes: 1000, comments: 1 },
      { id: "comments-heavy", views: 1, likes: 1, comments: 1000 },
    ];

    expect(rankShortsByEngagement(shorts).map((short) => short.id)).toEqual([
      "balanced",
      "views-heavy",
      "likes-heavy",
      "comments-heavy",
    ]);
  });

  it("loads and shuffles the full Recommended list for Home", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const recommendedPages = [];
    const trendingPages = [];
    const latestPages = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        const parsedUrl = new URL(url);
        const section = parsedUrl.pathname.split("/").pop();
        const page = Number(parsedUrl.searchParams.get("page"));
        const limit = Number(parsedUrl.searchParams.get("limit"));
        if (section === "trending-shorts") {
          const start = (page - 1) * limit;
          const count = Math.min(limit, 235 - start);
          return {
            ok: true,
            json: async () => ({
              success: true,
              total: 235,
              videos: Array.from({ length: count }, (_, index) => ({
                _id: `short-${start + index + 1}`,
                views: start + index + 1,
                likesCount: start + index + 1,
                comments: start + index + 1,
              })),
            }),
          };
        }

        if (section === "trending") {
          trendingPages.push({ page, limit });
          const start = (page - 1) * limit;
          const count = Math.min(limit, 235 - start);
          return {
            ok: true,
            json: async () => ({
              success: true,
              total: 235,
              videos: Array.from({ length: count }, (_, index) => ({
                _id: `trending-${start + index + 1}`,
                views: start + index + 1,
              })),
            }),
          };
        }

        if (section === "latest") {
          latestPages.push({ page, limit });
          const start = (page - 1) * limit;
          const count = Math.min(limit, 235 - start);
          return {
            ok: true,
            json: async () => ({
              success: true,
              total: 235,
              videos: Array.from({ length: count }, (_, index) => ({
                _id: `latest-${235 - start - index}`,
                createdAt: new Date(
                  Date.UTC(2026, 0, 1) + (234 - start - index) * 1000,
                ).toISOString(),
              })),
            }),
          };
        }

        if (section === "recommended") {
          recommendedPages.push({ page, limit });
          const start = (page - 1) * limit;
          const count = Math.min(limit, 235 - start);
          return {
            ok: true,
            json: async () => ({
              success: true,
              total: 235,
              videos: Array.from({ length: count }, (_, index) => ({
                _id: `recommended-${start + index + 1}`,
              })),
            }),
          };
        }

        return {
          ok: true,
          json: async () => ({ success: true, total: 0, videos: [] }),
        };
      }),
    );

    await store.dispatch(fetchHomeVideos({ limit: 5 })).unwrap();

    const { recommended, trending, latest, shorts, sectionHasMore } =
      store.getState().videos;
    expect(recommended).toHaveLength(235);
    expect(new Set(recommended.map((video) => video.id)).size).toBe(235);
    expect(recommended.map((video) => video.id)).not.toEqual(
      Array.from({ length: 235 }, (_, index) => `recommended-${index + 1}`),
    );
    expect(recommendedPages).toEqual([
      { page: 1, limit: 100 },
      { page: 2, limit: 100 },
      { page: 3, limit: 100 },
    ]);
    expect(trending).toHaveLength(235);
    expect(trending.slice(0, 2).map((video) => video.id)).toEqual([
      "trending-235",
      "trending-234",
    ]);
    expect(trending.slice(2).map((video) => video.id)).not.toEqual(
      Array.from({ length: 233 }, (_, index) => `trending-${233 - index}`),
    );
    expect(new Set(trending.map((video) => video.id)).size).toBe(235);
    expect(trendingPages).toEqual([
      { page: 1, limit: 100 },
      { page: 2, limit: 100 },
      { page: 3, limit: 100 },
    ]);
    expect(sectionHasMore.recommended).toBe(false);
    expect(sectionHasMore.trending).toBe(false);
    expect(latest).toHaveLength(235);
    expect(latest[0].id).toBe("latest-235");
    expect(latest.slice(1).map((video) => video.id)).not.toEqual(
      Array.from({ length: 234 }, (_, index) => `latest-${234 - index}`),
    );
    expect(new Set(latest.map((video) => video.id)).size).toBe(235);
    expect(latestPages).toEqual([
      { page: 1, limit: 100 },
      { page: 2, limit: 100 },
      { page: 3, limit: 100 },
    ]);
    expect(sectionHasMore.latest).toBe(false);
    expect(shorts).toHaveLength(235);
    expect(shorts.slice(0, 2).map((short) => short.id)).toEqual([
      "short-235",
      "short-234",
    ]);
    expect(shorts.slice(2).map((short) => short.id)).not.toEqual(
      Array.from({ length: 233 }, (_, index) => `short-${233 - index}`),
    );
    expect(new Set(shorts.map((short) => short.id)).size).toBe(235);
    expect(sectionHasMore.shorts).toBe(false);
  });

  it("reshuffles the complete recommended list as more pages load", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        const parsedUrl = new URL(url);
        const section = parsedUrl.pathname.split("/").pop();
        const page = Number(parsedUrl.searchParams.get("page"));

        return {
          ok: true,
          json: async () => ({
            total: section === "recommended" ? 10 : 0,
            videos:
              section === "recommended"
                ? Array.from({ length: 5 }, (_, index) => ({
                    _id: `recommended-${(page - 1) * 5 + index + 1}`,
                  }))
                : [],
          }),
        };
      }),
    );

    await store.dispatch(fetchHomeVideos({ limit: 5 })).unwrap();
    const firstPageOrder = store
      .getState()
      .videos.recommended.map((item) => item.id);
    await store
      .dispatch(fetchNextHomeSection({ section: "recommended", limit: 5 }))
      .unwrap();

    const allRecommended = store
      .getState()
      .videos.recommended.map((item) => item.id);
    expect(allRecommended).toHaveLength(10);
    expect(new Set(allRecommended)).toEqual(
      new Set(Array.from({ length: 10 }, (_, index) => `recommended-${index + 1}`)),
    );
    expect(allRecommended).not.toEqual([
      ...firstPageOrder,
      "recommended-6",
      "recommended-7",
      "recommended-8",
      "recommended-9",
      "recommended-10",
    ]);
  });

  it("keeps the top three Shorts fixed and shuffles the remaining Shorts feed", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          page: 1,
          limit: 5,
          total: 5,
          videos: Array.from({ length: 5 }, (_, index) => ({
            _id: `short-${index + 1}`,
          })),
        }),
      })),
    );

    await store.dispatch(fetchShortsFeed({ limit: 5 })).unwrap();

    expect(store.getState().videos.shorts.map((item) => item.id)).toEqual([
      "short-1",
      "short-2",
      "short-3",
      "short-5",
      "short-4",
    ]);
  });

  it("loads and appends every page from the Shorts API", async () => {
    let requestCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        requestCount += 1;
        const params = new URL(url).searchParams;
        const page = Number(params.get("page"));
        const count = page === 1 ? 100 : 50;

        expect(url).toContain("/trending-shorts?");
        expect(Number(params.get("limit"))).toBe(100);
        expect(page).toBe(requestCount);

        return {
          ok: true,
          json: async () => ({
            page,
            limit: 100,
            total: 150,
            videos: Array.from({ length: count }, (_, index) => ({
              _id: `short-${(page - 1) * 100 + index}`,
              videoUrl: "https://cdn.example/short.mp4",
            })),
          }),
        };
      }),
    );

    await store.dispatch(fetchShortsFeed({ limit: 100 })).unwrap();
    expect(store.getState().videos.shorts).toHaveLength(100);
    expect(store.getState().videos.sectionHasMore.shorts).toBe(true);

    await store
      .dispatch(fetchNextHomeSection({ section: "shorts", limit: 100 }))
      .unwrap();
    expect(store.getState().videos.shorts).toHaveLength(150);
    expect(store.getState().videos.sectionHasMore.shorts).toBe(false);
    expect(requestCount).toBe(2);
  });

  it("loads public Home sections without a login token", async () => {
    const requestedUrls = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        requestedUrls.push(String(url));
        return {
          ok: true,
          json: async () => ({
            success: true,
            page: 1,
            limit: 5,
            total: 1,
            videos: [{ _id: "public-video", title: "Public video" }],
          }),
        };
      }),
    );

    await store.dispatch(fetchHomeVideos({ limit: 5 })).unwrap();

    expect(store.getState().videos.recommended).toHaveLength(1);
    expect(store.getState().videos.trending).toHaveLength(1);
    expect(store.getState().videos.latest).toHaveLength(1);
    expect(store.getState().videos.shorts).toHaveLength(1);
    expect(store.getState().videos.subscriptions).toHaveLength(0);
    expect(requestedUrls).toHaveLength(4);
    expect(requestedUrls.some((url) => url.includes("/subscriptions"))).toBe(
      false,
    );
  });

  it("keeps Home and video sections available after login", async () => {
    localStorage.setItem("token", "test-token");
    const requestedUrls = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, options) => {
        requestedUrls.push({ url: String(url), options });
        return {
          ok: true,
          json: async () => ({
            success: true,
            page: 1,
            limit: 5,
            total: 1,
            videos: [{ _id: "signed-in-video", title: "Signed-in video" }],
          }),
        };
      }),
    );

    await store.dispatch(fetchHomeVideos({ limit: 5 })).unwrap();

    expect(store.getState().videos.recommended).toHaveLength(1);
    expect(store.getState().videos.trending).toHaveLength(1);
    expect(store.getState().videos.latest).toHaveLength(1);
    expect(store.getState().videos.subscriptions).toHaveLength(1);
    expect(requestedUrls).toHaveLength(5);
    expect(
      requestedUrls.every(
        ({ options }) => options.headers.Authorization === "Bearer test-token",
      ),
    ).toBe(true);
  });
});
