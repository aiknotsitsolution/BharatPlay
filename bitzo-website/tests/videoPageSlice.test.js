import { configureStore } from "@reduxjs/toolkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import videoPageReducer, {
  fetchVideoPage,
} from "../src/features/videoPage/videoPageSlice";

describe("video page loading", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads video details and comments concurrently", async () => {
    const resolvers = [];
    const fetchMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const store = configureStore({
      reducer: { videoPage: videoPageReducer },
    });

    const request = store.dispatch(fetchVideoPage("video-1"));
    expect(fetchMock).toHaveBeenCalledTimes(2);

    resolvers[0]({
      ok: true,
      json: async () => ({
        success: true,
        video: { _id: "video-1", title: "Test video" },
      }),
    });
    resolvers[1]({
      ok: true,
      json: async () => ({
        success: true,
        comments: [{ _id: "comment-1" }],
      }),
    });

    await expect(request.unwrap()).resolves.toMatchObject({
      video: { title: "Test video" },
      comments: [{ _id: "comment-1" }],
    });
  });
});
