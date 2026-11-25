import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hlsMocks = vi.hoisted(() => ({
  ref: {
    current: {
      levels: [{ height: 360 }, { height: 720 }, { height: 1080 }],
      currentLevel: -1,
    },
  },
  useHlsSource: vi.fn(),
}));

vi.mock("../src/components/player/useHlsSource", () => ({
  default: hlsMocks.useHlsSource,
}));

import useHlsSource from "../src/components/player/useHlsSource";
import VideoPlayer from "../src/components/player/VideoPlayer";

describe("VideoPlayer quality selection", () => {
  beforeEach(() => {
    hlsMocks.ref.current.currentLevel = -1;
    hlsMocks.useHlsSource.mockReturnValue(hlsMocks.ref);
  });

  it("switches HLS levels without replacing the master playlist", () => {
    const masterPlaylist = "https://cdn.example/video/master.m3u8";
    render(
      <VideoPlayer
        src={masterPlaylist}
        qualitySources={{
          "360p": "https://cdn.example/video/360p/index.m3u8",
          "720p": "https://cdn.example/video/720p/index.m3u8",
          "1080p": "https://cdn.example/video/1080p/index.m3u8",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Video quality: Auto" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "720p" }));

    expect(hlsMocks.ref.current.currentLevel).toBe(1);
    expect(
      screen.getByRole("button", { name: "Video quality: 720p" }),
    ).toBeInTheDocument();
    expect(
      useHlsSource.mock.calls[useHlsSource.mock.calls.length - 1][1],
    ).toBe(masterPlaylist);

    fireEvent.click(
      screen.getByRole("button", { name: "Video quality: 720p" }),
    );
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Auto" }));

    expect(hlsMocks.ref.current.currentLevel).toBe(-1);
    expect(
      useHlsSource.mock.calls[useHlsSource.mock.calls.length - 1][1],
    ).toBe(masterPlaylist);
  });
});
