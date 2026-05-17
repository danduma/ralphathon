import { calculateCost } from "./pricing";
import { z } from "zod";
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

const simplifierRole = {
  role: "simplifier" as const,
  label: "Simplifier",
  promptSummary: "Identifies unnecessary ceremony in the swarm trace.",
  systemPrompt:
    "You are the Token Calorimeter simplifier. Return only compact JSON with removedRoles, reason, expectedSavingsPercent, recommendedWorkflow, and removedReasons. Use only these removable roles: planner, contextResearcher, toneAnalyst, riskReviewer, finalWriter, verifier. Do not include markdown."
};

const removableRoles = ["planner", "contextResearcher", "toneAnalyst", "riskReviewer", "finalWriter", "verifier"] as const;

const recommendationSchema = z.object({
  removedRoles: z.array(z.enum(removableRoles)).min(1),
  reason: z.string().trim().min(1),
  expectedSavingsPercent: z.number().min(0).max(100),
  recommendedWorkflow: z.string().trim().min(1),
  removedReasons: z.partialRecord(z.enum(removableRoles), z.string().trim().min(1)).default({})
});

class MalformedRecommendationError extends Error {
  details: string;

  constructor(rawOutput: string, cause: unknown) {
    super("The simplifier returned malformed recommendation JSON.");
    this.name = "MalformedRecommendationError";
    this.cause = cause;
    this.details = `Raw simplifier output:\n${rawOutput || "(empty output)"}`;
  }
}

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
  mode: RunMode = "simple",
  recommendation?: SimplificationRecommendation
): Promise<RunResult> {
  emit({ type: "run.started", mode });
  const trace = await runAgent(mode, simpleRole, task, "", client, emit);
  const result = { mode, task, finalOutput: trace.output, traces: [trace], metrics: sumMetrics([trace]) };
  emit({ type: "run.done", result, recommendation });
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
  const recommendation = await requestRecommendation(task, swarmTrace, client, emit);
  emit({ type: "recommendation", recommendation });
  const result = await runSimpleWorkflow(task, client, emit, "simplified", recommendation);
  return { recommendation, result };
}

async function requestRecommendation(
  task: string,
  swarmTrace: AgentTrace[],
  client: ModelClient,
  emit: Emit
): Promise<SimplificationRecommendation> {
  const compactTrace = swarmTrace.map((trace) => ({
    role: trace.role,
    label: trace.label,
    tokens: trace.metrics.totalTokens,
    output: trace.output.slice(0, 700)
  }));
  const trace = await runAgent(
    "simplified",
    simplifierRole,
    task,
    `Swarm trace JSON:\n${JSON.stringify(compactTrace)}`,
    client,
    emit
  );
  try {
    return recommendationSchema.parse(JSON.parse(extractJson(trace.output)));
  } catch (error) {
    throw new MalformedRecommendationError(trace.output, error);
  }
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
        estimatedCostUsd: calculateCost(event.usage, client.model || process.env.OPENAI_MODEL || "gpt-4.1-mini"),
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

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced?.[1]?.trim() ?? trimmed;
}
