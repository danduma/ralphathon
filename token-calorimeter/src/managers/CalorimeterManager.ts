import { readSseStream } from "../shared/sse";
import { taskPresets } from "../shared/presets";
import type {
  AgentTrace,
  LastReceipt,
  RunMode,
  RunResult,
  RunStatus,
  SimplificationRecommendation,
  TokenMetrics,
  WorkflowEvent
} from "../shared/types";
import { emptyMetrics } from "../shared/types";

export interface CalorimeterSnapshot {
  selectedPresetId: string;
  taskText: string;
  status: RunStatus;
  activeMode: RunMode | "comparison";
  swarmTraces: AgentTrace[];
  simpleTraces: AgentTrace[];
  simplifiedTraces: AgentTrace[];
  swarmResult?: RunResult;
  simpleResult?: RunResult;
  simplifiedResult?: RunResult;
  simplificationRecommendation?: SimplificationRecommendation;
  aggregateMetrics: TokenMetrics;
  liveEstimatedTokens: number;
  latestError?: { message: string; details?: string };
  lastSuccessfulReceipt?: LastReceipt;
}

const receiptKey = "token-calorimeter:last-receipt";

export class CalorimeterManager {
  private snapshot: CalorimeterSnapshot;
  private listeners = new Set<() => void>();
  private abortController?: AbortController;

  constructor() {
    const firstPreset = taskPresets[0];
    this.snapshot = {
      selectedPresetId: firstPreset.id,
      taskText: firstPreset.task,
      status: "idle",
      activeMode: "comparison",
      swarmTraces: [],
      simpleTraces: [],
      simplifiedTraces: [],
      aggregateMetrics: emptyMetrics(),
      liveEstimatedTokens: 0,
      lastSuccessfulReceipt: this.readReceipt()
    };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): CalorimeterSnapshot {
    return this.snapshot;
  }

  setTask(task: string): void {
    this.patch({ taskText: task, selectedPresetId: "custom" });
  }

  selectPreset(id: string): void {
    const preset = taskPresets.find((candidate) => candidate.id === id);
    if (!preset) return;
    this.patch({ selectedPresetId: id, taskText: preset.task });
  }

  async startComparisonRun(): Promise<void> {
    if (this.isBusy()) return;
    this.abortController = new AbortController();
    this.patch({
      status: "running",
      activeMode: "comparison",
      swarmTraces: [],
      simpleTraces: [],
      simplifiedTraces: [],
      swarmResult: undefined,
      simpleResult: undefined,
      simplifiedResult: undefined,
      simplificationRecommendation: undefined,
      aggregateMetrics: emptyMetrics(),
      liveEstimatedTokens: 0,
      latestError: undefined
    });

    try {
      await this.startSwarmRun();
      await this.startSimpleRun();
      this.finishIfComparisonReady();
    } catch (error) {
      this.fail(error);
    }
  }

  async startSwarmRun(): Promise<void> {
    await this.streamRun("/api/run/swarm", { task: this.snapshot.taskText });
  }

  async startSimpleRun(): Promise<void> {
    await this.streamRun("/api/run/simple", { task: this.snapshot.taskText });
  }

  async simplify(): Promise<void> {
    if (this.isBusy() || !this.snapshot.swarmResult) return;
    this.abortController = new AbortController();
    this.patch({ status: "simplifying", activeMode: "simplified", latestError: undefined, simplifiedTraces: [] });
    try {
      await this.streamRun("/api/run/simplify", {
        task: this.snapshot.taskText,
        swarmTrace: this.snapshot.swarmResult.traces
      });
      this.patch({ status: "complete" });
      this.persistReceipt();
    } catch (error) {
      this.fail(error);
    }
  }

  async retry(): Promise<void> {
    this.reset({ keepError: false });
    await this.startComparisonRun();
  }

  reset(options: { keepError?: boolean } = {}): void {
    this.abortController?.abort();
    this.patch({
      status: "idle",
      activeMode: "comparison",
      swarmTraces: [],
      simpleTraces: [],
      simplifiedTraces: [],
      swarmResult: undefined,
      simpleResult: undefined,
      simplifiedResult: undefined,
      simplificationRecommendation: undefined,
      aggregateMetrics: emptyMetrics(),
      liveEstimatedTokens: 0,
      latestError: options.keepError ? this.snapshot.latestError : undefined
    });
  }

  private async streamRun(endpoint: string, body: unknown): Promise<void> {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: this.abortController?.signal
    });
    let streamError: Error | undefined;
    await readSseStream(response, (event) => {
      if (event.type === "error") {
        streamError = new Error(event.message);
        (streamError as Error & { details?: string }).details = event.details;
      }
      this.applyEvent(event);
    });
    if (streamError) throw streamError;
  }

  private applyEvent(event: WorkflowEvent): void {
    if (event.type === "run.started") {
      this.patch({ activeMode: event.mode });
      return;
    }

    if (event.type === "agent.started") {
      const trace: AgentTrace = {
        id: event.agent.id,
        role: event.agent.role,
        label: event.agent.label,
        status: "running",
        promptSummary: event.agent.promptSummary,
        output: "",
        metrics: emptyMetrics(),
        startedAt: Date.now()
      };
      this.replaceTraces(event.agent.role === "simpleWriter" && this.snapshot.activeMode === "simplified" ? "simplified" : this.snapshot.activeMode, (traces) => [
        ...traces,
        trace
      ]);
      return;
    }

    if (event.type === "token") {
      this.updateTrace(event.agentId, (trace) => ({ ...trace, output: trace.output + event.text }));
      this.patch({ liveEstimatedTokens: this.snapshot.liveEstimatedTokens + (event.estimatedTokens ?? Math.max(1, Math.ceil(event.text.length / 4))) });
      return;
    }

    if (event.type === "agent.done") {
      this.updateTrace(event.agentId, (trace) => ({
        ...trace,
        status: "done",
        output: event.output ?? trace.output,
        metrics: event.metrics,
        endedAt: Date.now()
      }));
      this.recalculateAggregate();
      return;
    }

    if (event.type === "recommendation") {
      this.patch({ simplificationRecommendation: event.recommendation });
      return;
    }

    if (event.type === "run.done") {
      const key = `${event.result.mode}Result` as const;
      this.patch({
        [key]: event.result,
        simplificationRecommendation: event.recommendation ?? this.snapshot.simplificationRecommendation
      } as Partial<CalorimeterSnapshot>);
      this.recalculateAggregate();
      return;
    }

    if (event.type === "error") {
      this.patch({ status: "error", latestError: { message: event.message, details: event.details } });
    }
  }

  private finishIfComparisonReady(): void {
    if (this.snapshot.swarmResult && this.snapshot.simpleResult) {
      this.patch({ status: "complete", activeMode: "comparison" });
      this.persistReceipt();
    }
  }

  private replaceTraces(mode: RunMode | "comparison", recipe: (traces: AgentTrace[]) => AgentTrace[]): void {
    if (mode === "simple") this.patch({ simpleTraces: recipe(this.snapshot.simpleTraces) });
    else if (mode === "simplified") this.patch({ simplifiedTraces: recipe(this.snapshot.simplifiedTraces) });
    else this.patch({ swarmTraces: recipe(this.snapshot.swarmTraces) });
  }

  private updateTrace(agentId: string, recipe: (trace: AgentTrace) => AgentTrace): void {
    const update = (traces: AgentTrace[]) => traces.map((trace) => (trace.id === agentId ? recipe(trace) : trace));
    this.patch({
      swarmTraces: update(this.snapshot.swarmTraces),
      simpleTraces: update(this.snapshot.simpleTraces),
      simplifiedTraces: update(this.snapshot.simplifiedTraces)
    });
  }

  private recalculateAggregate(): void {
    const all = [...this.snapshot.swarmTraces, ...this.snapshot.simpleTraces, ...this.snapshot.simplifiedTraces];
    this.patch({
      aggregateMetrics: all.reduce<TokenMetrics>(
        (sum, trace) => ({
          inputTokens: sum.inputTokens + trace.metrics.inputTokens,
          outputTokens: sum.outputTokens + trace.metrics.outputTokens,
          totalTokens: sum.totalTokens + trace.metrics.totalTokens,
          estimatedCostUsd: sum.estimatedCostUsd + trace.metrics.estimatedCostUsd,
          elapsedMs: sum.elapsedMs + trace.metrics.elapsedMs
        }),
        emptyMetrics()
      )
    });
  }

  private persistReceipt(): void {
    if (typeof localStorage === "undefined") return;
    if (!this.snapshot.swarmResult || !this.snapshot.simpleResult) return;
    const receipt: LastReceipt = {
      task: this.snapshot.taskText,
      swarmTokens: this.snapshot.swarmResult.metrics.totalTokens,
      simpleTokens: this.snapshot.simpleResult.metrics.totalTokens,
      wasteRatio: this.snapshot.swarmResult.metrics.totalTokens / Math.max(this.snapshot.simpleResult.metrics.totalTokens, 1),
      finalLine: "Same message. Smaller fire.",
      savedAt: Date.now()
    };
    localStorage.setItem(receiptKey, JSON.stringify(receipt));
    this.patch({ lastSuccessfulReceipt: receipt });
  }

  private readReceipt(): LastReceipt | undefined {
    try {
      if (typeof localStorage === "undefined") return undefined;
      const raw = localStorage.getItem(receiptKey);
      return raw ? (JSON.parse(raw) as LastReceipt) : undefined;
    } catch {
      return undefined;
    }
  }

  private fail(error: unknown): void {
    if (error instanceof DOMException && error.name === "AbortError") return;
    const typed = error as Error & { details?: string };
    this.patch({
      status: "error",
      latestError: {
        message: typed.message || "The calorimeter stream failed.",
        details: typed.details
      }
    });
  }

  private isBusy(): boolean {
    return this.snapshot.status === "running" || this.snapshot.status === "simplifying";
  }

  private patch(patch: Partial<CalorimeterSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) listener();
  }
}

export const calorimeterManager = new CalorimeterManager();
