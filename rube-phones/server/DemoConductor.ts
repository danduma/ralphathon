import { deterministicDemoScript } from "../src/shared/raceConfig";
import type { DemoScriptStep } from "../src/shared/types";
import type { RaceStore } from "./RaceStore";

export class DemoConductor {
  private timers: ReturnType<typeof setTimeout>[] = [];
  private running = false;

  constructor(private readonly store: RaceStore, private readonly script: DemoScriptStep[] = deterministicDemoScript) {}

  start(): void {
    this.stop();
    this.running = true;
    this.store.startCountdown();

    let elapsed = 0;
    for (const step of this.script) {
      elapsed += step.delayMs;
      const timer = setTimeout(() => {
        if (!this.running) return;
        if (step.type === "race.countdown_started") return;
        this.store.appendEvent({
          laneId: step.laneId,
          type: step.type,
          label: step.label,
          progressDelta: step.progressDelta,
          severity: step.severity,
          animationCue: step.animationCue
        });
        if (step.type === "race.finished") {
          this.running = false;
        }
      }, elapsed);
      this.timers.push(timer);
    }
  }

  stop(): void {
    this.running = false;
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
  }
}
