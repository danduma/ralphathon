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
        Run race
      </button>
      <button className="control-button" type="button" disabled={!connected || status === "running" || status === "countdown"} onClick={() => raceManager.startCommands()}>
        Live commands
      </button>
      <button className="control-button warning" type="button" disabled={!connected || status !== "finished"} onClick={() => raceManager.stopHaptics()}>
        Stop buzz
      </button>
      <button className="control-button danger" type="button" disabled={!connected} onClick={() => raceManager.reset()}>
        Clear board
      </button>
    </section>
  );
}
