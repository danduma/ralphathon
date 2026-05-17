import { describe, expect, it } from "vitest";
import { runSimpleWorkflow, runSimplifyWorkflow, runSwarmWorkflow } from "./agentWorkflow";
import type { ModelClient } from "./openaiClient";
import type { WorkflowEvent } from "./types";

function testClient(): ModelClient {
  return {
    async *streamCompletion({ role }) {
      yield { type: "chunk", text: `${role} chunk ` };
      if (role === "simplifier") {
        yield {
          type: "done",
          usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
          output:
            '{"removedRoles":["planner","contextResearcher","riskReviewer","verifier"],"reason":"The task is low-risk and direct.","expectedSavingsPercent":68,"recommendedWorkflow":"One direct model call.","removedReasons":{"planner":"The task is already one step."}}'
        };
        return;
      }
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

  it("streams simplify recommendation before the simplified run", async () => {
    const events: WorkflowEvent[] = [];
    const result = await runSimplifyWorkflow("tell my friend I am late", [], testClient(), (event) => events.push(event));

    expect(events.some((event) => event.type === "recommendation")).toBe(true);
    expect(events.some((event) => event.type === "run.started" && event.mode === "simplified")).toBe(true);
    expect(events.some((event) => event.type === "token")).toBe(true);
    expect(events.at(-1)).toMatchObject({ type: "run.done", recommendation: result.recommendation });
    expect(result.recommendation.removedRoles).toContain("planner");
  });

  it("rejects malformed simplifier output with raw output details", async () => {
    const malformedClient: ModelClient = {
      async *streamCompletion({ role }) {
        yield { type: "chunk", text: role === "simplifier" ? "Planner was probably too much." : "simple chunk " };
        yield {
          type: "done",
          usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
          output: role === "simplifier" ? "Planner was probably too much." : "simple output"
        };
      }
    };

    await expect(runSimplifyWorkflow("tell my friend I am late", [], malformedClient, () => {})).rejects.toMatchObject({
      message: "The simplifier returned malformed recommendation JSON.",
      details: expect.stringContaining("Planner was probably too much.")
    });
  });
});
