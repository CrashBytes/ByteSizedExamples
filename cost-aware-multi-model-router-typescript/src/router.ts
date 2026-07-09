/**
 * The router takes a `RoutingRequirement` and returns the cheapest model that
 * satisfies it, plus a fallback ladder of one model per higher tier.
 *
 * The selection is pure and deterministic: filter to models that cover the
 * requirement, sort by tier (cheapest first), then by estimated cost, then by
 * eval score as the tiebreaker.
 */

import { MODELS, type ModelSpec } from './registry.js';
import type { RoutingRequirement } from './classifier.js';

export interface RoutingDecision {
  primary: ModelSpec;
  fallbacks: ModelSpec[];
  estimatedCostCents: number;
  reason: string;
}

function covers(model: ModelSpec, req: RoutingRequirement): boolean {
  for (const c of req.requiredCapabilities) {
    if (!model.capabilities.has(c)) return false;
  }
  if (req.estimatedInputTokens > model.maxContextTokens) return false;
  if (req.highStakes && model.tier === 'floor') return false;
  return true;
}

export function estimatedCostCents(
  model: ModelSpec,
  req: RoutingRequirement
): number {
  const inputDollars =
    (req.estimatedInputTokens / 1_000_000) * model.inputCostPerMillion;
  const outputDollars =
    (req.estimatedOutputTokens / 1_000_000) * model.outputCostPerMillion;
  return Math.round((inputDollars + outputDollars) * 100 * 1000) / 1000;
}

const TIER_ORDER: Record<ModelSpec['tier'], number> = {
  floor: 0,
  mid: 1,
  frontier: 2,
};

export function route(req: RoutingRequirement): RoutingDecision {
  const candidates = MODELS.filter((m) => covers(m, req));

  if (candidates.length === 0) {
    throw new Error(
      `No model in registry satisfies requirements: ${[
        ...req.requiredCapabilities,
      ].join(', ')}`
    );
  }

  // Sort by tier ascending (cheapest first), then by cost, then by eval score
  // descending as the tiebreaker.
  const sorted = [...candidates].sort((a, b) => {
    const tierDelta = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    if (tierDelta !== 0) return tierDelta;
    const costDelta = estimatedCostCents(a, req) - estimatedCostCents(b, req);
    if (costDelta !== 0) return costDelta;
    return b.evalScore - a.evalScore;
  });

  const primary = sorted[0];
  const fallbacks = sorted.slice(1).filter((m, i, arr) => {
    // Only keep one fallback per tier; skip duplicates.
    return arr.findIndex((other) => other.tier === m.tier) === i;
  });

  return {
    primary,
    fallbacks,
    estimatedCostCents: estimatedCostCents(primary, req),
    reason: `Cheapest model in tier '${primary.tier}' covering [${[
      ...req.requiredCapabilities,
    ].join(', ')}]`,
  };
}
