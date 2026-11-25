const fs = require("node:fs");
const path = require("node:path");

const RESOLUTIONS = [
  { height: 360, bandwidth: 1000000, videoBitrate: 800 },
  { height: 480, bandwidth: 1500000, videoBitrate: 1200 },
  { height: 720, bandwidth: 3000000, videoBitrate: 2500 },
  { height: 1080, bandwidth: 6000000, videoBitrate: 5000 },
];

function getAvailableResolutions(sourceHeight) {
  const resolutions = RESOLUTIONS.filter(({ height }) => height <= sourceHeight);
  if (resolutions.length) return resolutions;
  const height = Math.max(2, Math.floor(sourceHeight / 2) * 2);
  return [{ height, bandwidth: 250000, videoBitrate: 250 }];
}

function buildTranscodeArgs(inputPath, outputDirectory, resolutions) {
  const splitLabels = resolutions.map((_, index) => `[source${index}]`).join("");
  const filters = [
    `[0:v:0]split=${resolutions.length}${splitLabels}`,
    ...resolutions.map(
      ({ height }, index) =>
        `[source${index}]scale=-2:min(${height}\\,ih)[v${index}]`,
    ),
  ];
  const args = [
    "-hide_banner",
    "-y",
    "-i",
    inputPath,
    "-filter_complex",
    filters.join(";"),
  ];

  resolutions.forEach(({ height, videoBitrate = 250 }, index) => {
    const renditionDirectory = path.join(outputDirectory, `${height}p`);
    fs.mkdirSync(renditionDirectory, { recursive: true });
    args.push(
      "-map",
      `[v${index}]`,
      "-map",
      "0:a:0?",
      "-c:v",
      "libx264",
      "-preset",
      process.env.FFMPEG_PRESET || "veryfast",
      "-crf",
      "23",
      "-maxrate",
      `${videoBitrate}k`,
      "-bufsize",
      `${videoBitrate * 2}k`,
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-hls_time",
      "6",
      "-hls_playlist_type",
      "vod",
      "-hls_flags",
      "independent_segments",
      "-hls_segment_filename",
      path.join(renditionDirectory, "segment_%05d.ts"),
      path.join(renditionDirectory, "index.m3u8"),
    );
  });
  return args;
}

function writeMasterPlaylist(filePath, resolutions, sourceWidth, sourceHeight) {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:3"];
  for (const { height, bandwidth } of resolutions) {
    const width = Math.max(
      2,
      Math.floor((sourceWidth * height) / sourceHeight / 2) * 2,
    );
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${width}x${height}`,
      `${height}p/index.m3u8`,
    );
  }
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function getContentType(filePath) {
  if (filePath.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
  if (filePath.endsWith(".ts")) return "video/mp2t";
  if (filePath.endsWith(".jpg")) return "image/jpeg";
  throw new Error(`Unsupported generated media file: ${filePath}`);
}

module.exports = {
  buildTranscodeArgs,
  getAvailableResolutions,
  getContentType,
  writeMasterPlaylist,
};
