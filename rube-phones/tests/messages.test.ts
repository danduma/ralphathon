/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest";
import { parseClientMessage, parseCommandLine } from "../server/messages";

describe("message validation", () => {
  it("accepts known client messages", () => {
    expect(parseClientMessage(JSON.stringify({ type: "client.hello", surface: "phone", hapticsSupport: "supported" }))).toMatchObject({
      type: "client.hello",
      surface: "phone"
    });
    expect(parseClientMessage(JSON.stringify({ type: "client.join_lane", laneId: "lane-1" }))).toEqual({
      type: "client.join_lane",
      laneId: "lane-1"
    });
  });

  it("rejects invalid client and command messages", () => {
    expect(() => parseClientMessage("{bad")).toThrow(/JSON/);
    expect(() => parseClientMessage(JSON.stringify({ type: "client.join_lane", laneId: "bogus" }))).toThrow(/laneId/);
    expect(() => parseCommandLine(JSON.stringify({ laneId: "lane-1", type: "made.up", label: "bad" }))).toThrow(/requires/);
  });

  it("parses valid command JSON lines", () => {
    expect(parseCommandLine(JSON.stringify({ laneId: "lane-3", type: "agent.failed", label: "boom", progressDelta: -2 }))).toEqual({
      laneId: "lane-3",
      type: "agent.failed",
      label: "boom",
      progressDelta: -2
    });
  });
});
