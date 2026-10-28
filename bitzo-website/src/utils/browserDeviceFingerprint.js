const normalizePlatform = (value) => {
  const platform = String(value || "").trim();
  const normalized = platform.toLowerCase();

  if (/win|windows/.test(normalized)) return "Windows";
  if (/mac|darwin/.test(normalized)) return "macOS";
  if (/android/.test(normalized)) return "Android";
  if (/iphone|ipad|ipod|ios/.test(normalized)) return "iOS";
  if (/cros|chrome os/.test(normalized)) return "ChromeOS";
  if (/linux/.test(normalized)) return "Linux";

  return platform;
};

export const getBrowserDeviceSignals = (browser = globalThis) => {
  const { navigator, screen } = browser;
  if (!navigator || !screen) {
    throw new Error(
      "This browser cannot verify the device. Refresh the page and try again.",
    );
  }

  const platform = normalizePlatform(
    navigator.userAgentData?.platform || navigator.platform,
  );
  const devicePixelRatio = browser.devicePixelRatio || 1;
  if (
    !platform ||
    !Number.isFinite(screen.width) ||
    screen.width <= 0 ||
    !Number.isFinite(screen.height) ||
    screen.height <= 0 ||
    !Number.isFinite(screen.colorDepth) ||
    screen.colorDepth <= 0 ||
    !Number.isFinite(devicePixelRatio) ||
    devicePixelRatio <= 0
  ) {
    throw new Error(
      "This browser cannot verify the device. Refresh the page and try again.",
    );
  }

  return {
    version: "web-v1",
    platform,
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: screen.colorDepth,
    devicePixelRatio,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
  };
};
