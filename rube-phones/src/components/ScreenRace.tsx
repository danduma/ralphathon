import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { EventLog } from "./EventLog";
import { RaceControls } from "./RaceControls";
import { RubeMachine } from "./RubeMachine";
import { raceManager, useRaceSelector } from "../state/RaceManager";
import { lanes as laneDefinitions } from "../shared/raceConfig";
import type { RaceSnapshot, RaceStatus } from "../shared/types";

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

const raceStatusLabels: Record<RaceStatus, string> = {
  lobby: "Ready",
  countdown: "Starting",
  running: "Racing",
  finished: "Done"
};

export function ScreenRace() {
  const selectSnapshot = useCallback((state: { snapshot?: RaceSnapshot }) => state.snapshot ?? fallbackSnapshot, []);
  const selectConnected = useCallback((state: { connected: boolean }) => state.connected, []);
  const snapshot = useRaceSelector(selectSnapshot);
  const connected = useRaceSelector(selectConnected);
  const [qr, setQr] = useState("");
  const [joinBaseUrl, setJoinBaseUrl] = useState("");

  useEffect(() => {
    raceManager.connect("screen");
  }, []);

  useEffect(() => {
    const serverPort = import.meta.env.DEV ? "8787" : window.location.port;
    const serverBase = `${window.location.protocol}//${window.location.hostname}${serverPort ? `:${serverPort}` : ""}`;
    const params = new URLSearchParams({
      appProtocol: window.location.protocol,
      appPort: window.location.port
    });

    fetch(`${serverBase}/api/join-url?${params.toString()}`)
      .then((response) => response.json() as Promise<{ url: string }>)
      .then((payload) => setJoinBaseUrl(payload.url))
      .catch(() => {
        const fallback = new URL("/phone", window.location.href);
        setJoinBaseUrl(fallback.toString());
      });
  }, []);

  const phoneUrl = useMemo(() => {
    const url = new URL(joinBaseUrl || "/phone", window.location.href);
    url.searchParams.set("session", snapshot.session.id);
    return url.toString();
  }, [joinBaseUrl, snapshot.session.id]);

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
          <h1>Watch agents race. Feel every move.</h1>
        </div>
        <div className={`connection-pill ${connected ? "online" : "offline"}`}>{connected ? "Live" : "Connecting"}</div>
      </header>

      <section className="screen-grid">
        <div className="race-stage">
          <div className="race-topline">
            <div>
              <span className="status-label">Race</span>
              <strong>{raceStatusLabels[snapshot.session.status]}</strong>
            </div>
            <div>
              <span className="status-label">Phones in</span>
              <strong>{pairedCount}/4</strong>
            </div>
            <div>
              <span className="status-label">Winner</span>
              <strong>{winner?.label ?? "No winner yet"}</strong>
            </div>
          </div>
          <RubeMachine lanes={snapshot.lanes} winnerLaneId={snapshot.session.winnerLaneId} />
        </div>

        <aside className="control-column">
          <RaceControls status={snapshot.session.status} connected={connected} />
          <section className="join-panel" aria-label="Phone join QR">
            <header className="panel-header">
              <span>Join on phone</span>
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
