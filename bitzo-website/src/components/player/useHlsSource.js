import { useEffect, useRef } from "react";

const isHlsUrl = (src) =>
  typeof src === "string" && /\.m3u8(?:$|[?#])/i.test(src);

export default function useHlsSource(videoRef, src, enabled = true) {
  const hlsRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    hlsRef.current?.destroy();
    hlsRef.current = null;

    if (!enabled || !src) {
      video.removeAttribute("src");
      video.load();
      return undefined;
    }

    if (!isHlsUrl(src)) {
      video.src = src;
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    let disposed = false;
    let hls;
    let recoveries = 0;
    import("hls.js/dist/hls.light.mjs")
      .then(({ default: Hls }) => {
        if (disposed) return;
        if (!Hls.isSupported()) {
          video.dispatchEvent(new Event("error"));
          return;
        }

        hls = new Hls({
          enableWorker: true,
          backBufferLength: 60,
          maxBufferLength: 30,
          startLevel: -1,
        });
        hlsRef.current = hls;
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && recoveries < 2) {
            recoveries += 1;
            hls.startLoad();
            return;
          }
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR && recoveries < 2) {
            recoveries += 1;
            hls.recoverMediaError();
            return;
          }
          video.dispatchEvent(new Event("error"));
        });
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(src));
      })
      .catch((error) => {
        if (disposed) return;
        console.error("[useHlsSource] HLS playback could not be initialized:", error);
        video.dispatchEvent(new Event("error"));
      });

    return () => {
      disposed = true;
      hls?.destroy();
      if (hlsRef.current === hls) hlsRef.current = null;
      video.removeAttribute("src");
      video.load();
    };
  }, [enabled, src, videoRef]);

  return hlsRef;
}
