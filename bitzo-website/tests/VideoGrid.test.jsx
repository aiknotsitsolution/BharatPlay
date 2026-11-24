import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MovieCard } from "../src/components/common/VideoGrid";
import ShortCard from "../src/components/common/ShortCard";

describe("feed cards", () => {
  it("shows a video thumbnail without mounting a preview player", () => {
    const onClick = vi.fn();
    const item = {
      id: "video-1",
      title: "Video title",
      thumb: "https://cdn.example/video-thumbnail.jpg",
      videoUrl: "https://cdn.example/video.mp4",
    };
    const { container } = render(<MovieCard item={item} onClick={onClick} />);

    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByAltText(item.title)).toHaveAttribute("src", item.thumb);
    fireEvent.click(container.querySelector('[role="button"]'));
    expect(onClick).toHaveBeenCalledWith(item);
  });

  it("shows a Shorts thumbnail without mounting a preview player", () => {
    const onClick = vi.fn();
    const item = {
      id: "short-1",
      title: "Short title",
      thumbnail: "https://cdn.example/short-thumbnail.jpg",
      videoUrl: "https://cdn.example/short.mp4",
    };
    const { container } = render(<ShortCard item={item} onClick={onClick} />);

    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByAltText(item.title)).toHaveAttribute(
      "src",
      item.thumbnail,
    );
    fireEvent.click(container.querySelector('[role="button"]'));
    expect(onClick).toHaveBeenCalledWith(item);
  });
});
