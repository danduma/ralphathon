import { Flame, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { calorimeterManager } from "../managers/CalorimeterManager";
import { taskPresets } from "../shared/presets";
import { useCalorimeterSnapshot } from "../hooks/useCalorimeterSnapshot";

export function TaskConsole() {
  const snapshot = useCalorimeterSnapshot();
  const busy = snapshot.status === "running" || snapshot.status === "simplifying";
  const canSimplify = snapshot.status === "complete" && !!snapshot.swarmResult && !!snapshot.simpleResult;

  return (
    <div className="museum-panel p-4 sm:p-5">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.24em] text-brass">Science museum for agent taste</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-enamel sm:text-4xl">The Token Calorimeter</h1>
        <p className="mt-3 max-w-[48ch] text-sm leading-6 text-enamel/78">
          A tiny task enters. A furnace of agents wakes up.
        </p>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-brass">Preset tasks</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {taskPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`preset-button ${snapshot.selectedPresetId === preset.id ? "is-selected" : ""}`}
              disabled={busy}
              onClick={() => calorimeterManager.selectPreset(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <label htmlFor="custom-task" className="text-xs font-semibold uppercase tracking-[0.16em] text-brass">
          Custom task
        </label>
        <textarea
          id="custom-task"
          className="task-input"
          rows={4}
          value={snapshot.taskText}
          disabled={busy}
          onChange={(event) => calorimeterManager.setTask(event.target.value)}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="control-button primary col-span-2"
          disabled={busy || !snapshot.taskText.trim()}
          onClick={() => void calorimeterManager.startComparisonRun()}
        >
          <Flame size={17} /> {snapshot.status === "running" ? "Burning" : "Ignite"}
        </button>
        <button
          type="button"
          className="control-button"
          disabled={!canSimplify || busy}
          onClick={() => void calorimeterManager.simplify()}
        >
          <Wand2 size={16} /> {snapshot.status === "simplifying" ? "Simplifying" : "Simplify"}
        </button>
        <button
          type="button"
          className="control-button"
          disabled={busy}
          onClick={() => calorimeterManager.reset()}
        >
          <RotateCcw size={16} /> Reset
        </button>
        {snapshot.status === "error" ? (
          <button type="button" className="control-button primary col-span-2" onClick={() => void calorimeterManager.retry()}>
            <Sparkles size={16} /> Retry
          </button>
        ) : null}
      </div>

      {snapshot.lastSuccessfulReceipt ? (
        <div className="mt-4 rounded-md border border-brass/25 bg-iron/55 p-3 text-xs leading-5 text-enamel/70">
          Last receipt: {snapshot.lastSuccessfulReceipt.swarmTokens} swarm tokens vs{" "}
          {snapshot.lastSuccessfulReceipt.simpleTokens} simple tokens.
        </div>
      ) : null}
    </div>
  );
}
