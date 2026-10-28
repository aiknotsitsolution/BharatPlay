import { describe, expect, it, vi } from "vitest";
import {
  isLikelyPrivateBrowsing,
  PRIVATE_BROWSING_BYPASS_UNTIL,
} from "./privateBrowsing";

const chromeUserAgent = "Mozilla/5.0 Chrome/150.0.0.0 Safari/537.36";

describe("isLikelyPrivateBrowsing", () => {
  it("allows authentication until the temporary bypass expires", async () => {
    const storage = { estimate: vi.fn() };

    await expect(
      isLikelyPrivateBrowsing(chromeUserAgent, storage, PRIVATE_BROWSING_BYPASS_UNTIL - 1),
    ).resolves.toBe(false);
    expect(storage.estimate).not.toHaveBeenCalled();
  });

  it("resumes private browsing detection once the temporary bypass expires", async () => {
    const storage = { estimate: vi.fn().mockResolvedValue({ quota: 1_000_000 }) };

    await expect(
      isLikelyPrivateBrowsing(chromeUserAgent, storage, PRIVATE_BROWSING_BYPASS_UNTIL),
    ).resolves.toBe(true);
    expect(storage.estimate).toHaveBeenCalledOnce();
  });

  it("blocks Chromium when storage quota indicates private browsing", async () => {
    const storage = { estimate: vi.fn().mockResolvedValue({ quota: 1_000_000 }) };

    await expect(
      isLikelyPrivateBrowsing(chromeUserAgent, storage, PRIVATE_BROWSING_BYPASS_UNTIL),
    ).resolves.toBe(true);
  });

  it("blocks Chromium when the storage estimate is missing or unusable", async () => {
    await expect(
      isLikelyPrivateBrowsing(
        chromeUserAgent,
        undefined,
        PRIVATE_BROWSING_BYPASS_UNTIL,
      ),
    ).resolves.toBe(true);
    await expect(
      isLikelyPrivateBrowsing(chromeUserAgent, {
        estimate: vi.fn().mockResolvedValue({}),
      }, PRIVATE_BROWSING_BYPASS_UNTIL),
    ).resolves.toBe(true);
  });

  it("allows Chromium when quota is above the private-browsing threshold", async () => {
    const storage = {
      estimate: vi.fn().mockResolvedValue({ quota: 3 * 1024 * 1024 * 1024 }),
    };

    await expect(
      isLikelyPrivateBrowsing(chromeUserAgent, storage, PRIVATE_BROWSING_BYPASS_UNTIL),
    ).resolves.toBe(false);
  });

  it("blocks other browsers when storage quota is unusually small", async () => {
    const storage = {
      estimate: vi.fn().mockResolvedValue({ quota: 1_000_000 }),
    };

    await expect(
      isLikelyPrivateBrowsing(
        "Mozilla/5.0 Firefox/130.0",
        storage,
        PRIVATE_BROWSING_BYPASS_UNTIL,
      ),
    ).resolves.toBe(true);
    expect(storage.estimate).toHaveBeenCalledOnce();
  });

  it("fails closed when another browser cannot report storage quota", async () => {
    await expect(
      isLikelyPrivateBrowsing(
        "Mozilla/5.0 Firefox/130.0",
        undefined,
        PRIVATE_BROWSING_BYPASS_UNTIL,
      ),
    ).resolves.toBe(true);
  });

  it("allows other browsers when storage quota is normal", async () => {
    const storage = {
      estimate: vi.fn().mockResolvedValue({ quota: 3 * 1024 * 1024 * 1024 }),
    };

    await expect(
      isLikelyPrivateBrowsing(
        "Mozilla/5.0 Firefox/130.0",
        storage,
        PRIVATE_BROWSING_BYPASS_UNTIL,
      ),
    ).resolves.toBe(false);
  });
});
