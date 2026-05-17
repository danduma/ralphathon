import { AlertTriangle, Flame } from "lucide-react";
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
      <div className="mx-auto grid min-h-screen w-full max-w-[1540px] grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-4 lg:py-6">
        <section className="z-10 flex min-w-0 flex-col gap-4">
          <TaskConsole />
          {snapshot.latestError ? <ErrorPanel error={snapshot.latestError} /> : null}
        </section>

        <section className="z-10 grid min-w-0 grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="surface overflow-hidden p-0">
              <div className="stage-header flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="eyebrow text-copper">Live comparison</p>
                  <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold text-enamel">
                    <Flame size={19} className="text-ember" /> Swarm vs direct call
                  </h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-md border border-copper/25 bg-copper/10 px-3 py-2 text-xs font-semibold text-copper">
                  <AlertTriangle size={14} /> Heat means tokens, cost, and time
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
