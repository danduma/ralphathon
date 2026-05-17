import type { DemoScriptStep, HapticPatternId, LaneDefinition, RaceEventType, StageDefinition } from "./types";

export const lanes: LaneDefinition[] = [
  {
    id: "lane-1",
    label: "AMM Optimizer",
    color: "#21d4a8",
    accent: "#a4ffe9",
    machine: "ramp"
  },
  {
    id: "lane-2",
    label: "Dependency Explorer",
    color: "#f5c542",
    accent: "#fff0a8",
    machine: "lever"
  },
  {
    id: "lane-3",
    label: "Monitor Agent",
    color: "#ff5b79",
    accent: "#ffc0cb",
    machine: "chute"
  },
  {
    id: "lane-4",
    label: "Lamp Relay",
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
  "physical_action.armed": "verify",
  "physical_action.fired": "win",
  "agent.finished": "win",
  "race.finished": "win"
};

export const deterministicDemoScript: DemoScriptStep[] = [
  { delayMs: 150, type: "race.countdown_started", label: "The lamp relay is locked until useful work is verified", progressDelta: 0, animationCue: "lights" },
  { delayMs: 500, laneId: "lane-1", type: "agent.started", label: "AMM track loads the LMSR baseline", progressDelta: 10 },
  { delayMs: 100, laneId: "lane-2", type: "agent.started", label: "Cancer explorer loads public dependency data", progressDelta: 10 },
  { delayMs: 100, laneId: "lane-3", type: "agent.started", label: "Monitor agent starts independent validation", progressDelta: 10 },
  { delayMs: 100, laneId: "lane-4", type: "physical_action.armed", label: "Lamp relay armed but physically locked", progressDelta: 10 },
  { delayMs: 650, laneId: "lane-1", type: "agent.planned", label: "AMM optimizer proposes lower-capital liquidity", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-2", type: "agent.planned", label: "Explorer selects held-out ranking protocol", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-3", type: "agent.planned", label: "Monitor defines bounded-loss and ranking checks", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-4", type: "agent.planned", label: "Relay waits for the first verified success token", progressDelta: 8 },
  { delayMs: 650, laneId: "lane-1", type: "agent.tool_called", label: "AMM track runs bounded-loss and price-validity tests", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-2", type: "agent.tool_called", label: "Explorer scores gene dependency rankings", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-3", type: "agent.tool_called", label: "Monitor replays both claims from clean inputs", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-4", type: "agent.tool_called", label: "Relay checks lamp trigger safety interlock", progressDelta: 8 },
  { delayMs: 650, laneId: "lane-1", type: "agent.failed", label: "AMM candidate fails monotonicity", progressDelta: -4, severity: "error", animationCue: "fault" },
  { delayMs: 200, laneId: "lane-1", type: "error.surfaced", label: "Capital reduction claim rejected with counterexample", progressDelta: 0, severity: "error", animationCue: "alarm" },
  { delayMs: 650, laneId: "lane-2", type: "agent.tool_completed", label: "Explorer beats baseline by 11.8% on held-out genes", progressDelta: 24, severity: "success" },
  { delayMs: 100, laneId: "lane-3", type: "agent.tool_completed", label: "Monitor receives cancer-dependency success claim", progressDelta: 14 },
  { delayMs: 100, laneId: "lane-4", type: "agent.tool_completed", label: "Relay remains locked until monitor verification", progressDelta: 8 },
  { delayMs: 650, laneId: "lane-1", type: "agent.recovered", label: "AMM optimizer patches the monotonicity break", progressDelta: 20, severity: "success", animationCue: "recover" },
  { delayMs: 500, laneId: "lane-2", type: "verification.started", label: "Monitor validates ranking lift and research-only guard", progressDelta: 16 },
  { delayMs: 100, laneId: "lane-1", type: "verification.started", label: "AMM track reruns bounded-loss and slippage suite", progressDelta: 14 },
  { delayMs: 100, laneId: "lane-3", type: "verification.started", label: "Monitor checks the first success token", progressDelta: 18 },
  { delayMs: 100, laneId: "lane-4", type: "verification.started", label: "Lamp relay waits at verification lock", progressDelta: 16 },
  { delayMs: 650, laneId: "lane-1", type: "verification.failed", label: "AMM still misses the 1% capital target", progressDelta: -2, severity: "warning" },
  { delayMs: 500, laneId: "lane-2", type: "verification.passed", label: "Cancer dependency explorer verified at +11.8%", progressDelta: 18, severity: "success" },
  { delayMs: 120, laneId: "lane-3", type: "verification.passed", label: "Monitor signs the first verified success token", progressDelta: 26, severity: "success" },
  { delayMs: 120, laneId: "lane-4", type: "physical_action.fired", label: "Verified token fires the lamp trigger", progressDelta: 54, severity: "success" },
  { delayMs: 450, laneId: "lane-4", type: "agent.finished", label: "Lamp turns on after earned technical work", progressDelta: 10, severity: "success" },
  { delayMs: 250, laneId: "lane-1", type: "verification.passed", label: "AMM finally clears capital target and safety tests", progressDelta: 22, severity: "success" },
  { delayMs: 150, laneId: "lane-1", type: "agent.finished", label: "AMM track finishes after recovery", progressDelta: 10, severity: "success" },
  { delayMs: 200, type: "race.finished", label: "Room action earned by verified useful work", progressDelta: 0, severity: "success", animationCue: "finish" }
];
