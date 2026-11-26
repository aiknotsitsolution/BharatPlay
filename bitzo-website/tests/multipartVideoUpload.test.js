import { beforeEach, describe, expect, it, vi } from "vitest";

const { axiosMock, b2ClientMock } = vi.hoisted(() => ({
  axiosMock: {
    post: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
  },
  b2ClientMock: {
    put: vi.fn(),
  },
}));

vi.mock("axios", () => ({
  default: {
    post: axiosMock.post,
    get: axiosMock.get,
    create: vi.fn(() => b2ClientMock),
  },
}));

import { uploadVideoMultipart } from "../src/utils/multipartVideoUpload";

describe("uploadVideoMultipart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    axiosMock.post.mockImplementation((url) => {
      if (url.endsWith("/multipart/initiate")) {
        return Promise.resolve({
          data: { videoId: "video-1", partSize: 16 * 1024 * 1024 },
        });
      }
      if (url.endsWith("/multipart/video-1/part")) {
        return Promise.resolve({ data: { url: "https://b2.example/part" } });
      }
      if (url.endsWith("/multipart/video-1/complete")) {
        return Promise.resolve({
          data: { videoId: "video-1", processingStatus: "queued" },
        });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    b2ClientMock.put.mockResolvedValue({ status: 200, headers: {} });
  });

  it("retries a part PUT without requesting another part URL", async () => {
    b2ClientMock.put
      .mockRejectedValueOnce(new Error("Temporary B2 failure"))
      .mockResolvedValueOnce({ status: 200, headers: {} });

    const result = await uploadVideoMultipart({
      api: "https://api.example/api",
      channelId: "channel-1",
      token: "token",
      file: new File(["video"], "clip.mp4", { type: "video/mp4" }),
      metadata: {
        name: "Clip",
        category: "category-1",
        videoType: "short",
        duration: 5,
      },
    });

    expect(result).toMatchObject({
      videoId: "video-1",
      processingStatus: "queued",
    });
    expect(b2ClientMock.put).toHaveBeenCalledTimes(2);
    expect(axiosMock.post).toHaveBeenCalledTimes(3);
    expect(
      axiosMock.post.mock.calls.filter(([url]) => url.endsWith("/part")),
    ).toHaveLength(1);
  });

  it("recovers from a stale saved upload session reported as missing", async () => {
    const file = new File(["video"], "clip.mp4", {
      type: "video/mp4",
      lastModified: 123,
    });
    const sessionKey = `video-upload:channel-1:new:${file.name}:${file.size}:${file.lastModified}`;
    localStorage.setItem(
      sessionKey,
      JSON.stringify({ channelId: "channel-1", videoId: "stale-video" }),
    );
    axiosMock.get.mockResolvedValue({
      data: {
        success: true,
        found: false,
        processingStatus: "missing",
        parts: [],
      },
    });

    await expect(
      uploadVideoMultipart({
        api: "https://api.example/api",
        channelId: "channel-1",
        token: "token",
        file,
        metadata: {
          name: "Clip",
          category: "category-1",
          videoType: "short",
          duration: 5,
        },
      }),
    ).resolves.toMatchObject({ videoId: "video-1" });

    expect(axiosMock.get).toHaveBeenCalledTimes(1);
    expect(axiosMock.post).toHaveBeenCalledTimes(3);
    expect(localStorage.getItem(sessionKey)).toBeNull();
  });

  it("uses a supported extension when the browser reports a generic MIME type", async () => {
    await uploadVideoMultipart({
      api: "https://api.example/api",
      channelId: "channel-1",
      token: "token",
      file: new File(["video"], "clip.mp4", {
        type: "application/octet-stream",
      }),
      metadata: {
        name: "Clip",
        category: "category-1",
        videoType: "short",
        duration: 5,
      },
    });

    expect(axiosMock.post.mock.calls[0][1]).toMatchObject({
      contentType: "video/mp4",
      fileName: "clip.mp4",
    });
  });
});
