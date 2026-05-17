import { Check, Clock, Flame, Hammer, Search, ShieldCheck, SlidersHorizontal, Sparkles, Type, Zap } from "lucide-react";
import type { CSSProperties } from "react";
import type { AgentRole, AgentTrace } from "../shared/types";
import { useCalorimeterSnapshot } from "../hooks/useCalorimeterSnapshot";
import { TokenParticleLayer } from "./TokenParticleLayer";

const roleIcons: Record<AgentRole, typeof Clock> = {
  planner: SlidersHorizontal,
  contextResearcher: Search,
  toneAnalyst: Type,
  riskReviewer: ShieldCheck,
  finalWriter: Hammer,
  verifier: Check,
  simplifier: Sparkles,
  simpleWriter: Zap
};

const swarmOrder: AgentRole[] = ["planner", "contextResearcher", "toneAnalyst", "riskReviewer", "finalWriter", "verifier"];

export function AgentMachine() {
  const snapshot = useCalorimeterSnapshot();
  const traces = snapshot.swarmTraces;
  const simpleTrace = snapshot.simpleTraces[0] ?? snapshot.simplifiedTraces[0];

  return (
    <div className="relative grid h-full min-h-[390px] content-between gap-4">
      <TokenParticleLayer />

      <div className="machine-copy">
        <div>
          <p className="eyebrow text-copper">Overbuilt path</p>
          <h3>Six agents trade context before writing.</h3>
        </div>
        <div className="furnace-mouth">
          <Flame size={17} />
          furnace intake
        </div>
      </div>

      <div className="machine-lane swarm-lane">
        <div className="lane-meta">
          <span>Agent swarm</span>
          <strong>{traces.filter((trace) => trace.status === "done").length}/{swarmOrder.length}</strong>
        </div>
        <div className="swarm-grid">
          {swarmOrder.map((role, index) => (
            <Station key={role} role={role} trace={traces.find((trace) => trace.role === role)} index={index} />
          ))}
        </div>
      </div>

      <div className="machine-lane simple-lane">
        <div className="lane-meta">
          <span>Direct call</span>
          <strong>{simpleTrace?.status ?? "queued"}</strong>
        </div>
        <div className="simple-rail">
          <Station role="simpleWriter" trace={simpleTrace} index={0} compact />
          <div className="direct-label">same practical output, fewer handoffs</div>
        </div>
      </div>
    </div>
  );
}

function Station({ role, trace, index, compact = false }: { role: AgentRole; trace?: AgentTrace; index: number; compact?: boolean }) {
  const Icon = roleIcons[role];
  const status = trace?.status ?? "queued";

  return (
    <div className={`station ${status} ${compact ? "compact" : ""}`} style={{ "--station-delay": `${index * 80}ms` } as CSSProperties}>
      <div className="station-icon">
        <Icon size={compact ? 16 : 18} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{labelForRole(role)}</div>
        <div className="truncate text-[11px] text-enamel/58">{trace?.metrics.totalTokens ? `${trace.metrics.totalTokens} tokens` : trace?.promptSummary ?? "queued"}</div>
      </div>
      <span className="gate-light" />
    </div>
  );
}

function labelForRole(role: AgentRole): string {
  return {
    planner: "Planner",
    contextResearcher: "Context Researcher",
    toneAnalyst: "Tone Analyst",
    riskReviewer: "Risk Reviewer",
    finalWriter: "Final Writer",
    verifier: "Verifier",
    simplifier: "Simplifier",
    simpleWriter: "Simple Writer"
  }[role];
}
