import { eventHapticMap, lanes, stageDefinitions } from "../src/shared/raceConfig";
import type {
  HapticsSupportState,
  Lane,
  LaneId,
  PhoneClient,
  RaceEvent,
  RaceEventType,
  RaceSession,
  RaceSnapshot,
  Severity,
  SurfaceKind
} from "../src/shared/types";

export interface AppendEventInput {
  laneId?: LaneId;
  type: RaceEventType;
  label: string;
  progressDelta?: number;
  animationCue?: string;
  severity?: Severity;
}

type Listener = (event: RaceEvent, snapshot: RaceSnapshot) => void;

export class RaceStore {
  private session: RaceSession;
  private laneMap = new Map<LaneId, Lane>();
  private phones = new Map<string, PhoneClient>();
  private events: RaceEvent[] = [];
  private nextEventId = 1;
  private listeners = new Set<Listener>();

  constructor(private readonly now: () => number = () => Date.now()) {
    this.session = this.createSession();
    this.resetLanes();
    this.appendEvent({ type: "race.created", label: "Race session ready", severity: "info" });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): RaceSnapshot {
    return {
      session: { ...this.session },
      lanes: [...this.laneMap.values()].map((lane) => ({
        ...lane,
        eventHistory: [...lane.eventHistory],
        currentEvent: lane.currentEvent ? { ...lane.currentEvent } : undefined
      })),
      phones: [...this.phones.values()].map((phone) => ({ ...phone })),
      events: [...this.events]
    };
  }

  reset(): RaceEvent {
    this.session = this.createSession();
    this.resetLanes();
    this.events = [];
    this.phones.forEach((phone) => {
      phone.laneId = undefined;
    });
    return this.appendEvent({ type: "race.reset", label: "Race reset to a clean lobby", severity: "info" });
  }

  connectPhone(connectionId: string, surface: SurfaceKind, userAgent = "", hapticsSupport: HapticsSupportState = "unknown"): PhoneClient {
    const phone: PhoneClient = {
      connectionId,
      connected: true,
      userAgent,
      surface,
      hapticsSupport,
      connectedAt: this.now()
    };
    this.phones.set(connectionId, phone);
    this.appendEvent({ type: "phone.connected", label: `${surface} connected`, severity: "info" });
    return phone;
  }

  disconnectPhone(connectionId: string): void {
    const phone = this.phones.get(connectionId);
    if (!phone) return;
    phone.connected = false;
    phone.disconnectedAt = this.now();
    if (phone.laneId) {
      const lane = this.laneMap.get(phone.laneId);
      if (lane?.assignedPhoneConnectionId === connectionId) {
        lane.assignedPhoneConnectionId = undefined;
      }
    }
  }

  assignLane(connectionId: string, requestedLaneId?: LaneId): LaneId {
    const phone = this.phones.get(connectionId);
    if (!phone) {
      throw new Error("Unknown phone connection");
    }

    const laneId = requestedLaneId ?? this.firstAvailableLaneId();
    const lane = this.requireLane(laneId);
    if (lane.assignedPhoneConnectionId && lane.assignedPhoneConnectionId !== connectionId) {
      throw new Error(`${lane.label} is already paired`);
    }

    if (phone.laneId && phone.laneId !== laneId) {
      const previousLane = this.requireLane(phone.laneId);
      if (previousLane.assignedPhoneConnectionId === connectionId) {
        previousLane.assignedPhoneConnectionId = undefined;
      }
    }

    phone.laneId = laneId;
    lane.assignedPhoneConnectionId = connectionId;
    this.appendEvent({
      laneId,
      type: "phone.assigned",
      label: `${lane.label} paired with phone`,
      severity: "success"
    });
    return laneId;
  }

  recordHapticsResult(connectionId: string, result: HapticsSupportState): void {
    const phone = this.phones.get(connectionId);
    if (!phone) {
      throw new Error("Unknown phone connection");
    }
    phone.hapticsSupport = result;
    this.appendEvent({
      laneId: phone.laneId,
      type: "phone.haptics_tested",
      label: result === "supported" ? "Haptics test succeeded" : "Visual pulse fallback active",
      severity: result === "supported" ? "success" : "warning"
    });
  }

  startCountdown(): RaceEvent {
    this.session.status = "countdown";
    this.session.startTime = this.now();
    return this.appendEvent({
      type: "race.countdown_started",
      label: "Presenter started the race countdown",
      severity: "info"
    });
  }

  appendEvent(input: AppendEventInput): RaceEvent {
    const event: RaceEvent = {
      id: this.nextEventId++,
      timestamp: this.now(),
      laneId: input.laneId,
      type: input.type,
      label: input.label,
      progressDelta: input.progressDelta ?? 0,
      hapticPatternId: eventHapticMap[input.type],
      animationCue: input.animationCue,
      severity: input.severity ?? (input.type.includes("failed") ? "error" : "info")
    };

    if (input.type.startsWith("agent.") || input.type.startsWith("verification.") || input.type === "error.surfaced") {
      this.session.status = "running";
    }

    if (input.laneId) {
      this.applyLaneEvent(input.laneId, event);
    }

    if (input.type === "race.finished") {
      this.finishRace(event);
    }

    this.events.push(event);
    this.emit(event);
    return event;
  }

  private createSession(): RaceSession {
    return {
      id: `session-${Math.random().toString(36).slice(2, 8)}`,
      status: "lobby"
    };
  }

  private resetLanes(): void {
    this.laneMap.clear();
    for (const lane of lanes) {
      this.laneMap.set(lane.id, {
        ...lane,
        currentStage: "lobby",
        progress: 0,
        score: 0,
        eventHistory: [],
        verificationStatus: "pending"
      });
    }
  }

  private applyLaneEvent(laneId: LaneId, event: RaceEvent): void {
    const lane = this.requireLane(laneId);
    lane.currentEvent = event;
    lane.eventHistory.push(event);
    lane.progress = Math.max(0, Math.min(100, lane.progress + event.progressDelta));
    lane.currentStage = stageDefinitions.reduce((current, stage) => (lane.progress >= stage.progressAt ? stage.id : current), "lobby");
    lane.score = lane.progress + lane.eventHistory.length;

    if (event.type === "verification.started") {
      lane.verificationStatus = "running";
    }
    if (event.type === "verification.failed") {
      lane.verificationStatus = "failed";
    }
    if (event.type === "verification.passed") {
      lane.verificationStatus = "passed";
      lane.progress = Math.max(lane.progress, 92);
    }
    if (event.type === "agent.finished" && lane.verificationStatus === "passed") {
      lane.finishedAt = event.timestamp;
      lane.progress = 100;
      if (!this.session.winnerLaneId) {
        this.session.winnerLaneId = lane.id;
      }
    }
  }

  private finishRace(event: RaceEvent): void {
    const verifiedWinner = [...this.laneMap.values()]
      .filter((lane) => lane.verificationStatus === "passed" && lane.finishedAt)
      .sort((a, b) => (a.finishedAt ?? Number.MAX_SAFE_INTEGER) - (b.finishedAt ?? Number.MAX_SAFE_INTEGER))[0];
    if (verifiedWinner) {
      this.session.winnerLaneId = verifiedWinner.id;
    }
    this.session.status = "finished";
    this.session.finishTime = event.timestamp;
  }

  private firstAvailableLaneId(): LaneId {
    const lane = [...this.laneMap.values()].find((candidate) => !candidate.assignedPhoneConnectionId);
    if (!lane) {
      throw new Error("All lanes already have phones");
    }
    return lane.id;
  }

  private requireLane(laneId: LaneId): Lane {
    const lane = this.laneMap.get(laneId);
    if (!lane) {
      throw new Error(`Unknown lane: ${laneId}`);
    }
    return lane;
  }

  private emit(event: RaceEvent): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(event, snapshot));
  }
}
