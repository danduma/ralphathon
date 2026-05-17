import type { CSSProperties } from "react";
import { useCallback, useEffect } from "react";
import { EventLog } from "./EventLog";
import { hapticsManager, useHapticsSnapshot } from "../state/HapticsManager";
import { raceManager, useRaceSelector } from "../state/RaceManager";
import type { LaneId, RaceEvent, RaceSnapshot, RaceStatus } from "../shared/types";

const raceStatusLabels: Record<RaceStatus, string> = {
  lobby: "Waiting",
  countdown: "Starting",
  running: "Racing",
  finished: "Done"
};

export function PhoneController() {
  const haptics = useHapticsSnapshot();
  const selectSnapshot = useCallback((state: { snapshot?: RaceSnapshot }) => state.snapshot, []);
  const selectConnectionId = useCallback((state: { connectionId?: string }) => state.connectionId, []);
  const selectLastEvent = useCallback((state: { lastEvent?: RaceEvent }) => state.lastEvent, []);
  const selectConnected = useCallback((state: { connected: boolean }) => state.connected, []);
  const snapshot = useRaceSelector(selectSnapshot);
  const connectionId = useRaceSelector(selectConnectionId);
  const lastEvent = useRaceSelector(selectLastEvent);
  const connected = useRaceSelector(selectConnected);

  useEffect(() => {
    const support = hapticsManager.probe();
    raceManager.connect("phone", support);
  }, []);

  const ownPhone = snapshot?.phones.find((phone) => phone.connectionId === connectionId);
  const assignedLane = snapshot?.lanes.find((lane) => lane.id === ownPhone?.laneId);
  const laneEvents = assignedLane?.eventHistory ?? [];

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === "race.finished") {
      const result = hapticsManager.startFinalBuzz();
      raceManager.reportHapticsResult(result === "supported", result);
      return;
    }
    if (lastEvent.type === "race.haptics_stopped" || lastEvent.type === "race.reset") {
      hapticsManager.stopFinalBuzz();
    }
  }, [assignedLane, lastEvent]);

  const join = (laneId?: LaneId) => {
    raceManager.joinLane(laneId);
    const result = hapticsManager.prime();
    raceManager.reportHapticsResult(result === "supported", result);
  };

  const testHaptics = () => {
    const result = hapticsManager.test();
    raceManager.reportHapticsResult(result === "supported", result);
  };

  return (
    <main
      className={`phone-page pulse-${haptics.visualPulseToken % 2}`}
      style={{ "--lane-color": assignedLane?.color ?? "#21d4a8", "--lane-accent": assignedLane?.accent ?? "#a4ffe9" } as CSSProperties}
    >
      <section className="phone-hero">
        <div className={`connection-pill ${connected ? "online" : "offline"}`}>{connected ? "Live" : "Reconnecting"}</div>
        <p className="eyebrow">Your phone is a lane buzzer</p>
        <h1>{assignedLane?.label ?? "Pick a racer"}</h1>
        <p className="phone-event">{assignedLane?.currentEvent?.label ?? "Your phone will flash, buzz, or beep with your lane."}</p>
        <div className="phone-status-grid">
          <span>Feedback</span>
          <strong>{haptics.support === "supported" ? "Vibration ready" : "Flash and sound"}</strong>
          <span>Race</span>
          <strong>{snapshot ? raceStatusLabels[snapshot.session.status] : "Waiting"}</strong>
        </div>
        <button className="phone-test" type="button" onClick={testHaptics}>
          Test my phone
        </button>
      </section>

      <section className="lane-picker" aria-label="Lane selection">
        <button type="button" className="lane-choice auto" onClick={() => join()}>
          Pick for me
        </button>
        {snapshot?.lanes.map((lane) => (
          <button
            className={`lane-choice ${assignedLane?.id === lane.id ? "selected" : ""}`}
            type="button"
            key={lane.id}
            style={{ "--lane-color": lane.color } as CSSProperties}
            onClick={() => join(lane.id)}
          >
            {lane.label}
          </button>
        ))}
      </section>

      <EventLog events={laneEvents} compact />
    </main>
  );
}
