const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  buildTranscodeArgs,
  getAvailableResolutions,
  getContentType,
  writeMasterPlaylist,
} = require("../utils/hlsTranscode");

describe("HLS transcoding profiles", () => {
  test("does not upscale inputs and supplies the expected available renditions", () => {
    expect(getAvailableResolutions(1080).map(({ height }) => height)).toEqual([
      360,
      480,
      720,
      1080,
    ]);
    expect(getAvailableResolutions(720).map(({ height }) => height)).toEqual([
      360,
      480,
      720,
    ]);
    expect(getAvailableResolutions(240).map(({ height }) => height)).toEqual([
      240,
    ]);
  });

  test("builds a split HLS transcode command and a valid master playlist", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "hls-test-"));
    try {
      const profiles = getAvailableResolutions(480);
      const args = buildTranscodeArgs("source.mp4", directory, profiles);
      expect(args[args.indexOf("-filter_complex") + 1]).toContain(
        "[0:v:0]split=2[source0][source1]",
      );
      expect(args.filter((argument) => argument.endsWith("index.m3u8"))).toHaveLength(2);

      const masterPath = path.join(directory, "master.m3u8");
      writeMasterPlaylist(masterPath, profiles, 1920, 1080);
      const playlist = fs.readFileSync(masterPath, "utf8");
      expect(playlist).toContain("#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=640x360");
      expect(playlist).toContain("480p/index.m3u8");
      expect(getContentType(masterPath)).toBe("application/vnd.apple.mpegurl");
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
});
