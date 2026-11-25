import { describe, expect, it } from "vitest";
import { filterChannelVideos } from "../src/components/channels/channelVideoSearch";

const videos = [
  {
    _id: "long-video",
    title: "Cooking Basics",
    description: "Learn quick recipes",
    videoType: ["long"],
    hashtags: ["food"],
  },
  {
    _id: "short-video",
    title: "Quick kitchen tip",
    description: "A cooking shortcut",
    videoType: ["short"],
    hashtags: ["cooking"],
  },
];

describe("filterChannelVideos", () => {
  it("searches titles, descriptions, and hashtags without case sensitivity", () => {
    expect(filterChannelVideos(videos, "all", "KITCHEN")).toEqual([
      videos[1],
    ]);
    expect(filterChannelVideos(videos, "all", "FOOD")).toEqual([videos[0]]);
  });

  it("combines the search text with the selected video type", () => {
    expect(filterChannelVideos(videos, "short", "cooking")).toEqual([
      videos[1],
    ]);
    expect(filterChannelVideos(videos, "long", "shortcut")).toEqual([]);
  });

  it("returns all videos when the search is empty", () => {
    expect(filterChannelVideos(videos, "all", "  ")).toEqual(videos);
  });
});
