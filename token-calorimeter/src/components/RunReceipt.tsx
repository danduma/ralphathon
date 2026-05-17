import { ReceiptText } from "lucide-react";
import { useCalorimeterSnapshot } from "../hooks/useCalorimeterSnapshot";
import { formatCost, formatElapsed, formatRatio, formatTokens } from "../shared/formatters";

export function RunReceipt() {
  const snapshot = useCalorimeterSnapshot();
  const swarm = snapshot.swarmResult;
  const simple = snapshot.simpleResult;
  const simplified = snapshot.simplifiedResult;

  return (
    <aside data-testid="receipt" className="surface receipt-panel min-h-[500px] p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-brass">
        <ReceiptText size={15} /> Receipt
      </div>
      <h2 className="mt-2 text-2xl font-black">Same answer. Smaller fire.</h2>

      {swarm && simple ? (
        <div className="mt-5 grid gap-4">
          <div className="grid gap-3">
            <OutputBlock title="Agent Swarm" output={swarm.finalOutput} hot />
            <OutputBlock title="Human-Sized Mode" output={simple.finalOutput} />
            {simplified ? <OutputBlock title="Simplified Rerun" output={simplified.finalOutput} /> : null}
          </div>

          <div className="receipt-grid">
            <ReceiptMetric label="tokens burned" value={`${formatTokens(swarm.metrics.totalTokens)} / ${formatTokens(simple.metrics.totalTokens)}`} />
            <ReceiptMetric label="estimated cost" value={`${formatCost(swarm.metrics.estimatedCostUsd)} / ${formatCost(simple.metrics.estimatedCostUsd)}`} />
            <ReceiptMetric label="latency" value={`${formatElapsed(swarm.metrics.elapsedMs)} / ${formatElapsed(simple.metrics.elapsedMs)}`} />
            <ReceiptMetric label="waste ratio" value={formatRatio(swarm.metrics.totalTokens, simple.metrics.totalTokens)} />
          </div>

          {snapshot.simplificationRecommendation ? (
            <div className="rounded-md border border-brass/25 bg-brass/10 p-3">
              <div className="text-sm font-bold text-brass">
                Removed {snapshot.simplificationRecommendation.removedRoles.length} agents, expected savings{" "}
                {snapshot.simplificationRecommendation.expectedSavingsPercent}%
              </div>
              <p className="mt-2 text-sm leading-6 text-enamel/76">{snapshot.simplificationRecommendation.reason}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {snapshot.simplificationRecommendation.removedRoles.map((role) => (
                  <span key={role} className="rounded-md border border-copper/35 bg-copper/10 px-2 py-1 text-xs text-copper">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="receipt-callout rounded-md bg-ember/10 p-4 text-center text-base font-black text-ember">
            Same message. Smaller fire.
          </div>
        </div>
      ) : (
        <div className="empty-receipt mt-8 grid gap-4 text-sm leading-6 text-enamel/68">
          <p>Ignite prints a side-by-side receipt for tokens, cost, and latency.</p>
          <div className="rounded-md border border-dashed border-line p-4">
            Waiting for a run.
          </div>
        </div>
      )}
    </aside>
  );
}

function OutputBlock({ title, output, hot = false }: { title: string; output: string; hot?: boolean }) {
  return (
    <div className={`output-block rounded-md border p-3 ${hot ? "border-copper/35 bg-copper/10" : "border-line bg-panel/58"}`}>
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-brass">{title}</div>
      <p className="mt-2 text-sm leading-6 text-enamel/82">{output}</p>
    </div>
  );
}

function ReceiptMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-tile rounded-md border border-line bg-soot/42 p-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-enamel/48">{label}</div>
      <div className="mt-1 text-base font-black">{value}</div>
    </div>
  );
}
