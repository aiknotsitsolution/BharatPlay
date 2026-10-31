import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("API origin", () => {
  it("uses localhost for local Vite development", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    vi.stubGlobal("window", {
      location: { hostname: "localhost", port: "5173" },
    });

    const { API_ORIGIN } = await import("./api");

    expect(API_ORIGIN).toBe("http://localhost:4000");
  });

  it("uses the current Vite host for LAN development", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    vi.stubGlobal("window", {
      location: { hostname: "192.168.1.20", port: "5173" },
    });

    const { API_ORIGIN } = await import("./api");

    expect(API_ORIGIN).toBe("http://192.168.1.20:4000");
  });

  it("uses the current origin for production same-origin proxying", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    vi.stubGlobal("window", {
      location: {
        hostname: "vidbux.example.com",
        port: "",
        origin: "https://vidbux.example.com",
      },
    });

    const { API_ORIGIN } = await import("./api");

    expect(API_ORIGIN).toBe("https://vidbux.example.com");
  });

  it("respects an explicitly configured API origin", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com/");
    vi.stubGlobal("window", {
      location: { hostname: "192.168.1.20", port: "5173" },
    });

    const { API_ORIGIN } = await import("./api");

    expect(API_ORIGIN).toBe("https://api.example.com");
  });
});
