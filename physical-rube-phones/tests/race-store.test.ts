/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest";
import { RaceStore } from "../server/RaceStore";

describe("RaceStore", () => {
  it("emits monotonic event ids", () => {
    const store = new RaceStore();
    const first = store.appendEvent({ laneId: "lane-1", type: "agent.started", label: "start", progressDelta: 10 });
    const second = store.appendEvent({ laneId: "lane-1", type: "agent.planned", label: "plan", progressDelta: 10 });

    expect(second.id).toBeGreaterThan(first.id);
    expect(store.getSnapshot().events.map((event) => event.id)).toEqual([1, 2, 3]);
  });

  it("binds phones to lanes and reset clears lane assignment", () => {
    const store = new RaceStore();
    store.connectPhone("phone-1", "phone", "test", "supported");
    const laneId = store.assignLane("phone-1", "lane-2");
    expect(laneId).toBe("lane-2");
    expect(store.getSnapshot().lanes.find((lane) => lane.id === "lane-2")?.assignedPhoneConnectionId).toBe("phone-1");

    store.reset();
    const snapshot = store.getSnapshot();
    expect(snapshot.lanes.every((lane) => lane.assignedPhoneConnectionId === undefined)).toBe(true);
    expect(snapshot.phones.find((phone) => phone.connectionId === "phone-1")?.laneId).toBeUndefined();
    expect(snapshot.session.status).toBe("lobby");
  });

  it("does not select a winner before verification passes", () => {
    const store = new RaceStore();
    store.appendEvent({ laneId: "lane-1", type: "agent.started", label: "start", progressDelta: 90 });
    store.appendEvent({ laneId: "lane-1", type: "agent.finished", label: "finish", progressDelta: 10 });
    store.appendEvent({ type: "race.finished", label: "done" });
    expect(store.getSnapshot().session.winnerLaneId).toBeUndefined();

    store.appendEvent({ laneId: "lane-2", type: "verification.passed", label: "verified", progressDelta: 95 });
    store.appendEvent({ laneId: "lane-2", type: "agent.finished", label: "finish", progressDelta: 10 });
    store.appendEvent({ type: "race.finished", label: "done" });
    expect(store.getSnapshot().session.winnerLaneId).toBe("lane-2");
  });
});
