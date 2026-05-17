export const eventTypes = [
  "race.created",
  "phone.connected",
  "phone.assigned",
  "phone.haptics_tested",
  "race.countdown_started",
  "race.haptics_stopped",
  "agent.started",
  "agent.planned",
  "agent.tool_called",
  "agent.tool_completed",
  "agent.failed",
  "agent.recovered",
  "verification.started",
  "verification.failed",
  "verification.passed",
  "agent.finished",
  "race.finished",
  "race.reset",
  "error.surfaced"
] as const;

export type RaceEventType = (typeof eventTypes)[number];

export const hapticPatternIds = [
  "start",
  "plan",
  "tool",
  "failure",
  "recovery",
  "verify",
  "win"
] as const;

export type HapticPatternId = (typeof hapticPatternIds)[number];
export type RaceStatus = "lobby" | "countdown" | "running" | "finished";
export type LaneId = "lane-1" | "lane-2" | "lane-3" | "lane-4";
export type SurfaceKind = "screen" | "phone";
export type Severity = "info" | "success" | "warning" | "error";
export type VerificationStatus = "pending" | "running" | "failed" | "passed";
export type HapticsSupportState = "unknown" | "supported" | "unsupported" | "failed";

export interface StageDefinition {
  id: string;
  label: string;
  progressAt: number;
  cue: string;
}

export interface LaneDefinition {
  id: LaneId;
  label: string;
  color: string;
  accent: string;
  machine: string;
}

export interface DemoScriptStep {
  delayMs: number;
  laneId?: LaneId;
  type: RaceEventType;
  label: string;
  progressDelta?: number;
  severity?: Severity;
  animationCue?: string;
}

export interface RaceEvent {
  id: number;
  timestamp: number;
  laneId?: LaneId;
  type: RaceEventType;
  label: string;
  progressDelta: number;
  hapticPatternId?: HapticPatternId;
  animationCue?: string;
  severity: Severity;
}

export interface Lane {
  id: LaneId;
  label: string;
  color: string;
  accent: string;
  machine: string;
  assignedPhoneConnectionId?: string;
  currentStage: string;
  progress: number;
  score: number;
  eventHistory: RaceEvent[];
  verificationStatus: VerificationStatus;
  currentEvent?: RaceEvent;
  finishedAt?: number;
}

export interface PhoneClient {
  connectionId: string;
  laneId?: LaneId;
  connected: boolean;
  userAgent: string;
  surface: SurfaceKind;
  hapticsSupport: HapticsSupportState;
  connectedAt: number;
  disconnectedAt?: number;
}

export interface RaceSession {
  id: string;
  status: RaceStatus;
  startTime?: number;
  finishTime?: number;
  winnerLaneId?: LaneId;
}

export interface RaceSnapshot {
  session: RaceSession;
  lanes: Lane[];
  phones: PhoneClient[];
  events: RaceEvent[];
}

export interface ClientHelloMessage {
  type: "client.hello";
  surface: SurfaceKind;
  userAgent?: string;
  hapticsSupport?: HapticsSupportState;
}

export interface JoinLaneMessage {
  type: "client.join_lane";
  laneId?: LaneId;
}

export interface HapticsResultMessage {
  type: "client.haptics_result";
  supported: boolean;
  result: HapticsSupportState;
}

export interface PresenterStartMessage {
  type: "presenter.start";
  mode?: "demo" | "commands";
}

export interface PresenterResetMessage {
  type: "presenter.reset";
}

export interface PresenterStopHapticsMessage {
  type: "presenter.stop_haptics";
}

export type ClientMessage =
  | ClientHelloMessage
  | JoinLaneMessage
  | HapticsResultMessage
  | PresenterStartMessage
  | PresenterResetMessage
  | PresenterStopHapticsMessage;

export interface ServerSnapshotMessage {
  type: "server.snapshot";
  connectionId: string;
  snapshot: RaceSnapshot;
}

export interface ServerEventMessage {
  type: "server.event";
  event: RaceEvent;
  snapshot: RaceSnapshot;
}

export interface ServerErrorMessage {
  type: "server.error";
  message: string;
  code: string;
}

export type ServerMessage = ServerSnapshotMessage | ServerEventMessage | ServerErrorMessage;

export interface CommandRunnerConfig {
  timeoutMs: number;
  commands: Array<{
    laneId: LaneId;
    command: string;
    args?: string[];
  }>;
}
