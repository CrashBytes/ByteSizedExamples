/**
 * A three-state circuit breaker.
 *
 *   closed     → calls flow; consecutive failures are counted.
 *   open       → calls are rejected immediately for `cooldownMs`.
 *   half-open  → a limited number of probe calls are allowed; enough successes
 *                close the circuit, any failure re-opens it.
 *
 * The breaker stops a dead provider from absorbing every request's full
 * timeout-and-retry budget. Once it trips open, the client skips that provider
 * and fails over instantly until the cooldown elapses.
 *
 * `now` is injectable so tests can advance time without real clocks.
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  /** Consecutive failures (while closed) that trip the breaker open. Default 5. */
  failureThreshold?: number;
  /** How long to stay open before allowing a half-open probe, in ms. Default 30_000. */
  cooldownMs?: number;
  /** Successful half-open probes required to fully close. Default 1. */
  successThreshold?: number;
  now?: () => number;
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private openedAt = 0;

  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly successThreshold: number;
  private readonly now: () => number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.cooldownMs = options.cooldownMs ?? 30_000;
    this.successThreshold = options.successThreshold ?? 1;
    this.now = options.now ?? Date.now;
  }

  get currentState(): CircuitState {
    return this.state;
  }

  /**
   * Whether a request may proceed. Calling this can transition an expired
   * `open` circuit into `half-open`, so treat a `true` result as permission to
   * make exactly one attempt and then report it via `onSuccess`/`onFailure`.
   */
  canRequest(): boolean {
    if (this.state === 'open') {
      if (this.now() - this.openedAt >= this.cooldownMs) {
        this.state = 'half-open';
        this.successes = 0;
        return true;
      }
      return false;
    }
    return true;
  }

  onSuccess(): void {
    if (this.state === 'half-open') {
      if (++this.successes >= this.successThreshold) this.close();
    } else {
      this.failures = 0;
    }
  }

  onFailure(): void {
    if (this.state === 'half-open') {
      this.open();
      return;
    }
    if (++this.failures >= this.failureThreshold) this.open();
  }

  private open(): void {
    this.state = 'open';
    this.openedAt = this.now();
    this.failures = 0;
    this.successes = 0;
  }

  private close(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
  }
}
