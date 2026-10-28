import { describe, expect, it, vi } from "vitest";
import {
  fetchAllLatestVideos,
  fetchAllRecommendedVideos,
} from "./fetchAllRecommendedVideos";

describe("fetchAllRecommendedVideos", () => {
  it("loads every recommended video in API-supported batches", async () => {
    const fetchImpl = vi.fn(async (url) => {
      const parsedUrl = new URL(url);
      const page = Number(parsedUrl.searchParams.get("page"));
      const start = (page - 1) * 100;
      const count = Math.min(100, 235 - start);

      return {
        ok: true,
        json: async () => ({
          success: true,
          total: 235,
          videos: Array.from({ length: count }, (_, index) => ({
            id: `video-${start + index + 1}`,
          })),
        }),
      };
    });

    const videos = await fetchAllRecommendedVideos({
      apiBase: "http://192.168.1.20:5173/:4000/api/uservideo",
      category: "category-id",
      token: "test-token",
      fetchImpl,
    });

    expect(videos).toHaveLength(235);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(
      fetchImpl.mock.calls.map(([url]) => {
        const parsedUrl = new URL(url);
        return {
          page: parsedUrl.searchParams.get("page"),
          limit: parsedUrl.searchParams.get("limit"),
          category: parsedUrl.searchParams.get("category"),
        };
      }),
    ).toEqual([
      { page: "1", limit: "100", category: "category-id" },
      { page: "2", limit: "100", category: "category-id" },
      { page: "3", limit: "100", category: "category-id" },
    ]);
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer test-token",
    );
  });

  it("surfaces API failures instead of returning an incomplete feed", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });

    await expect(
      fetchAllRecommendedVideos({
        apiBase: "http://192.168.1.20:5173/:4000/api/uservideo",
        fetchImpl,
      }),
    ).rejects.toThrow("Failed to load recommended videos (503)");
  });

  it("loads every Latest Videos page from the latest endpoint", async () => {
    const fetchImpl = vi.fn(async (url) => {
      const parsedUrl = new URL(url);
      const page = Number(parsedUrl.searchParams.get("page"));
      return {
        ok: true,
        json: async () => ({
          total: 101,
          videos: Array.from({ length: page === 1 ? 100 : 1 }, (_, index) => ({
            id: `latest-${(page - 1) * 100 + index + 1}`,
          })),
        }),
      };
    });

    const videos = await fetchAllLatestVideos({
      apiBase: "http://192.168.1.20:5173/:4000/api/uservideo",
      fetchImpl,
    });

    expect(videos).toHaveLength(101);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls.map(([url]) => new URL(url).pathname)).toEqual([
      "/api/uservideo/latest",
      "/api/uservideo/latest",
    ]);
  });
});
