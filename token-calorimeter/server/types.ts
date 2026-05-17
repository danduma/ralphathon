export type {
  AgentRole,
  AgentTrace,
  RunMode,
  RunResult,
  SimplificationRecommendation,
  TokenMetrics,
  WorkflowEvent
} from "../src/shared/types";

export interface CompletionChunk {
  type: "chunk";
  text: string;
}

export interface CompletionDone {
  type: "done";
  output: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export type CompletionEvent = CompletionChunk | CompletionDone;
