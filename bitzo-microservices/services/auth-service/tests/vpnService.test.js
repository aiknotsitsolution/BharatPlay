const {
  getClientIp,
  isLocalOrPrivateIp,
  normalizeIp,
} = require("../services/vpn.service/vpn.service");

describe("VPN service IP handling", () => {
  test("uses Express's trusted client IP, not raw forwarded headers", () => {
    expect(
      getClientIp({
        ip: "8.8.8.8",
        headers: { "x-forwarded-for": "203.0.113.10" },
        socket: { remoteAddress: "10.0.0.4" },
      }),
    ).toBe("8.8.8.8");
  });

  test("falls back to the socket IP when Express has no resolved IP", () => {
    expect(
      getClientIp({
        headers: { "x-forwarded-for": "203.0.113.10" },
        socket: { remoteAddress: "::ffff:8.8.8.8" },
      }),
    ).toBe("8.8.8.8");
  });

  test.each(["10.0.0.1", "100.96.0.1", "192.168.1.1", "203.0.113.5"])(
    "rejects non-public address %s",
    (ip) => {
      expect(isLocalOrPrivateIp(ip)).toBe(true);
    },
  );

  test("rejects malformed IP values", () => {
    expect(normalizeIp("forged-client-ip")).toBeNull();
  });

  test("does not treat a raw client-supplied IP header as the client IP", () => {
    expect(
      getClientIp({
        headers: { "x-real-ip": "8.8.8.8" },
        socket: {},
      }),
    ).toBeNull();
  });
});
