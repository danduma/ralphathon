/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";
import { DemoConductor } from "../server/DemoConductor";
import { RaceStore } from "../server/RaceStore";
import type { DemoScriptStep, RaceEventType } from "../src/shared/types";

describe("DemoConductor", () => {
  it("emits failure, recovery, verification pass, finish in order", () => {
    vi.useFakeTimers();
    const script: DemoScriptStep[] = [
      { delayMs: 5, laneId: "lane-3", type: "agent.failed", label: "fail", progressDelta: -1 },
      { delayMs: 5, laneId: "lane-3", type: "agent.recovered", label: "recover", progressDelta: 5 },
      { delayMs: 5, laneId: "lane-3", type: "verification.failed", label: "retry", progressDelta: -1 },
      { delayMs: 5, laneId: "lane-3", type: "verification.passed", label: "pass", progressDelta: 90 },
      { delayMs: 5, laneId: "lane-3", type: "agent.finished", label: "finish", progressDelta: 10 },
      { delayMs: 5, type: "race.finished", label: "race", progressDelta: 0 }
    ];
    const store = new RaceStore();
    new DemoConductor(store, script).start();

    vi.advanceTimersByTime(40);
    const types = store.getSnapshot().events.map((event) => event.type);
    const expected: RaceEventType[] = ["agent.failed", "agent.recovered", "verification.failed", "verification.passed", "agent.finished", "race.finished"];
    expect(types.filter((type) => expected.includes(type))).toEqual(expected);
    expect(store.getSnapshot().session.winnerLaneId).toBe("lane-3");
    vi.useRealTimers();
  });
});
