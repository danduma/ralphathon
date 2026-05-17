import { beforeEach, describe, expect, it, vi } from "vitest";
import { HapticsManager } from "../src/state/HapticsManager";

describe("HapticsManager", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("reports unsupported when vibrate is missing and still pulses visually", () => {
    const manager = new HapticsManager();
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: undefined });
    expect(manager.probe()).toBe("unsupported");
    const result = manager.runPattern("tool");
    expect(result).toBe("unsupported");
    expect(manager.getSnapshot().visualPulseToken).toBe(1);
  });

  it("dispatches named patterns when supported", () => {
    const vibrate = vi.fn(() => true);
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: vibrate });
    const manager = new HapticsManager();
    expect(manager.runPattern("failure")).toBe("supported");
    expect(vibrate).toHaveBeenCalledWith([220, 80, 120, 80, 220]);
  });

  it("reports failed-call cases", () => {
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: vi.fn(() => false) });
    const manager = new HapticsManager();
    expect(manager.runPattern("start")).toBe("failed");
    expect(manager.getSnapshot().lastResult).toBe("failed");
  });
});
