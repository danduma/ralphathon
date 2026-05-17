import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import { stageDefinitions } from "../shared/raceConfig";
import type { Lane, LaneId, RaceEvent } from "../shared/types";

interface RubeMachineProps {
  lanes: Lane[];
  winnerLaneId?: LaneId;
}

const stations = [
  { id: "ball", label: "Ball", x: 98 },
  { id: "ramp", label: "Ramp", x: 226 },
  { id: "dominoes", label: "Dominoes", x: 372 },
  { id: "lever", label: "Lever", x: 510 },
  { id: "funnel", label: "Funnel", x: 650 },
  { id: "seesaw", label: "Seesaw", x: 792 },
  { id: "gate", label: "Gate", x: 914 },
  { id: "car", label: "Toy car", x: 1038 },
  { id: "phone", label: "Phone", x: 1184 }
];

const eventTone: Partial<Record<RaceEvent["type"], { frequency: number; second?: number; duration: number; kind: OscillatorType }>> = {
  "race.countdown_started": { frequency: 220, second: 330, duration: 0.18, kind: "square" },
  "agent.started": { frequency: 320, second: 480, duration: 0.12, kind: "sine" },
  "agent.planned": { frequency: 440, second: 660, duration: 0.1, kind: "triangle" },
  "agent.tool_called": { frequency: 720, second: 540, duration: 0.08, kind: "sawtooth" },
  "agent.tool_completed": { frequency: 640, second: 860, duration: 0.12, kind: "triangle" },
  "agent.failed": { frequency: 140, second: 96, duration: 0.2, kind: "square" },
  "error.surfaced": { frequency: 110, second: 180, duration: 0.16, kind: "square" },
  "agent.recovered": { frequency: 260, second: 520, duration: 0.16, kind: "triangle" },
  "verification.started": { frequency: 390, second: 780, duration: 0.14, kind: "sine" },
  "verification.failed": { frequency: 190, second: 150, duration: 0.16, kind: "square" },
  "verification.passed": { frequency: 740, second: 1120, duration: 0.18, kind: "sine" },
  "agent.finished": { frequency: 880, second: 1320, duration: 0.28, kind: "triangle" },
  "race.finished": { frequency: 523, second: 1046, duration: 0.35, kind: "sine" }
};

function getAudioContext(): AudioContext | undefined {
  const windowWithAudio = window as Window & { webkitAudioContext?: typeof AudioContext };
  const AudioContextConstructor = window.AudioContext ?? windowWithAudio.webkitAudioContext;
  return AudioContextConstructor ? new AudioContextConstructor() : undefined;
}

function playImpactSound(audioContext: AudioContext, event: RaceEvent): void {
  const tone = eventTone[event.type] ?? { frequency: 360, second: 540, duration: 0.1, kind: "sine" as OscillatorType };
  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  const compressor = audioContext.createDynamicsCompressor();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(event.severity === "error" ? 0.18 : 0.11, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.duration);
  gain.connect(compressor);
  compressor.connect(audioContext.destination);

  [tone.frequency, tone.second].filter((frequency): frequency is number => Boolean(frequency)).forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = tone.kind;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.detune.setValueAtTime(index * 7, now);
    oscillator.connect(gain);
    oscillator.start(now + index * 0.025);
    oscillator.stop(now + tone.duration + index * 0.035);
  });

  if (event.type.includes("tool") || event.severity === "error") {
    const noiseGain = audioContext.createGain();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.06, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
    }
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    noiseGain.gain.setValueAtTime(event.severity === "error" ? 0.08 : 0.045, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    noise.connect(noiseGain);
    noiseGain.connect(compressor);
    noise.start(now);
  }
}

function useMachineAudio(lanes: Lane[]): void {
  const audioRef = useRef<AudioContext>();
  const heardEventsRef = useRef(new Set<number>());

  useEffect(() => {
    const unlockAudio = () => {
      audioRef.current ??= getAudioContext();
      void audioRef.current?.resume();
    };
    window.addEventListener("pointerdown", unlockAudio, { capture: true });
    window.addEventListener("keydown", unlockAudio, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio, { capture: true });
      window.removeEventListener("keydown", unlockAudio, { capture: true });
    };
  }, []);

  useEffect(() => {
    const newestEvent = lanes
      .map((lane) => lane.currentEvent)
      .filter((event): event is RaceEvent => Boolean(event))
      .sort((a, b) => b.id - a.id)[0];

    if (!newestEvent || heardEventsRef.current.has(newestEvent.id)) return;
    heardEventsRef.current.add(newestEvent.id);
    audioRef.current ??= getAudioContext();
    const audioContext = audioRef.current;
    if (!audioContext) return;
    void audioContext.resume().then(() => playImpactSound(audioContext, newestEvent)).catch(() => undefined);
  }, [lanes]);
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function interpolate(progress: number, start: number, end: number, from: number, to: number): number {
  const amount = clamp((progress - start) / (end - start));
  return from + (to - from) * amount;
}

function getMarblePosition(progress: number): { x: number; y: number; visible: boolean } {
  if (progress <= 18) return { x: interpolate(progress, 0, 18, 96, 252), y: interpolate(progress, 0, 18, 102, 248), visible: true };
  if (progress <= 33) return { x: interpolate(progress, 18, 33, 252, 410), y: interpolate(progress, 18, 33, 248, 258), visible: true };
  if (progress <= 48) return { x: interpolate(progress, 33, 48, 410, 520), y: interpolate(progress, 33, 48, 258, 334), visible: true };
  if (progress <= 60) return { x: interpolate(progress, 48, 60, 520, 632), y: interpolate(progress, 48, 60, 334, 158), visible: true };
  if (progress <= 69) return { x: interpolate(progress, 60, 69, 632, 706), y: interpolate(progress, 60, 69, 158, 288), visible: true };
  if (progress <= 78) return { x: interpolate(progress, 69, 78, 706, 824), y: interpolate(progress, 69, 78, 288, 336), visible: true };
  return { x: 824, y: 336, visible: false };
}

function getDominoRotation(progress: number, index: number): number {
  return interpolate(progress, 20 + index * 2.2, 24 + index * 2.2, 0, 68);
}

export function RubeMachine({ lanes, winnerLaneId }: RubeMachineProps) {
  useMachineAudio(lanes);
  const leadingProgress = useMemo(() => Math.max(...lanes.map((lane) => lane.progress), 0), [lanes]);

  return (
    <section className="machine" aria-label="Four lane Rube Goldberg race machine" style={{ "--race-heat-position": `${leadingProgress}%` } as CSSProperties}>
      <div className="machine-backdrop" aria-hidden="true">
        <span className="factory-grid" />
        <span className="overhead-crane" />
        <span className="pressure-line pressure-line-one" />
        <span className="pressure-line pressure-line-two" />
      </div>
      <div className="finish-column">
        <span>Verify</span>
        <strong>Finish</strong>
      </div>
      {lanes.map((lane, laneIndex) => {
        const activeStage = stageDefinitions.find((stage) => stage.id === lane.currentStage) ?? stageDefinitions[0];
        const progress = Math.round(lane.progress);
        const eventCue = lane.currentEvent?.animationCue ?? activeStage.cue;
        const isWinner = winnerLaneId === lane.id;
        const marble = getMarblePosition(progress);
        const leverAngle = progress < 36 ? -7 : progress < 52 ? interpolate(progress, 36, 52, -7, 16) : interpolate(progress, 52, 66, 16, -3);
        const funnelAngle = progress < 54 ? 0 : progress < 68 ? interpolate(progress, 54, 68, 0, 28) : interpolate(progress, 68, 82, 28, 6);
        const seesawAngle = progress < 66 ? -5 : interpolate(progress, 66, 80, -5, 13);
        const gateAngle = interpolate(progress, 74, 86, 0, -64);
        const carOffset = interpolate(progress, 76, 97, 0, 172);
        const buttonDepth = interpolate(progress, 92, 98, 0, 1);
        const phoneEnergy = interpolate(progress, 94, 100, 0, 1);
        return (
          <article
            className={`machine-lane ${isWinner ? "winner" : ""} ${lane.verificationStatus} cue-${eventCue}`}
            key={lane.id}
            style={
              {
                "--lane-color": lane.color,
                "--lane-accent": lane.accent,
                "--progress": progress,
                "--progress-position": `${Math.min(96, 4 + progress * 0.88)}%`,
                "--counter-position": `${Math.min(70, 11 + progress * 0.5)}%`,
                "--lane-index": laneIndex,
                "--lever-angle": `${leverAngle}deg`,
                "--funnel-angle": `${funnelAngle}deg`,
                "--seesaw-angle": `${seesawAngle}deg`,
                "--gate-angle": `${gateAngle}deg`,
                "--car-offset": `${carOffset}px`,
                "--button-depth": buttonDepth,
                "--phone-energy": phoneEnergy
              } as CSSProperties
            }
          >
            <div className="lane-meta">
              <strong>{lane.label}</strong>
              <span>{activeStage.label}</span>
            </div>
            <div className="track-shell">
              <svg className="track-svg" viewBox="0 0 1280 720" role="img" aria-label={`${lane.label} browser-buildable Rube Goldberg machine at ${progress} percent`}>
                <defs>
                  <linearGradient id={`${lane.id}-energy`} x1="0" x2="1">
                    <stop offset="0%" stopColor={lane.accent} />
                    <stop offset="100%" stopColor={lane.color} />
                  </linearGradient>
                  <radialGradient id={`${lane.id}-phone`} cx="50%" cy="34%" r="60%">
                    <stop offset="0%" stopColor="#f8f2cf" />
                    <stop offset="70%" stopColor={lane.accent} />
                    <stop offset="100%" stopColor={lane.color} />
                  </radialGradient>
                  <filter id={`${lane.id}-glow`} x="-20%" y="-50%" width="140%" height="200%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <rect className="diagram-plate" x="28" y="36" width="1224" height="648" rx="18" />
                <path className="diagram-grid" d="M82 108H1202M82 190H1202M82 272H1202M82 354H1202M82 436H1202M82 518H1202M82 600H1202M160 78V644M280 78V644M400 78V644M520 78V644M640 78V644M760 78V644M880 78V644M1000 78V644M1120 78V644" />
                <path className="build-table" d="M70 556H1214" />

                <g className="cup-rig">
                  <path d="M70 78H132L122 152H80Z" />
                  <path d="M72 78C86 58 116 58 132 78" />
                  <circle cx="101" cy="105" r="17" />
                </g>

                <g className="ramp-rig">
                  <path className="track-shadow" d="M134 178L266 302L414 302" />
                  <path className="track-rail" d="M134 178L266 302L414 302" />
                  <path className="track-energy" style={{ strokeDashoffset: 1000 - progress * 11 }} filter={`url(#${lane.id}-glow)`} stroke={`url(#${lane.id}-energy)`} d="M134 178L266 302L414 302" />
                  <path d="M160 204V556M286 316V556" />
                </g>

                <g className="domino-rig">
                  {Array.from({ length: 7 }, (_, index) => {
                    const x = 306 + index * 23;
                    const rotation = getDominoRotation(progress, index);
                    return <rect className="domino" key={index} x={x} y="238" width="12" height="64" rx="3" style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${x + 6}px 302px` }} />;
                  })}
                </g>

                <g className="lever-rig">
                  <circle cx="500" cy="364" r="22" />
                  <path d="M414 344L586 382" />
                  <path d="M586 382L626 310" />
                </g>

                <g className="funnel-rig">
                  <path d="M598 120H708L668 230H638Z" />
                  <path d="M638 230C638 258 668 258 668 230" />
                  <path className="secondary-rail" d="M610 118C592 84 628 64 654 96C688 58 728 84 708 118" />
                  <path className="secondary-energy" style={{ strokeDashoffset: 1000 - Math.max(progress - 45, 0) * 16 }} d="M610 118C592 84 628 64 654 96C688 58 728 84 708 118" />
                </g>

                <g className="seesaw-rig">
                  <circle cx="780" cy="410" r="18" />
                  <path d="M696 388L862 432" />
                  <path d="M780 428L752 556M780 428L812 556" />
                  <path className="pull-string" d="M858 430C878 388 896 360 914 332" />
                </g>

                <g className="gate-rig">
                  <path d="M900 312V556" />
                  <path className="gate-door" d="M900 332H972V408" />
                  <path className="car-track" d="M908 474H1130" />
                </g>

                <g className="toy-car">
                  <path d="M918 432H998L1020 462H902Z" />
                  <rect x="932" y="404" width="54" height="32" rx="8" />
                  <circle className="car-wheel" cx="932" cy="470" r="14" />
                  <circle className="car-wheel" cx="990" cy="470" r="14" />
                </g>

                <g className="button-rig">
                  <rect x="1118" y="438" width="70" height="34" rx="8" />
                  <rect className="button-cap" x="1132" y="406" width="42" height="34" rx="9" />
                  <path d="M1154 438V556" />
                </g>

                <g className="phone-rig">
                  <circle className="phone-glow" cx="1202" cy="292" r="86" />
                  <path className="phone-vibe phone-vibe-left" d="M1138 246C1114 268 1114 316 1138 338M1120 222C1080 260 1080 324 1120 364" />
                  <path className="phone-vibe phone-vibe-right" d="M1266 246C1290 268 1290 316 1266 338M1284 222C1324 260 1324 324 1284 364" />
                  <rect className="phone-body" x="1162" y="196" width="80" height="156" rx="18" fill={`url(#${lane.id}-phone)`} />
                  <rect className="phone-screen" x="1174" y="222" width="56" height="92" rx="9" />
                  <circle className="phone-button" cx="1202" cy="332" r="7" />
                  <path className="phone-buzz" d="M1186 260H1218M1178 282H1226M1188 304H1216" />
                </g>

                <circle className="marble marble-shadow" cx={marble.x + 4} cy={marble.y + 16} r="10" style={{ opacity: marble.visible ? 0.42 : 0 }} />
                <circle className="marble marble-main" cx={marble.x} cy={marble.y} r="18" style={{ opacity: marble.visible ? 1 : 0 }} />
                {stations.map((station) => (
                  <g className={`station-marker station-${station.id}`} key={station.id}>
                    <line x1={station.x} x2={station.x} y1="80" y2="630" />
                    <circle cx={station.x} cy="630" r="8" />
                    <text x={station.x} y="662">
                      {station.label}
                    </text>
                  </g>
                ))}
              </svg>
              <div className="machine-parts" aria-hidden="true">
                <span className="spark spark-one" />
                <span className="spark spark-two" />
                <span className="spark spark-three" />
              </div>
              <div className="progress-readout">
                <span>{progress}%</span>
                <span>{lane.verificationStatus}</span>
              </div>
            </div>
            <div className="event-chip">
              <span>{lane.currentEvent?.type ?? "waiting"}</span>
              <strong>{lane.currentEvent?.label ?? activeStage.cue}</strong>
            </div>
          </article>
        );
      })}
    </section>
  );
}
