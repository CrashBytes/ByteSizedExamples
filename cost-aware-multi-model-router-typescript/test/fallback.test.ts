import { describe, it, expect } from 'vitest';
import { ask, ProviderError, FakeAdapter, buildLogEntry } from '../src/index.js';
import type { RouterResult } from '../src/index.js';
import type { PromptInput } from '../src/classifier.js';

const reasonPrompt: PromptInput = {
  task: 'reason',
  userPrompt: 'Given revenues 1.2M, 1.4M, 1.1M, 1.6M, what is the trend?',
};

describe('fallback ladder', () => {
  it('serves the cheapest capable model when it succeeds (no fallback)', async () => {
    const fake = new FakeAdapter();
    const result = await ask(reasonPrompt, { call: fake.call, log: () => {} });

    expect(result.modelUsed).toBe('claude-sonnet-4.6'); // cheapest mid reasoning model
    expect(result.fallbacksAttempted).toBe(0);
    expect(fake.calls).toEqual(['claude-sonnet-4.6']);
    expect(result.actualCostCents).toBeGreaterThan(0);
  });

  it('escalates up the tiers on retryable failures until one succeeds', async () => {
    const fake = new FakeAdapter({
      'claude-sonnet-4.6': { type: 'error', retryable: true, status: 429 },
      'gemini-3.1-pro': { type: 'error', retryable: true, status: 503 },
      'gpt-5.5-pro': { type: 'ok', text: 'the trend is up' },
    });

    const result = await ask(reasonPrompt, { call: fake.call, log: () => {} });

    // Primary mid failed, mid fallback failed, escalated to the frontier tier.
    expect(result.modelUsed).toBe('gpt-5.5-pro');
    expect(result.decision.primary.tier).toBe('mid');
    expect(result.fallbacksAttempted).toBe(2);
    expect(fake.calls).toEqual([
      'claude-sonnet-4.6',
      'gemini-3.1-pro',
      'gpt-5.5-pro',
    ]);
  });

  it('does NOT retry on a non-retryable ProviderError — it surfaces immediately', async () => {
    const fake = new FakeAdapter({
      'claude-sonnet-4.6': { type: 'error', retryable: false, status: 400 },
    });

    await expect(ask(reasonPrompt, { call: fake.call, log: () => {} })).rejects.toBeInstanceOf(
      ProviderError
    );
    // Ladder stopped at the primary; no escalation to higher tiers.
    expect(fake.calls).toEqual(['claude-sonnet-4.6']);
  });

  it('throws the last error when every tier in the ladder fails', async () => {
    const fake = new FakeAdapter({}, { type: 'error', retryable: true, status: 503 });
    await expect(ask(reasonPrompt, { call: fake.call, log: () => {} })).rejects.toBeInstanceOf(
      ProviderError
    );
    // It walked the whole ladder: primary + two fallbacks.
    expect(fake.calls.length).toBe(3);
  });
});

describe('cost telemetry', () => {
  it('reports the routed cost as far below the all-Opus baseline', async () => {
    const fake = new FakeAdapter();
    let captured: RouterResult | undefined;
    const result = await ask(
      { task: 'extract', userPrompt: 'find the email: a@b.com' },
      { call: fake.call, log: (_i, r) => (captured = r) }
    );

    expect(result.modelUsed).toBe('gemini-3.1-flash-lite');
    expect(captured).toBe(result);

    const entry = buildLogEntry({ task: 'extract', userPrompt: 'find the email: a@b.com' }, result);
    expect(entry.modelUsed).toBe('gemini-3.1-flash-lite');
    expect(entry.modelTier).toBe('floor');
    // The floor call is cheaper than the Opus baseline, so we saved money.
    expect(entry.baselineCostCents).toBeGreaterThan(entry.actualCostCents);
    expect(entry.savedCents).toBeGreaterThan(0);
  });
});
