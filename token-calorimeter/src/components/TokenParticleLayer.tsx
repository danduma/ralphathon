import { useMemo } from "react";
import type { CSSProperties } from "react";
import { useCalorimeterSnapshot } from "../hooks/useCalorimeterSnapshot";

export function TokenParticleLayer() {
  const snapshot = useCalorimeterSnapshot();
  const active = snapshot.status === "running" || snapshot.status === "simplifying";
  const count = Math.min(34, Math.max(6, Math.ceil(snapshot.liveEstimatedTokens / 7)));
  const particles = useMemo(() => Array.from({ length: 36 }, (_, index) => index), []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.slice(0, active ? count : 6).map((particle) => (
        <span
          key={particle}
          className={`token-particle ${active ? "is-active" : ""}`}
          style={
            {
              "--particle-delay": `${(particle % 12) * 160}ms`,
              "--particle-top": `${72 + (particle % 5) * 16}px`,
              "--particle-size": `${5 + (particle % 4)}px`
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
