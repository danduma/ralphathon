import { calculateCost } from "./pricing";
import type {
  AgentRole,
  AgentTrace,
  RunMode,
  RunResult,
  SimplificationRecommendation,
  TokenMetrics,
  WorkflowEvent
} from "./types";
import type { ModelClient } from "./openaiClient";

type Emit = (event: WorkflowEvent) => void;

const roles: Array<{ role: AgentRole; label: string; promptSummary: string; systemPrompt: string }> = [
  {
    role: "planner",
    label: "Planner",
    promptSummary: "Turns a tiny task into a suspiciously formal plan.",
    systemPrompt: "You are the Planner in an intentionally overbuilt agent workflow. Produce a compact plan, but over-plan slightly."
  },
  {
    role: "contextResearcher",
    label: "Context Researcher",
    promptSummary: "Infers context without browsing.",
    systemPrompt: "Infer context from the task. Do not browse. State assumptions and likely user intent."
  },
  {
    role: "toneAnalyst",
    label: "Tone Analyst",
    promptSummary: "Analyzes emotional stakes and tone.",
    systemPrompt: "Choose tone, audience sensitivity, emotional stakes, and ideal brevity."
  },
  {
    role: "riskReviewer",
    label: "Risk Reviewer",
    promptSummary: "Finds tiny risks in an ordinary message.",
    systemPrompt: "Identify risks in the draft: too cold, too long, too apologetic, unclear, or too formal."
  },
  {
    role: "finalWriter",
    label: "Final Writer",
    promptSummary: "Writes the actual useful answer.",
    systemPrompt: "Produce the actual answer to the user's tiny task. Be concise and natural."
  },
  {
    role: "verifier",
    label: "Verifier",
    promptSummary: "Checks the final line against the original task.",
    systemPrompt: "Verify whether the answer satisfies the task. Suggest only tiny corrections if needed."
  }
];

const simpleRole = {
  role: "simpleWriter" as const,
  label: "Simple Writer",
  promptSummary: "Answers directly in one human-sized step.",
  systemPrompt: "Complete the user's tiny task directly. Be concise, natural, and human."
};

export async function runSwarmWorkflow(task: string, client: ModelClient, emit: Emit): Promise<RunResult> {
  emit({ type: "run.started", mode: "swarm" });
  const traces: AgentTrace[] = [];
  let workingContext = "";

  for (const role of roles) {
    const result = await runAgent("swarm", role, task, workingContext, client, emit);
    traces.push(result);
    workingContext += `\n\n${role.label}: ${result.output}`;
  }

  const finalWriter = traces.find((trace) => trace.role === "finalWriter")?.output ?? "";
  const verifier = traces.find((trace) => trace.role === "verifier")?.output ?? "";
  const finalOutput = composeSwarmAnswer(finalWriter, verifier);
  const result = { mode: "swarm" as const, task, finalOutput, traces, metrics: sumMetrics(traces) };
  emit({ type: "run.done", result });
  console.info("[token-calorimeter] swarm complete", {
    totalTokens: result.metrics.totalTokens,
    cost: result.metrics.estimatedCostUsd
  });
  return result;
}

export async function runSimpleWorkflow(
  task: string,
  client: ModelClient,
  emit: Emit,
  mode: RunMode = "simple"
): Promise<RunResult> {
  emit({ type: "run.started", mode });
  const trace = await runAgent(mode, simpleRole, task, "", client, emit);
  const result = { mode, task, finalOutput: trace.output, traces: [trace], metrics: sumMetrics([trace]) };
  emit({ type: "run.done", result });
  console.info("[token-calorimeter] simple complete", {
    mode,
    totalTokens: result.metrics.totalTokens,
    cost: result.metrics.estimatedCostUsd
  });
  return result;
}

export async function runSimplifyWorkflow(
  task: string,
  swarmTrace: AgentTrace[],
  client: ModelClient,
  emit: Emit
): Promise<{ recommendation: SimplificationRecommendation; result: RunResult }> {
  const recommendation = makeRecommendation(swarmTrace);
  emit({ type: "recommendation", recommendation });
  const result = await runSimpleWorkflow(task, client, emit, "simplified");
  return { recommendation, result };
}

async function runAgent(
  mode: RunMode,
  roleConfig: { role: AgentRole; label: string; promptSummary: string; systemPrompt: string },
  task: string,
  context: string,
  client: ModelClient,
  emit: Emit
): Promise<AgentTrace> {
  const id = `${roleConfig.role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const startedAt = Date.now();
  emit({
    type: "agent.started",
    agent: {
      id,
      role: roleConfig.role,
      label: roleConfig.label,
      promptSummary: roleConfig.promptSummary
    }
  });

  let output = "";
  let metrics: TokenMetrics = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
    elapsedMs: 0
  };

  const userPrompt = `${context ? `Previous agent notes:\n${context}\n\n` : ""}Task: ${task}`;
  for await (const event of client.streamCompletion({ ...roleConfig, userPrompt })) {
    if (event.type === "chunk") {
      output += event.text;
      // Live animation is estimated until final usage metadata arrives from the model stream.
      emit({ type: "token", agentId: id, text: event.text, estimatedTokens: Math.max(1, Math.ceil(event.text.length / 4)) });
    } else {
      output = event.output || output;
      metrics = {
        inputTokens: event.usage.inputTokens,
        outputTokens: event.usage.outputTokens,
        totalTokens: event.usage.totalTokens,
        estimatedCostUsd: calculateCost(event.usage, process.env.OPENAI_MODEL || "gpt-4.1-mini"),
        elapsedMs: Date.now() - startedAt
      };
    }
  }

  const trace: AgentTrace = {
    id,
    role: roleConfig.role,
    label: roleConfig.label,
    status: "done",
    promptSummary: roleConfig.promptSummary,
    output,
    metrics,
    startedAt,
    endedAt: Date.now()
  };
  emit({ type: "agent.done", agentId: id, metrics, output });
  return trace;
}

export function sumMetrics(traces: AgentTrace[]): TokenMetrics {
  return traces.reduce<TokenMetrics>(
    (sum, trace) => ({
      inputTokens: sum.inputTokens + trace.metrics.inputTokens,
      outputTokens: sum.outputTokens + trace.metrics.outputTokens,
      totalTokens: sum.totalTokens + trace.metrics.totalTokens,
      estimatedCostUsd: sum.estimatedCostUsd + trace.metrics.estimatedCostUsd,
      elapsedMs: sum.elapsedMs + trace.metrics.elapsedMs
    }),
    { inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0, elapsedMs: 0 }
  );
}

function composeSwarmAnswer(finalWriter: string, verifier: string): string {
  const finalLine = finalWriter.split("\n").find((line) => line.trim().length > 0)?.trim() || finalWriter.trim();
  if (!verifier.toLowerCase().includes("correction")) return finalLine;
  return finalLine;
}

function makeRecommendation(swarmTrace: AgentTrace[]): SimplificationRecommendation {
  const removedRoles: AgentRole[] = ["planner", "contextResearcher", "riskReviewer", "verifier"];
  const swarmTokens = sumMetrics(swarmTrace).totalTokens;
  const keptTokens = swarmTrace
    .filter((trace) => !removedRoles.includes(trace.role))
    .reduce((sum, trace) => sum + trace.metrics.totalTokens, 0);
  const expectedSavingsPercent = Math.max(35, Math.round((1 - keptTokens / Math.max(swarmTokens, 1)) * 100));
  return {
    removedRoles,
    expectedSavingsPercent,
    recommendedWorkflow: "One direct model call with a concise human tone instruction.",
    reason:
      "The task has low ambiguity, low risk, and no external dependency. The useful work is the final sentence, not the ceremony around it.",
    removedReasons: {
      planner: "The task is already one step.",
      contextResearcher: "The needed context is inside the sentence.",
      riskReviewer: "The social risk is low and obvious.",
      verifier: "A direct concise response is easy to inspect."
    }
  };
}
