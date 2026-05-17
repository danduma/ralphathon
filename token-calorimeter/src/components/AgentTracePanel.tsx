import { ScrollText } from "lucide-react";
import { useCalorimeterSnapshot } from "../hooks/useCalorimeterSnapshot";
import type { AgentTrace } from "../shared/types";
import { formatCost, formatElapsed, formatTokens } from "../shared/formatters";

export function AgentTracePanel() {
  const snapshot = useCalorimeterSnapshot();
  const traces = [...snapshot.swarmTraces, ...snapshot.simpleTraces, ...snapshot.simplifiedTraces];

  return (
    <div className="surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-brass">
          <ScrollText size={15} /> Agent Trace
        </div>
        <span className="text-xs text-enamel/55">{traces.length || 0} stations</span>
      </div>
      {traces.length ? (
        <div className="trace-grid">
          {traces.map((trace) => (
            <TraceItem key={trace.id} trace={trace} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-line p-4 text-sm text-enamel/60">
          Ignite the task to watch each station write, burn, and hand off.
        </div>
      )}
    </div>
  );
}

function TraceItem({ trace }: { trace: AgentTrace }) {
  return (
    <article className={`trace-item ${trace.status}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold">{trace.label}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-enamel/58">{trace.promptSummary}</p>
        </div>
        <span className="rounded-sm bg-iron px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-brass">{trace.status}</span>
      </div>
      {trace.output ? <p className="mt-3 line-clamp-3 text-xs leading-5 text-enamel/74">{trace.output}</p> : null}
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-enamel/58">
        <span>{formatTokens(trace.metrics.totalTokens)} tok</span>
        <span>{formatCost(trace.metrics.estimatedCostUsd)}</span>
        <span>{formatElapsed(trace.metrics.elapsedMs)}</span>
      </div>
    </article>
  );
}
