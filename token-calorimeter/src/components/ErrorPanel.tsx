import { AlertTriangle } from "lucide-react";
import { calorimeterManager } from "../managers/CalorimeterManager";

export function ErrorPanel({ error }: { error: { message: string; details?: string } }) {
  return (
    <div className="rounded-md border border-red-400/40 bg-red-950/35 p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-red-200">
        <AlertTriangle size={16} /> Stream interrupted
      </div>
      <p className="mt-2 text-sm leading-6 text-red-100/82">{error.message}</p>
      {error.details ? (
        <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap rounded-md bg-soot/70 p-3 text-xs text-red-100/72">
          {error.details}
        </pre>
      ) : null}
      <div className="mt-3 flex gap-2">
        <button type="button" className="control-button primary" onClick={() => void calorimeterManager.retry()}>
          Retry
        </button>
        <button type="button" className="control-button" onClick={() => calorimeterManager.reset()}>
          Reset
        </button>
      </div>
    </div>
  );
}
