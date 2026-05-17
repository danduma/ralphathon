import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { EventLog } from "./EventLog";
import { RaceControls } from "./RaceControls";
import { RubeMachine } from "./RubeMachine";
import { raceManager, useRaceSelector } from "../state/RaceManager";
import { lanes as laneDefinitions } from "../shared/raceConfig";
import type { RaceSnapshot } from "../shared/types";

const fallbackSnapshot: RaceSnapshot = {
  session: { id: "pending", status: "lobby" },
  lanes: laneDefinitions.map((lane) => ({
    ...lane,
    currentStage: "lobby",
    progress: 0,
    score: 0,
    eventHistory: [],
    verificationStatus: "pending"
  })),
  phones: [],
  events: []
};

export function ScreenRace() {
  const selectSnapshot = useCallback((state: { snapshot?: RaceSnapshot }) => state.snapshot ?? fallbackSnapshot, []);
  const selectConnected = useCallback((state: { connected: boolean }) => state.connected, []);
  const snapshot = useRaceSelector(selectSnapshot);
  const connected = useRaceSelector(selectConnected);
  const [qr, setQr] = useState("");

  useEffect(() => {
    raceManager.connect("screen");
  }, []);

  const phoneUrl = useMemo(() => {
    const url = new URL("/phone", window.location.href);
    url.searchParams.set("session", snapshot.session.id);
    return url.toString().replace(":5173", ":5173");
  }, [snapshot.session.id]);

  useEffect(() => {
    QRCode.toDataURL(phoneUrl, { margin: 1, color: { dark: "#111111", light: "#f8fbff" }, width: 220 }).then(setQr).catch(() => setQr(""));
  }, [phoneUrl]);

  const pairedCount = snapshot.phones.filter((phone) => phone.laneId && phone.connected).length;
  const winner = snapshot.lanes.find((lane) => lane.id === snapshot.session.winnerLaneId);

  return (
    <main className="screen-page">
      <header className="screen-header">
        <div>
          <p className="eyebrow">Agent Rube Rally</p>
          <h1>Invisible execution, visible and tactile.</h1>
        </div>
        <div className={`connection-pill ${connected ? "online" : "offline"}`}>{connected ? "server online" : "connecting"}</div>
      </header>

      <section className="screen-grid">
        <div className="race-stage">
          <div className="race-topline">
            <div>
              <span className="status-label">Race status</span>
              <strong>{snapshot.session.status}</strong>
            </div>
            <div>
              <span className="status-label">Phones paired</span>
              <strong>{pairedCount}/4</strong>
            </div>
            <div>
              <span className="status-label">Winner</span>
              <strong>{winner?.label ?? "verification locked"}</strong>
            </div>
          </div>
          <RubeMachine lanes={snapshot.lanes} winnerLaneId={snapshot.session.winnerLaneId} />
        </div>

        <aside className="control-column">
          <RaceControls status={snapshot.session.status} connected={connected} />
          <section className="join-panel" aria-label="Phone join QR">
            <header className="panel-header">
              <span>Phone join</span>
              <strong>{snapshot.session.id}</strong>
            </header>
            {qr ? <img className="qr-code" src={qr} alt="QR code for phone controller" /> : <div className="qr-placeholder" />}
            <a className="phone-link" href={phoneUrl}>
              {phoneUrl}
            </a>
          </section>
          <EventLog events={snapshot.events} />
        </aside>
      </section>
    </main>
  );
}
