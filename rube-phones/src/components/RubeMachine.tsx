import type { CSSProperties } from "react";
import { stageDefinitions } from "../shared/raceConfig";
import type { Lane, LaneId } from "../shared/types";

interface RubeMachineProps {
  lanes: Lane[];
  winnerLaneId?: LaneId;
}

export function RubeMachine({ lanes, winnerLaneId }: RubeMachineProps) {
  return (
    <section className="machine" aria-label="Four lane Rube Goldberg race machine">
      <div className="finish-column">
        <span>Verify</span>
        <strong>Finish</strong>
      </div>
      {lanes.map((lane) => {
        const activeStage = stageDefinitions.find((stage) => stage.id === lane.currentStage) ?? stageDefinitions[0];
        const progress = Math.round(lane.progress);
        return (
          <article className={`machine-lane ${winnerLaneId === lane.id ? "winner" : ""} ${lane.verificationStatus}`} key={lane.id} style={{ "--lane-color": lane.color, "--lane-accent": lane.accent } as CSSProperties}>
            <div className="lane-meta">
              <strong>{lane.label}</strong>
              <span>{activeStage.label}</span>
            </div>
            <div className="track-shell">
              <svg className="track-svg" viewBox="0 0 1000 116" role="img" aria-label={`${lane.label} machine at ${progress} percent`}>
                <path className="track-rail" d="M25 60 C150 10 220 105 340 58 S530 12 650 60 840 105 970 42" />
                <path className="track-energy" style={{ strokeDashoffset: 1000 - progress * 10 }} d="M25 60 C150 10 220 105 340 58 S530 12 650 60 840 105 970 42" />
                <circle className="marble" cx={25 + progress * 9.45} cy={progress < 100 ? 60 + Math.sin(progress / 8) * 28 : 42} r="16" />
                <rect className="gate gate-plan" x="245" y="20" width="22" height="70" rx="4" />
                <rect className="gate gate-tool" x="515" y="25" width="22" height="70" rx="4" />
                <rect className="gate gate-verify" x="760" y="20" width="26" height="76" rx="6" />
                <circle className="bell" cx="940" cy="42" r="25" />
              </svg>
              <div className="progress-readout">
                <span>{progress}%</span>
                <span>{lane.verificationStatus}</span>
              </div>
            </div>
            <div className="event-chip">{lane.currentEvent?.type ?? "waiting for event"}</div>
          </article>
        );
      })}
    </section>
  );
}
