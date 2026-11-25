import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QualityMenu } from "../src/components/player/Menus";
import { uploadVideoMultipart } from "../src/utils/multipartVideoUpload";

const axiosMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}));

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
    axiosMocks.put.mockResolvedValue({ headers: { etag: '"part-etag"' } });
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

    expect(axiosMocks.put).toHaveBeenCalledTimes(2);
    expect(axiosMocks.put).toHaveBeenCalledWith(
      "https://b2.example/part",
      expect.any(Blob),
      expect.objectContaining({
        headers: { "Content-Type": "application/octet-stream" },
      }),
    );
    expect(result.processingStatus).toBe("queued");
    expect(progress).toHaveBeenLastCalledWith(100);
    expect(localStorage.length).toBe(0);
  });
});
