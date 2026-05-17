import { useEffect, useState } from "react";
import { hapticPatterns } from "../shared/raceConfig";
import type { HapticPatternId, HapticsSupportState } from "../shared/types";

export interface HapticsSnapshot {
  support: HapticsSupportState;
  visualPulseToken: number;
  lastPattern?: HapticPatternId;
  lastResult?: HapticsSupportState;
}

type Listener = (snapshot: HapticsSnapshot) => void;

export class HapticsManager {
  private snapshot: HapticsSnapshot = {
    support: "unknown",
    visualPulseToken: 0
  };
  private listeners = new Set<Listener>();

  probe(): HapticsSupportState {
    const support: HapticsSupportState = typeof navigator !== "undefined" && typeof navigator.vibrate === "function" ? "supported" : "unsupported";
    this.setSnapshot({ support, lastResult: support });
    return support;
  }

  test(): HapticsSupportState {
    return this.runPattern("start");
  }

  runPattern(patternId: HapticPatternId): HapticsSupportState {
    const support = this.snapshot.support === "unknown" ? this.probe() : this.snapshot.support;
    let result: HapticsSupportState = support;
    if (support === "supported") {
      try {
        const ok = navigator.vibrate(hapticPatterns[patternId]);
        result = ok ? "supported" : "failed";
      } catch {
        result = "failed";
      }
    }

    this.setSnapshot({
      support: result === "supported" ? "supported" : support,
      lastPattern: patternId,
      lastResult: result,
      visualPulseToken: this.snapshot.visualPulseToken + 1
    });
    return result;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): HapticsSnapshot {
    return this.snapshot;
  }

  private setSnapshot(partial: Partial<HapticsSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    this.listeners.forEach((listener) => listener(this.snapshot));
  }
}

export const hapticsManager = new HapticsManager();

export function useHapticsSnapshot(): HapticsSnapshot {
  const [snapshot, setSnapshot] = useState(() => hapticsManager.getSnapshot());
  useEffect(() => hapticsManager.subscribe(setSnapshot), []);
  return snapshot;
}
