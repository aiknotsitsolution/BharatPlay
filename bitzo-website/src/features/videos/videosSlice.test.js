import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import videosReducer, {
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
});
