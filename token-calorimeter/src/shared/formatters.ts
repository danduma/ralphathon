export function formatTokens(tokens: number): string {
  if (tokens < 1_000) return String(Math.round(tokens));
  if (tokens < 1_000_000) return `${(tokens / 1_000).toFixed(1)}k`;
  return `${(tokens / 1_000_000).toFixed(1)}m`;
}

export function formatCost(cost: number): string {
  if (cost < 0.001) return `$${cost.toFixed(5)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

export function formatElapsed(ms: number): string {
  return `${(Math.round(ms / 100) / 10).toFixed(1)}s`;
}

export function formatRatio(numerator: number, denominator: number): string {
  return `${(numerator / Math.max(denominator, 1)).toFixed(1)}x`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
