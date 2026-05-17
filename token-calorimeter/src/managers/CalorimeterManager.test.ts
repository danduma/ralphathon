import { beforeEach, describe, expect, it, vi } from "vitest";
import { CalorimeterManager } from "./CalorimeterManager";

const encoder = new TextEncoder();

function stream(events: unknown[]) {
  const payload = events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("");
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(payload));
      controller.close();
    }
  });
}

describe("CalorimeterManager", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("selects presets and updates task text", () => {
    const manager = new CalorimeterManager();
    manager.selectPreset("late-friend");
    expect(manager.getSnapshot().taskText).toContain("10 minutes late");
    manager.setTask("custom tiny task");
    expect(manager.getSnapshot().selectedPresetId).toBe("custom");
  });

  it("runs comparison lifecycle from SSE events and stores receipt", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(stream([
        { type: "run.started", mode: "swarm" },
        { type: "agent.started", agent: { id: "planner-1", role: "planner", label: "Planner", promptSummary: "plan" } },
        { type: "token", agentId: "planner-1", text: "hello " },
        { type: "agent.done", agentId: "planner-1", metrics: { inputTokens: 2, outputTokens: 3, totalTokens: 5, estimatedCostUsd: 0.00001, elapsedMs: 20 } },
        { type: "run.done", result: { mode: "swarm", task: "x", finalOutput: "hello", traces: [], metrics: { inputTokens: 2, outputTokens: 3, totalTokens: 5, estimatedCostUsd: 0.00001, elapsedMs: 20 } } }
      ]), { status: 200, headers: { "Content-Type": "text/event-stream" } }))
      .mockResolvedValueOnce(new Response(stream([
        { type: "run.started", mode: "simple" },
        { type: "agent.started", agent: { id: "simpleWriter-1", role: "simpleWriter", label: "Simple Writer", promptSummary: "direct" } },
        { type: "token", agentId: "simpleWriter-1", text: "hi " },
        { type: "run.done", result: { mode: "simple", task: "x", finalOutput: "hi", traces: [], metrics: { inputTokens: 1, outputTokens: 1, totalTokens: 2, estimatedCostUsd: 0.000004, elapsedMs: 10 } } }
      ]), { status: 200, headers: { "Content-Type": "text/event-stream" } })));

    const manager = new CalorimeterManager();
    manager.setTask("x");
    await manager.startComparisonRun();

    expect(manager.getSnapshot().status).toBe("complete");
    expect(manager.getSnapshot().swarmResult?.metrics.totalTokens).toBe(5);
    expect(manager.getSnapshot().simpleResult?.metrics.totalTokens).toBe(2);
    expect(JSON.parse(localStorage.getItem("token-calorimeter:last-receipt") ?? "{}").wasteRatio).toBe(2.5);
  });

  it("surfaces stream errors and can reset current run", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(stream([
      { type: "error", message: "Missing OPENAI_API_KEY", details: "Set server env" }
    ]), { status: 200, headers: { "Content-Type": "text/event-stream" } })));

    const manager = new CalorimeterManager();
    await manager.startComparisonRun();
    expect(manager.getSnapshot().status).toBe("error");
    expect(manager.getSnapshot().latestError?.message).toContain("Missing");
    manager.reset();
    expect(manager.getSnapshot().status).toBe("idle");
    expect(manager.getSnapshot().swarmResult).toBeUndefined();
  });
});
