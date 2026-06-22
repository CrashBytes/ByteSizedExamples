import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../src/retry.js';
import { ClientRequestError, RateLimitError, ServerError } from '../src/errors.js';

const noSleep = async (): Promise<void> => {};

describe('withRetry', () => {
  it('returns the result without retrying on first success', async () => {
    const fn = vi.fn(async () => 'ok');
    const result = await withRetry(fn, { sleep: noSleep });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries a retryable error and then succeeds', async () => {
    let attempt = 0;
    const fn = vi.fn(async () => {
      attempt++;
      if (attempt < 3) throw new ServerError('boom', 503);
      return 'ok';
    });
    const result = await withRetry(fn, { maxAttempts: 3, sleep: noSleep });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('gives up after maxAttempts and throws the last error', async () => {
    const fn = vi.fn(async () => {
      throw new ServerError('still down', 500);
    });
    await expect(withRetry(fn, { maxAttempts: 3, sleep: noSleep })).rejects.toBeInstanceOf(
      ServerError,
    );
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry a non-retryable error', async () => {
    const fn = vi.fn(async () => {
      throw new ClientRequestError('bad request', 400);
    });
    await expect(withRetry(fn, { maxAttempts: 5, sleep: noSleep })).rejects.toBeInstanceOf(
      ClientRequestError,
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('uses full-jitter exponential backoff with the injected random', async () => {
    const delays: number[] = [];
    let attempt = 0;
    const fn = async () => {
      attempt++;
      if (attempt < 3) throw new ServerError('retry me', 502);
      return 'ok';
    };
    await withRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 200,
      random: () => 0.5,
      sleep: noSleep,
      onRetry: ({ delayMs }) => delays.push(delayMs),
    });
    // attempt 1 cap = 200 -> 0.5*200 = 100; attempt 2 cap = 400 -> 0.5*400 = 200
    expect(delays).toEqual([100, 200]);
  });

  it('honors a RateLimitError Retry-After over computed backoff', async () => {
    const delays: number[] = [];
    let attempt = 0;
    const fn = async () => {
      attempt++;
      if (attempt < 2) throw new RateLimitError('slow down', 1234);
      return 'ok';
    };
    await withRetry(fn, {
      maxAttempts: 2,
      random: () => 0.99,
      sleep: noSleep,
      onRetry: ({ delayMs }) => delays.push(delayMs),
    });
    expect(delays).toEqual([1234]);
  });
});
