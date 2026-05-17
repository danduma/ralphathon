import { describe, expect, it } from "vitest";
import { runSimpleWorkflow, runSwarmWorkflow } from "./agentWorkflow";
import type { ModelClient } from "./openaiClient";
import type { WorkflowEvent } from "./types";

function testClient(): ModelClient {
  return {
    async *streamCompletion({ role }) {
      yield { type: "chunk", text: `${role} chunk ` };
      yield {
        type: "done",
        usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
        output: `${role} output`
      };
    }
  };
}

describe("agent workflow", () => {
  it("emits ordered swarm events and sums agent tokens", async () => {
    const events: WorkflowEvent[] = [];
    const result = await runSwarmWorkflow("tell my friend I am late", testClient(), (event) => events.push(event));

    expect(events[0]).toMatchObject({ type: "run.started", mode: "swarm" });
    expect(events.filter((event) => event.type === "agent.started")).toHaveLength(6);
    expect(events.filter((event) => event.type === "agent.done")).toHaveLength(6);
    expect(events.at(-1)).toMatchObject({ type: "run.done" });
    expect(result.metrics.totalTokens).toBe(90);
  });

  it("runs simple mode as one model call", async () => {
    const events: WorkflowEvent[] = [];
    const result = await runSimpleWorkflow("tell my friend I am late", testClient(), (event) => events.push(event));

    expect(events.filter((event) => event.type === "agent.started")).toHaveLength(1);
    expect(result.traces).toHaveLength(1);
    expect(result.metrics.totalTokens).toBe(15);
  });
});
