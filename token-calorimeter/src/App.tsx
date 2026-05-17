import { AlertTriangle, Flame, Gauge } from "lucide-react";
import { AgentTracePanel } from "./components/AgentTracePanel";
import { CalorimeterStage } from "./components/CalorimeterStage";
import { ErrorPanel } from "./components/ErrorPanel";
import { RunReceipt } from "./components/RunReceipt";
import { TaskConsole } from "./components/TaskConsole";
import { useCalorimeterSnapshot } from "./hooks/useCalorimeterSnapshot";

export function App() {
  const snapshot = useCalorimeterSnapshot();

  return (
    <main className="min-h-screen overflow-hidden bg-soot text-enamel">
      <div className="stage-noise" />
      <div className="mx-auto grid min-h-screen w-full max-w-[1680px] grid-cols-1 gap-4 px-3 py-3 sm:px-5 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-5 lg:px-6 lg:py-5">
        <section className="z-10 flex flex-col gap-4">
          <TaskConsole />
          {snapshot.latestError ? <ErrorPanel error={snapshot.latestError} /> : null}
          <div className="museum-panel hidden gap-3 p-4 lg:grid">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-brass">
              <Gauge size={15} /> Exhibit Notes
            </div>
            <p className="max-w-[65ch] text-sm leading-6 text-enamel/72">
              The swarm path is deliberately overbuilt. The human-sized path is the control sample: fewer steps, less heat,
              same practical output.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <span className="rounded-md border border-brass/25 bg-iron/60 px-2 py-2 text-xs">tokens</span>
              <span className="rounded-md border border-brass/25 bg-iron/60 px-2 py-2 text-xs">cost</span>
              <span className="rounded-md border border-brass/25 bg-iron/60 px-2 py-2 text-xs">latency</span>
            </div>
          </div>
        </section>

        <section className="z-10 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="museum-panel overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brass/20 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-copper">Live calorimetry</p>
                  <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold">
                    <Flame size={19} className="text-ember" /> Agent Swarm vs Human-Sized Mode
                  </h2>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-copper/40 bg-copper/10 px-3 py-2 text-xs text-copper">
                  <AlertTriangle size={14} /> compute heat is tokens, not carbon
                </div>
              </div>
              <CalorimeterStage />
            </div>
            <AgentTracePanel />
          </div>
          <RunReceipt />
        </section>
      </div>
    </main>
  );
}
