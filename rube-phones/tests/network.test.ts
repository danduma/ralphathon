/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";
import type { IncomingMessage } from "node:http";

describe("network join URLs", () => {
  it("builds phone links from LAN addresses instead of localhost", async () => {
    vi.doMock("node:os", () => ({
      networkInterfaces: () => ({
        en0: [
          {
            family: "IPv4",
            internal: false,
            address: "10.0.0.235"
          }
        ],
        lo0: [
          {
            family: "IPv4",
            internal: true,
            address: "127.0.0.1"
          }
        ]
      })
    }));

    const { buildJoinUrlResponse } = await import("../server/network");
    const response = buildJoinUrlResponse({ headers: { host: "localhost:8787" } } as IncomingMessage, "5175", "http:");

    expect(response.url).toBe("http://10.0.0.235:5175/phone");
    expect(response.url).not.toContain("localhost");
  });

  it("keeps the public hostname first for deployed domains", async () => {
    vi.resetModules();
    vi.doMock("node:os", () => ({
      networkInterfaces: () => ({
        docker0: [
          {
            family: "IPv4",
            internal: false,
            address: "10.0.1.1"
          }
        ]
      })
    }));

    const { buildJoinUrlResponse } = await import("../server/network");
    const response = buildJoinUrlResponse({ headers: { host: "rubephones.aiminions.xyz" } } as IncomingMessage, "", "https:");

    expect(response.url).toBe("https://rubephones.aiminions.xyz/phone");
    expect(response.urls[0]).toBe("https://rubephones.aiminions.xyz/phone");
  });
});
