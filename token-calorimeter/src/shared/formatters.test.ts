import { describe, expect, it } from "vitest";
import { formatCost, formatElapsed, formatRatio, formatTokens } from "./formatters";

describe("formatters", () => {
  it("formats token counts for small and large runs", () => {
    expect(formatTokens(950)).toBe("950");
    expect(formatTokens(12_420)).toBe("12.4k");
  });

  it("formats tiny model costs without hiding precision", () => {
    expect(formatCost(0.000042)).toBe("$0.00004");
    expect(formatCost(0.0234)).toBe("$0.023");
  });

  it("formats elapsed time as seconds when demo latency matters", () => {
    expect(formatElapsed(850)).toBe("0.9s");
    expect(formatElapsed(12_340)).toBe("12.3s");
  });

  it("formats waste ratios with a single decimal place", () => {
    expect(formatRatio(342, 114)).toBe("3.0x");
    expect(formatRatio(7, 0)).toBe("7.0x");
  });
});
