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

  it("does not apply the Chromium quota heuristic to other browsers", async () => {
    const storage = { estimate: vi.fn() };

    await expect(
      isLikelyPrivateBrowsing("Mozilla/5.0 Firefox/130.0", storage),
    ).resolves.toBe(false);
    expect(storage.estimate).not.toHaveBeenCalled();
  });
});
