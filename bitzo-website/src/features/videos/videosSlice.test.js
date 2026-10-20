import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import videosReducer, {
  fetchHomeVideos,
  fetchNextHomeSection,
  fetchShortsFeed,
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
