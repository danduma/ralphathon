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
  { id: "lobby", label: "On the blocks", progressAt: 0, cue: "ready" },
  { id: "launch", label: "Ball drop", progressAt: 10, cue: "drop" },
  { id: "plan", label: "Route picked", progressAt: 25, cue: "lever" },
  { id: "tool", label: "Tools firing", progressAt: 45, cue: "spark" },
  { id: "recover", label: "Trouble lane", progressAt: 58, cue: "warning" },
  { id: "verify", label: "Checks running", progressAt: 78, cue: "lock" },
  { id: "finish", label: "Bell rung", progressAt: 100, cue: "bell" }
];

export const hapticPatterns: Record<HapticPatternId, number[]> = {
  start: [80, 70, 100],
  plan: [65],
  tool: [30, 35, 30, 35, 30],
  failure: [220, 80, 120, 80, 220],
  recovery: [50, 45, 100, 45, 160],
  verify: [95, 90, 95, 90, 95],
  win: [10000]
};

export const eventHapticMap: Partial<Record<RaceEventType, HapticPatternId>> = {
  "race.finished": "win"
};

export const deterministicDemoScript: DemoScriptStep[] = [
  { delayMs: 150, type: "race.countdown_started", label: "Lights on. Everybody hold the phone tight.", progressDelta: 0, animationCue: "lights" },
  { delayMs: 500, laneId: "lane-1", type: "agent.started", label: "Atlas drops the first ball.", progressDelta: 10 },
  { delayMs: 100, laneId: "lane-2", type: "agent.started", label: "Bolt gets the gears moving.", progressDelta: 10 },
  { delayMs: 100, laneId: "lane-3", type: "agent.started", label: "Nova takes the risky chute.", progressDelta: 10 },
  { delayMs: 100, laneId: "lane-4", type: "agent.started", label: "Quill heads for the bell.", progressDelta: 10 },
  { delayMs: 650, laneId: "lane-1", type: "agent.planned", label: "Atlas picks the careful route.", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-2", type: "agent.planned", label: "Bolt lines up the build.", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-3", type: "agent.planned", label: "Nova gambles on a fast patch.", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-4", type: "agent.planned", label: "Quill writes down what has to pass.", progressDelta: 18 },
  { delayMs: 650, laneId: "lane-1", type: "agent.tool_called", label: "Atlas searches the room.", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-2", type: "agent.tool_called", label: "Bolt fires up the build tool.", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-3", type: "agent.tool_called", label: "Nova touches the suspicious wire.", progressDelta: 12 },
  { delayMs: 100, laneId: "lane-4", type: "agent.tool_called", label: "Quill starts recording evidence.", progressDelta: 18 },
  { delayMs: 650, laneId: "lane-3", type: "agent.failed", label: "Nova hits a failing test.", progressDelta: -4, severity: "error", animationCue: "fault" },
  { delayMs: 200, laneId: "lane-3", type: "error.surfaced", label: "The stack trace goes on the board.", progressDelta: 0, severity: "error", animationCue: "alarm" },
  { delayMs: 650, laneId: "lane-1", type: "agent.tool_completed", label: "Atlas gets through inspection.", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-2", type: "agent.tool_completed", label: "Bolt snaps the relay into place.", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-4", type: "agent.tool_completed", label: "Quill has a clean baseline.", progressDelta: 18 },
  { delayMs: 650, laneId: "lane-3", type: "agent.recovered", label: "Nova recovers and keeps moving.", progressDelta: 20, severity: "success", animationCue: "recover" },
  { delayMs: 500, laneId: "lane-1", type: "verification.started", label: "Atlas starts the checks.", progressDelta: 14 },
  { delayMs: 100, laneId: "lane-2", type: "verification.started", label: "Bolt runs smoke tests.", progressDelta: 14 },
  { delayMs: 100, laneId: "lane-3", type: "verification.started", label: "Nova tries the checks again.", progressDelta: 14 },
  { delayMs: 100, laneId: "lane-4", type: "verification.started", label: "Quill checks the trace.", progressDelta: 14 },
  { delayMs: 650, laneId: "lane-3", type: "verification.failed", label: "Nova still has one mismatch.", progressDelta: -2, severity: "warning" },
  { delayMs: 500, laneId: "lane-1", type: "verification.passed", label: "Atlas passes.", progressDelta: 16, severity: "success" },
  { delayMs: 120, laneId: "lane-2", type: "verification.passed", label: "Bolt passes.", progressDelta: 16, severity: "success" },
  { delayMs: 120, laneId: "lane-4", type: "verification.passed", label: "Quill passes.", progressDelta: 16, severity: "success" },
  { delayMs: 450, laneId: "lane-1", type: "agent.finished", label: "Atlas rings the bell first.", progressDelta: 8, severity: "success" },
  { delayMs: 250, laneId: "lane-3", type: "verification.passed", label: "Nova finally proves the fix.", progressDelta: 20, severity: "success" },
  { delayMs: 150, laneId: "lane-3", type: "agent.finished", label: "Nova limps across after the save.", progressDelta: 8, severity: "success" },
  { delayMs: 200, type: "race.finished", label: "Race over. The checked work wins.", progressDelta: 0, severity: "success", animationCue: "finish" }
];
