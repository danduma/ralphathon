import { useEffect, useState } from "react";
import { hapticPatterns } from "../shared/raceConfig";
import type { HapticPatternId, HapticsSupportState } from "../shared/types";

const fallbackTones: Record<HapticPatternId, { frequency: number; duration: number; count: number }> = {
  start: { frequency: 240, duration: 0.11, count: 2 },
  plan: { frequency: 360, duration: 0.08, count: 1 },
  tool: { frequency: 560, duration: 0.055, count: 3 },
  failure: { frequency: 150, duration: 0.13, count: 4 },
  recovery: { frequency: 330, duration: 0.09, count: 3 },
  verify: { frequency: 720, duration: 0.075, count: 3 },
  win: { frequency: 880, duration: 0.12, count: 5 }
};

function createAudioContext(): AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  const audioWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
  const AudioContextConstructor = window.AudioContext ?? audioWindow.webkitAudioContext;
  return AudioContextConstructor ? new AudioContextConstructor() : undefined;
}

export interface HapticsSnapshot {
  support: HapticsSupportState;
  visualPulseToken: number;
  finalBuzzing: boolean;
  lastPattern?: HapticPatternId;
  lastResult?: HapticsSupportState;
}

type Listener = (snapshot: HapticsSnapshot) => void;

export class HapticsManager {
  private snapshot: HapticsSnapshot = {
    support: "unknown",
    visualPulseToken: 0,
    finalBuzzing: false
  };
  private listeners = new Set<Listener>();
  private audioContext?: AudioContext;
  private finalBuzzTimer?: number;

  probe(): HapticsSupportState {
    const support: HapticsSupportState = typeof navigator !== "undefined" && typeof navigator.vibrate === "function" ? "supported" : "unsupported";
    this.setSnapshot({ support, lastResult: support });
    return support;
  }

  test(): HapticsSupportState {
    return this.runPattern("start");
  }

  prime(): HapticsSupportState {
    this.unlockAudio();
    const support = this.snapshot.support === "unknown" ? this.probe() : this.snapshot.support;
    let result: HapticsSupportState = support;
    if (support === "supported") {
      try {
        result = navigator.vibrate(20) ? "supported" : "failed";
      } catch {
        result = "failed";
      }
    }

    this.setSnapshot({
      support: result === "supported" ? "supported" : support,
      lastResult: result
    });
    return result;
  }

  runPattern(patternId: HapticPatternId): HapticsSupportState {
    this.unlockAudio();
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
    if (result !== "supported") {
      this.playFallbackTone(patternId);
    }

    this.setSnapshot({
      support: result === "supported" ? "supported" : support,
      lastPattern: patternId,
      lastResult: result,
      visualPulseToken: this.snapshot.visualPulseToken + 1
    });
    return result;
  }

  startFinalBuzz(): HapticsSupportState {
    this.stopFinalBuzz();
    this.unlockAudio();
    const support = this.snapshot.support === "unknown" ? this.probe() : this.snapshot.support;
    const pulse = () => {
      if (support === "supported") {
        try {
          navigator.vibrate(hapticPatterns.win);
        } catch {
          this.playFallbackTone("win");
        }
      } else {
        this.playFallbackTone("win");
      }
      this.setSnapshot({
        visualPulseToken: this.snapshot.visualPulseToken + 1
      });
    };

    pulse();
    this.finalBuzzTimer = window.setInterval(pulse, 9200);
    this.setSnapshot({
      support,
      finalBuzzing: true,
      lastPattern: "win",
      lastResult: support
    });
    return support;
  }

  stopFinalBuzz(): void {
    if (this.finalBuzzTimer) {
      window.clearInterval(this.finalBuzzTimer);
      this.finalBuzzTimer = undefined;
    }
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(0);
      } catch {
        // Stop is best effort because some browsers expose vibrate but reject calls.
      }
    }
    if (this.snapshot.finalBuzzing) {
      this.setSnapshot({ finalBuzzing: false });
    }
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

  private unlockAudio(): void {
    this.audioContext ??= createAudioContext();
    void this.audioContext?.resume().catch(() => undefined);
  }

  private playFallbackTone(patternId: HapticPatternId): void {
    const audioContext = this.audioContext;
    if (!audioContext) return;

    const tone = fallbackTones[patternId];
    const start = audioContext.currentTime;
    for (let index = 0; index < tone.count; index += 1) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const pulseStart = start + index * (tone.duration + 0.045);
      oscillator.type = patternId === "failure" ? "square" : "triangle";
      oscillator.frequency.setValueAtTime(tone.frequency + index * 34, pulseStart);
      gain.gain.setValueAtTime(0.0001, pulseStart);
      gain.gain.exponentialRampToValueAtTime(patternId === "failure" ? 0.28 : 0.18, pulseStart + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, pulseStart + tone.duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(pulseStart);
      oscillator.stop(pulseStart + tone.duration + 0.02);
    }
  }
}

export const hapticsManager = new HapticsManager();

export function useHapticsSnapshot(): HapticsSnapshot {
  const [snapshot, setSnapshot] = useState(() => hapticsManager.getSnapshot());
  useEffect(() => hapticsManager.subscribe(setSnapshot), []);
  return snapshot;
}
