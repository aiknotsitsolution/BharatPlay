import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QualityMenu } from "../src/components/player/Menus";
import { uploadVideoMultipart } from "../src/utils/multipartVideoUpload";

const axiosMocks = vi.hoisted(() => {
  const b2Client = { defaults: undefined, put: vi.fn() };
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    b2Client,
    create: vi.fn((defaults) => {
      b2Client.defaults = defaults;
      return b2Client;
    }),
  };
});

vi.mock("axios", () => ({
  default: axiosMocks,
}));

describe("video streaming quality and multipart upload", () => {
  it("allows viewers to choose Auto and only enables available resolutions", () => {
    const onChange = vi.fn();
    render(
      <QualityMenu
        quality="720p"
        qualities={[{ value: "360p" }, { value: "720p" }]}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Video quality: 720p" }));

    const autoOption = screen.getByRole("menuitemradio", { name: "Auto" });
    expect(autoOption).toBeEnabled();
    expect(screen.getByRole("menuitemradio", { name: "360p" })).toBeEnabled();
    expect(screen.getByRole("menuitemradio", { name: "480p" })).toBeDisabled();
    fireEvent.click(autoOption);
    expect(onChange).toHaveBeenCalledWith("auto");
  });

  it("uploads multipart chunks to presigned URLs and completes the session", async () => {
    localStorage.clear();
    axiosMocks.get.mockReset();
    axiosMocks.put.mockReset();
    axiosMocks.b2Client.put.mockReset();
    axiosMocks.post.mockReset();
    axiosMocks.post.mockImplementation((url) => {
      if (url.endsWith("/initiate")) {
        return Promise.resolve({
          data: { videoId: "video-1", partSize: 6 },
        });
      }
      if (url.endsWith("/part")) {
        return Promise.resolve({ data: { url: "https://b2.example/part" } });
      }
      if (url.endsWith("/complete")) {
        return Promise.resolve({
          data: { processingStatus: "queued", videoId: "video-1" },
        });
      }
      throw new Error(`Unexpected POST ${url}`);
    });
    axiosMocks.b2Client.put.mockResolvedValue({
      headers: { etag: '"part-etag"' },
    });
    const progress = vi.fn();

    const result = await uploadVideoMultipart({
      api: "/api",
      channelId: "channel-1",
      token: "test-token",
      file: new File([new Uint8Array(10)], "clip.mp4", {
        type: "video/mp4",
        lastModified: 1,
      }),
      metadata: {
        name: "Clip",
        category: "category-1",
        videoType: "short",
        duration: 5,
      },
      onProgress: progress,
    });

    expect(axiosMocks.b2Client.defaults).toEqual({ withCredentials: false });
    expect(axiosMocks.b2Client.put).toHaveBeenCalledTimes(2);
    expect(axiosMocks.b2Client.put).toHaveBeenCalledWith(
      "https://b2.example/part",
      expect.any(Blob),
      expect.objectContaining({
        headers: { "Content-Type": "application/octet-stream" },
      }),
    );
    expect(axiosMocks.put).not.toHaveBeenCalled();
    expect(result.processingStatus).toBe("queued");
    expect(progress).toHaveBeenLastCalledWith(100);
    expect(localStorage.length).toBe(0);
  });
});
