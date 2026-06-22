/**
 * The resilient client: it composes the timeout, retry, and circuit-breaker
 * layers into a single `chat()` call that fails over across an ordered list of
 * providers.
 *
 * Per request, for each provider in order:
 *   1. Skip it instantly if its circuit breaker is open.
 *   2. Otherwise run `provider.chat` wrapped in a per-attempt timeout, wrapped
 *      in retry-with-backoff.
 *   3. On success, record it on the breaker and return.
 *   4. On exhausting that provider, record one failure on its breaker and fall
 *      over to the next.
 * If every provider fails, throw `AllProvidersFailedError` with all causes.
 */

import { CircuitBreaker, type CircuitBreakerOptions } from './circuit-breaker.js';
import { AllProvidersFailedError, CircuitOpenError } from './errors.js';
import { withRetry, type RetryOptions } from './retry.js';
import { withTimeout } from './timeout.js';
import type { ChatRequest, ChatResponse, Provider } from './types.js';

export interface ResilientClientOptions {
  /** Ordered fallback chain — index 0 is primary. Must be non-empty. */
  providers: Provider[];
  /** Per-attempt deadline in ms. Default 30_000. */
  timeoutMs?: number;
  /** Retry policy applied per provider (the timeout counts as one attempt). */
  retry?: RetryOptions;
  /** Circuit-breaker config applied to every provider. */
  breaker?: CircuitBreakerOptions;
  onProviderError?: (info: { provider: string; error: unknown }) => void;
  onFailover?: (info: { from: string; to: string; error: unknown }) => void;
}

export class ResilientClient {
  private readonly providers: Provider[];
  private readonly timeoutMs: number;
  private readonly retry: RetryOptions;
  private readonly breakers = new Map<string, CircuitBreaker>();
  private readonly onProviderError?: ResilientClientOptions['onProviderError'];
  private readonly onFailover?: ResilientClientOptions['onFailover'];

  constructor(options: ResilientClientOptions) {
    if (!options.providers || options.providers.length === 0) {
      throw new Error('ResilientClient requires at least one provider');
    }
    this.providers = options.providers;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.retry = options.retry ?? {};
    this.onProviderError = options.onProviderError;
    this.onFailover = options.onFailover;
    for (const provider of this.providers) {
      this.breakers.set(provider.name, new CircuitBreaker(options.breaker));
    }
  }

  /** Inspect a provider's breaker state (useful for health checks / tests). */
  breakerState(providerName: string): string | undefined {
    return this.breakers.get(providerName)?.currentState;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const failures: Array<{ provider: string; error: unknown }> = [];

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const breaker = this.breakers.get(provider.name)!;

      if (!breaker.canRequest()) {
        failures.push({ provider: provider.name, error: new CircuitOpenError(provider.name) });
        this.failover(i, new CircuitOpenError(provider.name));
        continue;
      }

      try {
        const response = await withRetry(
          () => withTimeout((signal) => provider.chat(request, signal), this.timeoutMs),
          this.retry,
        );
        breaker.onSuccess();
        return response;
      } catch (error) {
        breaker.onFailure();
        failures.push({ provider: provider.name, error });
        this.onProviderError?.({ provider: provider.name, error });
        this.failover(i, error);
      }
    }

    throw new AllProvidersFailedError(failures);
  }

  private failover(index: number, error: unknown): void {
    const next = this.providers[index + 1];
    if (next) {
      this.onFailover?.({ from: this.providers[index].name, to: next.name, error });
    }
  }
}
