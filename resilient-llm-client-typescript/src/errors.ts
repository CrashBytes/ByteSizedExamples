/**
 * Typed errors plus a single `isRetryable` predicate.
 *
 * The retry layer and the failover layer both make decisions by asking one
 * question: "is this error worth trying again?" Encoding retryability into the
 * error type — instead of string-matching messages at the call site — is what
 * keeps that decision in one place and testable.
 */

export class LLMError extends Error {
  /** Whether retrying the *same* provider could plausibly succeed. */
  readonly retryable: boolean;

  constructor(message: string, retryable: boolean, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
    this.retryable = retryable;
  }
}

/** 429 — back off and retry. Carries the server's Retry-After when present. */
export class RateLimitError extends LLMError {
  readonly retryAfterMs?: number;

  constructor(message = 'rate limited', retryAfterMs?: number) {
    super(message, true);
    this.retryAfterMs = retryAfterMs;
  }
}

/** 5xx — transient upstream failure, safe to retry. */
export class ServerError extends LLMError {
  readonly status?: number;

  constructor(message = 'upstream server error', status?: number) {
    super(message, true);
    this.status = status;
  }
}

/** The request exceeded its per-attempt time budget. */
export class TimeoutError extends LLMError {
  constructor(message = 'request timed out') {
    super(message, true);
  }
}

/** 4xx that won't fix itself: bad request, auth, not found. Do not retry. */
export class ClientRequestError extends LLMError {
  readonly status?: number;

  constructor(message = 'client request error', status?: number) {
    super(message, false);
    this.status = status;
  }
}

/** The provider's circuit breaker is open, so the call was not attempted. */
export class CircuitOpenError extends LLMError {
  readonly providerName: string;

  constructor(providerName: string) {
    super(`circuit open for provider "${providerName}"`, false);
    this.providerName = providerName;
  }
}

/** Every provider in the chain failed. Carries the per-provider causes. */
export class AllProvidersFailedError extends Error {
  readonly failures: ReadonlyArray<{ provider: string; error: unknown }>;

  constructor(failures: ReadonlyArray<{ provider: string; error: unknown }>) {
    super(
      `all ${failures.length} provider(s) failed: ` +
        failures.map((f) => `${f.provider} (${describe(f.error)})`).join('; '),
    );
    this.name = 'AllProvidersFailedError';
    this.failures = failures;
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Decide whether an arbitrary thrown value is worth retrying. `LLMError`
 * carries its own answer; anything else is treated as a network-ish failure and
 * retried only if it looks like a transient connection problem.
 */
export function isRetryable(error: unknown): boolean {
  if (error instanceof LLMError) return error.retryable;
  if (error instanceof Error) {
    return /ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|network|fetch failed/i.test(
      error.message,
    );
  }
  return false;
}
