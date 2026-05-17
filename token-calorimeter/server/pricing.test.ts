import { describe, expect, it } from "vitest";
import { calculateCost, getModelPrice } from "./pricing";

describe("pricing", () => {
  it("calculates input and output costs per million tokens", () => {
    expect(calculateCost({ inputTokens: 1_000_000, outputTokens: 500_000 }, "gpt-4.1-mini")).toBeCloseTo(0.6);
  });

  it("falls back to the default model price when a model alias is unknown", () => {
    expect(getModelPrice("unknown-model")).toEqual(getModelPrice("gpt-4.1-mini"));
  });
});
