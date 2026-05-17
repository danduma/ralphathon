import { AgentMachine } from "./AgentMachine";
import { ComparisonMeters } from "./ComparisonMeters";
import { FlameGauge } from "./FlameGauge";
import { useCalorimeterSnapshot } from "../hooks/useCalorimeterSnapshot";

export function CalorimeterStage() {
  const snapshot = useCalorimeterSnapshot();

  return (
    <div className="stage-grid grid min-h-[500px] grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_230px]">
      <div className="stage-room relative min-h-[420px] overflow-hidden p-4 sm:p-5">
        <div className={`machine-bed ${snapshot.swarmResult && snapshot.simpleResult && snapshot.swarmResult.metrics.totalTokens / Math.max(snapshot.simpleResult.metrics.totalTokens, 1) > 6 ? "shake" : ""}`}>
          <AgentMachine />
        </div>
      </div>
      <aside className="readout-rail grid border-t border-line bg-panel/72 lg:border-l lg:border-t-0">
        <FlameGauge />
        <ComparisonMeters />
      </aside>
    </div>
  );
}
