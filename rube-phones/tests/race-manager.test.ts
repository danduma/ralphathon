import { describe, expect, it } from "vitest";
import { RaceManager } from "../src/state/RaceManager";

describe("RaceManager subscriptions", () => {
  it("notifies only selectors whose value changes", () => {
    const manager = new RaceManager();
    let connectedCalls = 0;
    let errorsCalls = 0;

    manager.subscribe((state) => state.connected, () => {
      connectedCalls += 1;
    });
    manager.subscribe((state) => state.errors.length, () => {
      errorsCalls += 1;
    });

    (manager as unknown as { setState: (partial: { connected?: boolean; errors?: string[] }) => void }).setState({ connected: true });
    expect(connectedCalls).toBe(1);
    expect(errorsCalls).toBe(0);

    (manager as unknown as { setState: (partial: { connected?: boolean; errors?: string[] }) => void }).setState({ errors: ["bad"] });
    expect(connectedCalls).toBe(1);
    expect(errorsCalls).toBe(1);
  });
});
