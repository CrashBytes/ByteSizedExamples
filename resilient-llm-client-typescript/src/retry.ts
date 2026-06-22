/**
 * Exponential backoff with full jitter.
 *
 * Two design choices make this both correct and testable:
 *  - `sleep` and `random` are injectable. Tests pass a no-op sleep and a fixed
 *    random so retries run instantly and delays are deterministic; production
 *    uses real `setTimeout` and `Math.random`.
 *  - The retry decision delegates to `isRetryable`, so a non-retryable error
 *    (bad request, auth, circuit open) fails fast instead of burning attempts.
 */

import { isRetryable as defaultIsRetryable, RateLimitError } from './errors.js';

export interface RetryOptions {
  /** Total attempts, including the first. Default 3. */
  maxAttempts?: number;
  /** Base delay in ms; the first backoff is drawn from [0, baseDelayMs]. */
  baseDelayMs?: number;
  /** Upper bound on any single backoff, in ms. Default 10_000. */
  maxDelayMs?: number;
  isRetryable?: (error: unknown) => boolean;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  onRetry?: (info: { attempt: number; delayMs: number; error: unknown }) => void;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Run `fn`, retrying transient failures with full-jitter exponential backoff.
 * `fn` receives the 1-based attempt number. Honors a `Retry-After` hint when the
 * thrown error is a `RateLimitError`.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 200;
  const maxDelayMs = options.maxDelayMs ?? 10_000;
  const retryable = options.isRetryable ?? defaultIsRetryable;
  const sleep = options.sleep ?? defaultSleep;
  const random = options.random ?? Math.random;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !retryable(error)) throw error;

      // Full jitter: cap = min(max, base * 2^(attempt-1)); delay ∈ [0, cap].
      const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      let delayMs = Math.floor(random() * exponential);

      // A server-provided Retry-After always wins over our computed backoff.
      if (error instanceof RateLimitError && typeof error.retryAfterMs === 'number') {
        delayMs = Math.min(maxDelayMs, error.retryAfterMs);
      }

      options.onRetry?.({ attempt, delayMs, error });
      await sleep(delayMs);
    }
  }
  throw lastError;
}
