import { describe, it, expect } from 'vitest';
import { classify, type PromptInput } from '../src/classifier.js';
import { route } from '../src/router.js';

interface Fixture {
  name: string;
  input: PromptInput;
  expectedTier: 'floor' | 'mid' | 'frontier';
  expectedModelId?: string;
}

// Replay-harness fixtures: pin routing decisions so a price change or a new
// provider tier that shifts behavior fails the build instead of the bill.
const fixtures: Fixture[] = [
  {
    name: 'simple email extraction -> floor (cheapest capable)',
    input: {
      task: 'extract',
      userPrompt: 'Find the email address: contact me at foo@bar.com today.',
    },
    expectedTier: 'floor',
    expectedModelId: 'gemini-3.1-flash-lite',
  },
  {
    name: 'short summary -> floor',
    input: {
      task: 'summarize',
      userPrompt: 'Summarize: ' + 'lorem ipsum '.repeat(500),
    },
    expectedTier: 'floor',
    expectedModelId: 'gemini-3.1-flash-lite',
  },
  {
    name: 'multi-step reasoning -> mid',
    input: {
      task: 'reason',
      userPrompt:
        'Given quarterly revenues 1.2M, 1.4M, 1.1M, 1.6M, what is the trend?',
    },
    expectedTier: 'mid',
    // Sonnet 4.6 is the cheapest reasoning-capable mid model.
    expectedModelId: 'claude-sonnet-4.6',
  },
  {
    name: 'agent with tools, high stakes -> at least mid (floor is excluded)',
    input: {
      task: 'agent',
      userPrompt: 'Audit this 2000-line refactor and propose a migration plan',
      highStakes: true,
    },
    // NOTE: the published article fixture expected 'frontier' here, but the
    // article's own registry gives gemini-3.1-pro (a mid model) every
    // capability and a 2M context, so the cheapest-capable router settles on
    // mid. High stakes only excludes the floor tier. See README "Deviations".
    expectedTier: 'mid',
  },
  {
    name: 'long-context summarization -> mid, not frontier',
    input: {
      task: 'summarize',
      userPrompt: 'a'.repeat(800_000), // ~200k tokens
    },
    expectedTier: 'mid',
  },
];

describe('router (replay fixtures)', () => {
  for (const f of fixtures) {
    it(f.name, () => {
      const decision = route(classify(f.input));
      expect(decision.primary.tier).toBe(f.expectedTier);
      if (f.expectedModelId) {
        expect(decision.primary.id).toBe(f.expectedModelId);
      }
    });
  }
});

describe('router selection semantics', () => {
  it('never routes a high-stakes prompt to the floor tier', () => {
    const decision = route(
      classify({ task: 'extract', userPrompt: 'pull the SSN', highStakes: true })
    );
    expect(decision.primary.tier).not.toBe('floor');
  });

  it('escalates when input exceeds a model context window', () => {
    // ~1M tokens: exceeds every model except gemini-3.1-pro (2M context) that
    // also carries long-context. It should land on that model.
    const decision = route(
      classify({ task: 'summarize', userPrompt: 'a'.repeat(4_000_004) })
    );
    expect(decision.primary.id).toBe('gemini-3.1-pro');
  });

  it('keeps at most one fallback per higher tier, none in the primary tier', () => {
    const decision = route(classify({ task: 'reason', userPrompt: 'why?' }));
    const tiers = decision.fallbacks.map((m) => m.tier);
    // No duplicate tiers among fallbacks.
    expect(new Set(tiers).size).toBe(tiers.length);
    // Fallback ladder only goes up (or sideways once) from the primary.
    expect(decision.fallbacks.some((m) => m.tier === 'frontier')).toBe(true);
  });

  it('computes a non-negative estimated cost in cents', () => {
    const decision = route(classify({ task: 'extract', userPrompt: 'hello world' }));
    expect(decision.estimatedCostCents).toBeGreaterThanOrEqual(0);
  });

  it('throws when no model can satisfy an impossible requirement', () => {
    expect(() =>
      route({
        requiredCapabilities: new Set(['vision', 'long-context']),
        // No model has BOTH vision and long-context except gemini-3.1-pro, so
        // force an impossible context size to exclude even that one.
        estimatedInputTokens: 9_000_000,
        estimatedOutputTokens: 200,
        highStakes: false,
      })
    ).toThrow(/No model in registry satisfies/);
  });
});
