import { describe, expect, it, vi } from "vitest";
import { isLikelyPrivateBrowsing } from "./privateBrowsing";

const chromeUserAgent = "Mozilla/5.0 Chrome/150.0.0.0 Safari/537.36";

describe("isLikelyPrivateBrowsing", () => {
  it("blocks Chromium when storage quota indicates private browsing", async () => {
    const storage = { estimate: vi.fn().mockResolvedValue({ quota: 1_000_000 }) };

    await expect(isLikelyPrivateBrowsing(chromeUserAgent, storage)).resolves.toBe(true);
  });

  it("blocks Chromium when the storage estimate is missing or unusable", async () => {
    await expect(isLikelyPrivateBrowsing(chromeUserAgent, undefined)).resolves.toBe(true);
    await expect(
      isLikelyPrivateBrowsing(chromeUserAgent, {
        estimate: vi.fn().mockResolvedValue({}),
      }),
    ).resolves.toBe(true);
  });

  it("allows Chromium when quota is above the private-browsing threshold", async () => {
    const storage = {
      estimate: vi.fn().mockResolvedValue({ quota: 3 * 1024 * 1024 * 1024 }),
    };

    await expect(isLikelyPrivateBrowsing(chromeUserAgent, storage)).resolves.toBe(false);
  });

  it("blocks other browsers when storage quota is unusually small", async () => {
    const storage = {
      estimate: vi.fn().mockResolvedValue({ quota: 1_000_000 }),
    };

    await expect(
      isLikelyPrivateBrowsing("Mozilla/5.0 Firefox/130.0", storage),
    ).resolves.toBe(true);
    expect(storage.estimate).toHaveBeenCalledOnce();
  });

  it("fails closed when another browser cannot report storage quota", async () => {
    await expect(
      isLikelyPrivateBrowsing("Mozilla/5.0 Firefox/130.0", undefined),
    ).resolves.toBe(true);
  });

  it("allows other browsers when storage quota is normal", async () => {
    const storage = {
      estimate: vi.fn().mockResolvedValue({ quota: 3 * 1024 * 1024 * 1024 }),
    };

    await expect(
      isLikelyPrivateBrowsing("Mozilla/5.0 Firefox/130.0", storage),
    ).resolves.toBe(false);
  });
});
