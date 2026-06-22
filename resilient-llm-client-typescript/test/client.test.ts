import { describe, it, expect, vi } from 'vitest';
import { ResilientClient } from '../src/client.js';
import { FakeProvider } from '../src/providers/fake.js';
import { AllProvidersFailedError, ServerError } from '../src/errors.js';
import type { ChatRequest } from '../src/types.js';

const request: ChatRequest = { messages: [{ role: 'user', content: 'hi' }] };
// No-op sleep keeps retries instant; one retry so the math is easy to follow.
const fastRetry = { sleep: async () => {}, maxAttempts: 2 };

describe('ResilientClient', () => {
  it('requires at least one provider', () => {
    expect(() => new ResilientClient({ providers: [] })).toThrow();
  });

  it('returns the primary provider response on success', async () => {
    const primary = new FakeProvider('primary', [{ type: 'ok', text: 'from primary' }]);
    const secondary = new FakeProvider('secondary', [{ type: 'ok', text: 'from secondary' }]);
    const client = new ResilientClient({ providers: [primary, secondary], retry: fastRetry });

    const res = await client.chat(request);
    expect(res.text).toBe('from primary');
    expect(res.provider).toBe('primary');
    expect(secondary.calls).toBe(0);
  });

  it('fails over to the next provider when the primary is exhausted', async () => {
    const primary = new FakeProvider('primary', [{ type: 'error', error: new ServerError('down', 503) }]);
    const secondary = new FakeProvider('secondary', [{ type: 'ok', text: 'rescued' }]);
    const onFailover = vi.fn();
    const client = new ResilientClient({
      providers: [primary, secondary],
      retry: fastRetry,
      onFailover,
    });

    const res = await client.chat(request);
    expect(res.text).toBe('rescued');
    expect(res.provider).toBe('secondary');
    // primary retried up to maxAttempts before failing over
    expect(primary.calls).toBe(2);
    expect(onFailover).toHaveBeenCalledOnce();
  });

  it('throws AllProvidersFailedError when every provider fails', async () => {
    const a = new FakeProvider('a', [{ type: 'error', error: new ServerError('a down', 500) }]);
    const b = new FakeProvider('b', [{ type: 'error', error: new ServerError('b down', 500) }]);
    const client = new ResilientClient({ providers: [a, b], retry: fastRetry });

    await expect(client.chat(request)).rejects.toBeInstanceOf(AllProvidersFailedError);
  });

  it('opens a provider circuit after repeated failures and skips it', async () => {
    const flaky = new FakeProvider('flaky', [{ type: 'error', error: new ServerError('down', 500) }]);
    const backup = new FakeProvider('backup', [{ type: 'ok', text: 'backup' }]);
    const client = new ResilientClient({
      providers: [flaky, backup],
      retry: { sleep: async () => {}, maxAttempts: 1 },
      breaker: { failureThreshold: 2, cooldownMs: 60_000 },
    });

    // Two calls: each records one failure on the flaky breaker; after the
    // second it should be open.
    await client.chat(request);
    await client.chat(request);
    expect(client.breakerState('flaky')).toBe('open');

    const callsBefore = flaky.calls;
    const res = await client.chat(request);
    // The open circuit means flaky is not invoked again; backup serves it.
    expect(flaky.calls).toBe(callsBefore);
    expect(res.provider).toBe('backup');
  });
});
