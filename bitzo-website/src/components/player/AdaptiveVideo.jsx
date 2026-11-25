import { forwardRef, useImperativeHandle, useRef } from "react";
import useHlsSource from "./useHlsSource";

const AdaptiveVideo = forwardRef(function AdaptiveVideo(
  { src, preload = "metadata", ...props },
  forwardedRef,
) {
  const videoRef = useRef(null);
  useHlsSource(videoRef, src, preload !== "none");
  useImperativeHandle(forwardedRef, () => videoRef.current);

  return <video {...props} ref={videoRef} preload={preload} />;
});

export default AdaptiveVideo;
