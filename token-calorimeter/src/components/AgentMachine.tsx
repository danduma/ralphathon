import { Check, Clock, Flame, Hammer, Search, ShieldCheck, SlidersHorizontal, Type, Zap } from "lucide-react";
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
  simpleWriter: Zap
};

const swarmOrder: AgentRole[] = ["planner", "contextResearcher", "toneAnalyst", "riskReviewer", "finalWriter", "verifier"];

export function AgentMachine() {
  const snapshot = useCalorimeterSnapshot();
  const traces = snapshot.swarmTraces;
  const simpleTrace = snapshot.simpleTraces[0] ?? snapshot.simplifiedTraces[0];

  return (
    <div className="relative h-full min-h-[390px]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 900 430" preserveAspectRatio="none" aria-hidden="true">
        <path className="pipe pipe-heavy" d="M54 95 C150 40 180 155 250 92 S375 46 430 110 S558 170 632 96 S760 38 846 104" />
        <path className="pipe pipe-simple" d="M72 328 C245 300 442 302 842 328" />
        <path className="pipe pipe-drop" d="M846 104 C875 152 878 244 846 328" />
      </svg>

      <TokenParticleLayer />

      <div className="machine-label left-4 top-3 border-copper/40 bg-copper/15 text-copper">
        Agent Swarm
      </div>
      <div className="machine-label human-mode-label left-4 border-brass/35 bg-brass/10 text-brass">
        Human-Sized Mode
      </div>

      <div className="swarm-grid">
        {swarmOrder.map((role, index) => (
          <Station key={role} role={role} trace={traces.find((trace) => trace.role === role)} index={index} />
        ))}
      </div>

      <div className="simple-rail">
        <Station role="simpleWriter" trace={simpleTrace} index={0} compact />
        <div className="direct-label">one direct call</div>
      </div>

      <div className="furnace-mouth">
        <Flame size={20} />
        furnace intake
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
    simpleWriter: "Simple Writer"
  }[role];
}
