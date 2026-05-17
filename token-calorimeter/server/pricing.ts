import type { TokenMetrics } from "./types";

interface ModelPrice {
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
}

const DEFAULT_MODEL = "gpt-4.1-mini";

const pricing: Record<string, ModelPrice> = {
  "gpt-4.1-mini": {
    inputUsdPerMillion: 0.4,
    outputUsdPerMillion: 0.4
  },
  "gpt-4o-mini": {
    inputUsdPerMillion: 0.15,
    outputUsdPerMillion: 0.6
  },
  "gpt-5-mini": {
    inputUsdPerMillion: 0.25,
    outputUsdPerMillion: 2
  }
};

export function getModelPrice(model: string): ModelPrice {
  return pricing[model] ?? pricing[DEFAULT_MODEL];
}

export function calculateCost(
  usage: Pick<TokenMetrics, "inputTokens" | "outputTokens">,
  model = DEFAULT_MODEL
): number {
  const price = getModelPrice(model);
  return (
    (usage.inputTokens / 1_000_000) * price.inputUsdPerMillion +
    (usage.outputTokens / 1_000_000) * price.outputUsdPerMillion
  );
}
