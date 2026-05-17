export type AgentRole =
  | "planner"
  | "contextResearcher"
  | "toneAnalyst"
  | "riskReviewer"
  | "finalWriter"
  | "verifier"
  | "simpleWriter";

export type RunMode = "swarm" | "simple" | "simplified";

export type RunStatus = "idle" | "running" | "complete" | "simplifying" | "error";

export interface TokenMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  elapsedMs: number;
}

export interface AgentTrace {
  id: string;
  role: AgentRole;
  label: string;
  status: "queued" | "running" | "done" | "error";
  promptSummary: string;
  output: string;
  metrics: TokenMetrics;
  startedAt: number;
  endedAt?: number;
}

export interface RunResult {
  mode: RunMode;
  task: string;
  finalOutput: string;
  traces: AgentTrace[];
  metrics: TokenMetrics;
}

export interface SimplificationRecommendation {
  removedRoles: AgentRole[];
  reason: string;
  expectedSavingsPercent: number;
  recommendedWorkflow: string;
  removedReasons: Partial<Record<AgentRole, string>>;
}

export interface LastReceipt {
  task: string;
  swarmTokens: number;
  simpleTokens: number;
  wasteRatio: number;
  finalLine: string;
  savedAt: number;
}

export type WorkflowEvent =
  | { type: "run.started"; mode: RunMode }
  | {
      type: "agent.started";
      agent: Pick<AgentTrace, "id" | "role" | "label" | "promptSummary">;
    }
  | { type: "token"; agentId: string; text: string; estimatedTokens?: number }
  | { type: "agent.done"; agentId: string; metrics: TokenMetrics; output?: string }
  | { type: "recommendation"; recommendation: SimplificationRecommendation }
  | { type: "run.done"; result: RunResult; recommendation?: SimplificationRecommendation }
  | { type: "error"; message: string; details?: string };

export const emptyMetrics = (): TokenMetrics => ({
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  estimatedCostUsd: 0,
  elapsedMs: 0
});
