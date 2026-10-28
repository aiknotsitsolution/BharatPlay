import { describe, expect, it } from "vitest";
import { getBrowserDeviceSignals } from "./browserDeviceFingerprint";

const createBrowser = (userAgent = "Chrome") => ({
  navigator: {
    platform: "Windows",
    userAgent,
    hardwareConcurrency: 8,
    maxTouchPoints: 0,
  },
  screen: { width: 1920, height: 1080, colorDepth: 24 },
  devicePixelRatio: 1,
});

describe("getBrowserDeviceSignals", () => {
  it("creates the same signals across browsers with matching device properties", () => {
    const chromeSignals = getBrowserDeviceSignals(createBrowser("Chrome"));
    const firefoxBrowser = createBrowser("Firefox");
    firefoxBrowser.navigator.platform = "Win32";
    firefoxBrowser.navigator.userAgentData = { platform: "Windows" };
    const firefoxSignals = getBrowserDeviceSignals(firefoxBrowser);

    expect(chromeSignals).toMatchObject({
      version: "web-v1",
      platform: "Windows",
      screenWidth: 1920,
      screenHeight: 1080,
      hardwareConcurrency: 8,
    });
    expect(firefoxSignals).toEqual(chromeSignals);
  });

  it("normalizes platform names that differ between browser APIs", () => {
    const chromeBrowser = createBrowser("Chrome");
    chromeBrowser.navigator.platform = "Win32";
    chromeBrowser.navigator.userAgentData = { platform: "Windows" };
    const firefoxBrowser = createBrowser("Firefox");
    firefoxBrowser.navigator.platform = "Win32";

    expect(getBrowserDeviceSignals(chromeBrowser)).toEqual(
      getBrowserDeviceSignals(firefoxBrowser),
    );
  });

  it("requires browser device signals", () => {
    expect(() =>
      getBrowserDeviceSignals({
        navigator: {},
        screen: {},
      }),
    ).toThrow("cannot verify the device");
  });
});
