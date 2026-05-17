/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest";
import { CommandRunner } from "../server/CommandRunner";
import { RaceStore } from "../server/RaceStore";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("CommandRunner", () => {
  it("maps valid JSON lines and surfaces malformed lines", async () => {
    const store = new RaceStore();
    const runner = new CommandRunner(store, {
      timeoutMs: 2_000,
      commands: [
        {
          laneId: "lane-1",
          command: process.execPath,
          args: [
            "-e",
            "console.log(JSON.stringify({laneId:'lane-1',type:'agent.started',label:'from command',progressDelta:12})); console.log('not-json');"
          ]
        }
      ]
    });

    runner.start();
    await wait(250);
    runner.stop();
    const types = store.getSnapshot().events.map((event) => event.type);
    expect(types).toContain("agent.started");
    expect(types).toContain("error.surfaced");
  });
});
