import { describe, it, expect } from 'vitest';
import { MODELS, type Capability } from '../src/registry.js';
import { estimatedCostCents } from '../src/router.js';
import type { RoutingRequirement } from '../src/classifier.js';

/** Small helper: cheapest model (by estimated cost) that covers a capability. */
function cheapestCovering(cap: Capability, req: RoutingRequirement) {
  return [...MODELS]
    .filter((m) => m.capabilities.has(cap))
    .sort((a, b) => estimatedCostCents(a, req) - estimatedCostCents(b, req))[0];
}

const req: RoutingRequirement = {
  requiredCapabilities: new Set(),
  estimatedInputTokens: 1_000,
  estimatedOutputTokens: 300,
  highStakes: false,
};

describe('model registry', () => {
  it('has a unique id per model', () => {
    const ids = MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('prices every model as positive input/output cost', () => {
    for (const m of MODELS) {
      expect(m.inputCostPerMillion).toBeGreaterThan(0);
      expect(m.outputCostPerMillion).toBeGreaterThan(0);
    }
  });

  it('selects gemini-3.1-flash-lite as the cheapest extraction-capable model', () => {
    expect(cheapestCovering('extraction', req).id).toBe('gemini-3.1-flash-lite');
  });

  it('selects a mid-tier model as the cheapest reasoning-capable model (floor lacks reasoning)', () => {
    const pick = cheapestCovering('reasoning', req);
    expect(pick.tier).toBe('mid');
    expect(pick.id).toBe('claude-sonnet-4.6');
  });

  it('reflects the ~96x floor-to-frontier output price spread from the article', () => {
    const cheapestOutput = Math.min(...MODELS.map((m) => m.outputCostPerMillion));
    const dearestOutput = Math.max(...MODELS.map((m) => m.outputCostPerMillion));
    expect(cheapestOutput).toBe(1.0); // Gemini 3.1 Flash-Lite
    expect(dearestOutput).toBe(75.0); // Opus 4.7
    expect(dearestOutput / cheapestOutput).toBe(75);
  });

  it('exposes capabilities as a set (membership, not order)', () => {
    const flashLite = MODELS.find((m) => m.id === 'gemini-3.1-flash-lite')!;
    expect(flashLite.capabilities.has('extraction')).toBe(true);
    expect(flashLite.capabilities.has('reasoning')).toBe(false);
  });
});
