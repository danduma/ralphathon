import type { DemoScriptStep, HapticPatternId, LaneDefinition, RaceEventType, StageDefinition } from "./types";

export const lanes: LaneDefinition[] = [
  {
    id: "lane-1",
    label: "Atlas Planner",
    color: "#21d4a8",
    accent: "#a4ffe9",
    machine: "ramp"
  },
  {
    id: "lane-2",
    label: "Bolt Builder",
    color: "#f5c542",
    accent: "#fff0a8",
    machine: "lever"
  },
  {
    id: "lane-3",
    label: "Nova Fixer",
    color: "#ff5b79",
    accent: "#ffc0cb",
    machine: "chute"
  },
  {
    id: "lane-4",
    label: "Quill Verifier",
    color: "#62a8ff",
    accent: "#c9e0ff",
    machine: "bell"
  }
];

export const stageDefinitions: StageDefinition[] = [
  { id: "lobby", label: "Lobby", progressAt: 0, cue: "idle" },
  { id: "launch", label: "Launch ramp", progressAt: 10, cue: "marble" },
  { id: "plan", label: "Planning lever", progressAt: 25, cue: "lever" },
  { id: "tool", label: "Tool chute", progressAt: 45, cue: "spark" },
  { id: "recover", label: "Recovery fork", progressAt: 58, cue: "warning" },
  { id: "verify", label: "Verification lock", progressAt: 78, cue: "lock" },
  { id: "finish", label: "Finish bell", progressAt: 100, cue: "bell" }
];

export const hapticPatterns: Record<HapticPatternId, number[]> = {
  start: [80, 70, 100],
  plan: [65],
  tool: [30, 35, 30, 35, 30],
  failure: [220, 80, 120, 80, 220],
  recovery: [50, 45, 100, 45, 160],
  verify: [95, 90, 95, 90, 95],
  win: [70, 40, 70, 40, 170, 60, 220]
};

export const eventHapticMap: Partial<Record<RaceEventType, HapticPatternId>> = {
  "race.countdown_started": "start",
  "agent.started": "start",
  "agent.planned": "plan",
  "agent.tool_called": "tool",
  "agent.tool_completed": "tool",
  "agent.failed": "failure",
  "error.surfaced": "failure",
  "agent.recovered": "recovery",
  "verification.started": "verify",
  "verification.failed": "failure",
  "verification.passed": "verify",
  "agent.finished": "win",
  "race.finished": "win"
};

export const deterministicDemoScript: DemoScriptStep[] = [
  { delayMs: 150, type: "race.countdown_started", label: "Countdown lights are hot", progressDelta: 0, animationCue: "lights" },
  { delayMs: 500, laneId: "lane-1", type: "agent.started", label: "Atlas drops the first marble", progressDelta: 10 },
  { delayMs: 100, laneId: "lane-2", type: "agent.started", label: "Bolt spins up the gear train", progressDelta: 10 },
  { delayMs: 100, laneId: "lane-3", type: "agent.started", label: "Nova arms the recovery chute", progressDelta: 10 },
  { delayMs: 100, laneId: "lane-4", type: "agent.started", label: "Quill primes the finish bell", progressDelta: 10 },
  { delayMs: 650, laneId: "lane-1", type: "agent.planned", label: "Atlas chooses a low-risk route", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-2", type: "agent.planned", label: "Bolt sketches a build sequence", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-3", type: "agent.planned", label: "Nova plans a quick patch", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-4", type: "agent.planned", label: "Quill defines acceptance checks", progressDelta: 18 },
  { delayMs: 650, laneId: "lane-1", type: "agent.tool_called", label: "Atlas runs search and inspection", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-2", type: "agent.tool_called", label: "Bolt opens the build jig", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-3", type: "agent.tool_called", label: "Nova touches the risky circuit", progressDelta: 12 },
  { delayMs: 100, laneId: "lane-4", type: "agent.tool_called", label: "Quill starts trace capture", progressDelta: 18 },
  { delayMs: 650, laneId: "lane-3", type: "agent.failed", label: "Nova trips a failing assertion", progressDelta: -4, severity: "error", animationCue: "fault" },
  { delayMs: 200, laneId: "lane-3", type: "error.surfaced", label: "Stack trace is surfaced to the board", progressDelta: 0, severity: "error", animationCue: "alarm" },
  { delayMs: 650, laneId: "lane-1", type: "agent.tool_completed", label: "Atlas clears the inspection gate", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-2", type: "agent.tool_completed", label: "Bolt snaps the last relay into place", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-4", type: "agent.tool_completed", label: "Quill captures a clean baseline", progressDelta: 18 },
  { delayMs: 650, laneId: "lane-3", type: "agent.recovered", label: "Nova routes through the recovery fork", progressDelta: 20, severity: "success", animationCue: "recover" },
  { delayMs: 500, laneId: "lane-1", type: "verification.started", label: "Atlas enters verification lock", progressDelta: 14 },
  { delayMs: 100, laneId: "lane-2", type: "verification.started", label: "Bolt runs smoke checks", progressDelta: 14 },
  { delayMs: 100, laneId: "lane-3", type: "verification.started", label: "Nova retries verification", progressDelta: 14 },
  { delayMs: 100, laneId: "lane-4", type: "verification.started", label: "Quill validates the trace", progressDelta: 14 },
  { delayMs: 650, laneId: "lane-3", type: "verification.failed", label: "Nova catches one more mismatch", progressDelta: -2, severity: "warning" },
  { delayMs: 500, laneId: "lane-1", type: "verification.passed", label: "Atlas verification passes", progressDelta: 16, severity: "success" },
  { delayMs: 120, laneId: "lane-2", type: "verification.passed", label: "Bolt verification passes", progressDelta: 16, severity: "success" },
  { delayMs: 120, laneId: "lane-4", type: "verification.passed", label: "Quill verification passes", progressDelta: 16, severity: "success" },
  { delayMs: 450, laneId: "lane-1", type: "agent.finished", label: "Atlas rings the verified finish bell", progressDelta: 8, severity: "success" },
  { delayMs: 250, laneId: "lane-3", type: "verification.passed", label: "Nova finally proves the fix", progressDelta: 20, severity: "success" },
  { delayMs: 150, laneId: "lane-3", type: "agent.finished", label: "Nova crosses after recovery", progressDelta: 8, severity: "success" },
  { delayMs: 200, type: "race.finished", label: "Verified race complete", progressDelta: 0, severity: "success", animationCue: "finish" }
];
