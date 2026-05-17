import { useCalorimeterSnapshot } from "../hooks/useCalorimeterSnapshot";
import { formatCost, formatElapsed, formatRatio, formatTokens } from "../shared/formatters";

export function ComparisonMeters() {
  const snapshot = useCalorimeterSnapshot();
  const swarm = snapshot.swarmResult?.metrics;
  const simple = snapshot.simpleResult?.metrics;
  const ratio = swarm && simple ? swarm.totalTokens / Math.max(simple.totalTokens, 1) : 0;

  return (
    <div className="grid gap-3 p-4">
      <Meter label="Waste ratio" value={ratio ? formatRatio(swarm?.totalTokens ?? 0, simple?.totalTokens ?? 0) : "warming"} percent={Math.min(100, ratio * 12)} />
      <Meter label="Swarm burn" value={swarm ? formatTokens(swarm.totalTokens) : "0"} percent={Math.min(100, ((swarm?.totalTokens ?? 0) / 900) * 100)} />
      <Meter label="Simple burn" value={simple ? formatTokens(simple.totalTokens) : "0"} percent={Math.min(100, ((simple?.totalTokens ?? 0) / 300) * 100)} />
      <div className="grid grid-cols-2 gap-2 text-xs text-enamel/65">
        <span>cost {formatCost(snapshot.aggregateMetrics.estimatedCostUsd)}</span>
        <span className="text-right">latency {formatElapsed(snapshot.aggregateMetrics.elapsedMs)}</span>
      </div>
    </div>
  );
}

function Meter({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="uppercase tracking-[0.14em] text-brass">{label}</span>
        <span className="font-semibold text-enamel">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-sm bg-soot/70">
        <div className="h-full rounded-sm bg-[linear-gradient(90deg,oklch(0.72_0.12_78),oklch(0.68_0.18_38))]" style={{ width: `${Math.max(4, percent)}%` }} />
      </div>
    </div>
  );
}
