import { describe, it, expect, vi, afterEach } from 'vitest';
import { withTimeout } from '../src/timeout.js';
import { TimeoutError } from '../src/errors.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('withTimeout', () => {
  it('resolves when the operation finishes before the deadline', async () => {
    const result = await withTimeout(async () => 'done', 1000);
    expect(result).toBe('done');
  });

  it('rejects with TimeoutError and aborts the signal when the deadline passes', async () => {
    vi.useFakeTimers();
    let aborted = false;
    const promise = withTimeout((signal) => {
      signal.addEventListener('abort', () => {
        aborted = true;
      });
      return new Promise<string>(() => {
        /* never resolves */
      });
    }, 500);

    const assertion = expect(promise).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(500);
    await assertion;
    expect(aborted).toBe(true);
  });
});
