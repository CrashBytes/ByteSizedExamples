// src/backoff.ts
//
// Backoff + poll timing. The tutorial polls in-flight jobs on a fixed
// `POLL_INTERVAL_MS` and lets the queue own retries directly (instead of an
// HTTP-level retry storm). This module holds both knobs so they are testable in
// isolation: exponential backoff with full jitter for submit retries, and the
// fixed poll interval for the reconcile loop.

export interface BackoffOptions {
  /** Delay for the first retry, in ms. */
  baseMs?: number
  /** Growth factor per attempt. */
  factor?: number
  /** Upper bound so we never sleep forever. */
  maxMs?: number
  /** Full-jitter randomizes the delay in [0, raw]. Disable for exact tests. */
  jitter?: boolean
  /** Injectable RNG so tests are deterministic. */
  random?: () => number
}

/**
 * Full-jitter exponential backoff. `attempt` is 0-based: attempt 0 is the first
 * retry. Returns milliseconds to sleep before the next try.
 */
export function backoffDelay(attempt: number, opts: BackoffOptions = {}): number {
  const {
    baseMs = 200,
    factor = 2,
    maxMs = 30_000,
    jitter = true,
    random = Math.random,
  } = opts
  const raw = Math.min(maxMs, baseMs * Math.pow(factor, Math.max(0, attempt)))
  if (!jitter) return Math.round(raw)
  // Full jitter: sleep a random amount in [0, raw]. Smooths thundering herds.
  return Math.round(random() * raw)
}

/** Real timer sleep. Tests inject a no-op instead so nothing waits. */
export function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** The reconcile loop's fixed cadence from the tutorial. */
export const POLL_INTERVAL_MS = 30_000
