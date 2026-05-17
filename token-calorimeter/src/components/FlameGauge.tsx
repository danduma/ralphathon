import { Flame } from "lucide-react";
import { useCalorimeterSnapshot } from "../hooks/useCalorimeterSnapshot";
import { clamp, formatCost, formatElapsed, formatTokens } from "../shared/formatters";

export function FlameGauge() {
  const snapshot = useCalorimeterSnapshot();
  const resolvedTokens = snapshot.aggregateMetrics.totalTokens;
  const liveTokens = Math.max(resolvedTokens, snapshot.liveEstimatedTokens);
  const flameIntensity = clamp(liveTokens / 900, 0.08, 1);
  const wasteRatio =
    snapshot.swarmResult && snapshot.simpleResult
      ? snapshot.swarmResult.metrics.totalTokens / Math.max(snapshot.simpleResult.metrics.totalTokens, 1)
      : 1;
  const smoke = wasteRatio > 3 || flameIntensity > 0.68;

  return (
    <div className="grid place-items-center border-b border-line p-4">
      <div className="furnace-case relative flex h-[230px] w-full max-w-[178px] flex-col items-center justify-end rounded-md border border-copper/32 p-3 shadow-furnace">
        <div className="absolute left-3 top-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-copper">
          <Flame size={14} /> Furnace
        </div>
        {smoke ? <div className="smoke" /> : null}
        <div className="furnace-window">
          <div data-testid="flame-core" className="flame-core" style={{ height: `${flameIntensity * 100}%` }} />
          <div className="flame-lip" style={{ height: `${Math.max(20, flameIntensity * 80)}%` }} />
        </div>
      </div>

      <div className="mt-4 grid w-full grid-cols-1 gap-2 text-center sm:grid-cols-3 lg:grid-cols-1 2xl:grid-cols-3">
        <Metric label="tokens" value={formatTokens(liveTokens)} testId="token-counter" />
        <Metric label="cost" value={formatCost(snapshot.aggregateMetrics.estimatedCostUsd)} />
        <Metric label="time" value={formatElapsed(snapshot.aggregateMetrics.elapsedMs)} />
      </div>
    </div>
  );
}

function Metric({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="metric-tile rounded-md border border-line bg-soot/45 px-2 py-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-enamel/48">{label}</div>
      <div data-testid={testId} className="mt-1 text-sm font-bold text-enamel">
        {value}
      </div>
    </div>
  );
}
