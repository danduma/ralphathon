import { AgentMachine } from "./AgentMachine";
import { ComparisonMeters } from "./ComparisonMeters";
import { FlameGauge } from "./FlameGauge";
import { useCalorimeterSnapshot } from "../hooks/useCalorimeterSnapshot";

export function CalorimeterStage() {
  const snapshot = useCalorimeterSnapshot();

  return (
    <div className="grid min-h-[520px] grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="relative min-h-[420px] overflow-hidden bg-[radial-gradient(circle_at_18%_8%,oklch(0.36_0.09_55/.35),transparent_34%),linear-gradient(145deg,oklch(0.18_0.015_70),oklch(0.12_0.012_76))] p-4 sm:p-5">
        <div className={`machine-bed ${snapshot.swarmResult && snapshot.simpleResult && snapshot.swarmResult.metrics.totalTokens / Math.max(snapshot.simpleResult.metrics.totalTokens, 1) > 6 ? "shake" : ""}`}>
          <AgentMachine />
        </div>
      </div>
      <aside className="grid border-t border-brass/20 bg-iron/70 lg:border-l lg:border-t-0">
        <FlameGauge />
        <ComparisonMeters />
      </aside>
    </div>
  );
}
