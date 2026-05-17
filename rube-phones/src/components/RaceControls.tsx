import { raceManager } from "../state/RaceManager";
import type { RaceStatus } from "../shared/types";

interface RaceControlsProps {
  status: RaceStatus;
  connected: boolean;
}

export function RaceControls({ status, connected }: RaceControlsProps) {
  return (
    <section className="race-controls" aria-label="Presenter controls">
      <button className="control-button primary" type="button" disabled={!connected || status === "running" || status === "countdown"} onClick={() => raceManager.startDemo()}>
        Start demo
      </button>
      <button className="control-button" type="button" disabled={!connected || status === "running" || status === "countdown"} onClick={() => raceManager.startCommands()}>
        Command mode
      </button>
      <button className="control-button danger" type="button" disabled={!connected} onClick={() => raceManager.reset()}>
        Reset
      </button>
    </section>
  );
}
