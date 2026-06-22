# Resilient Multi-Provider LLM Client (TypeScript)

Companion code for the CrashBytes tutorial **[Build a Resilient Multi-Provider
LLM Client in TypeScript: Timeouts, Retries, Circuit Breakers, and
Failover](https://crashbytes.com/articles/resilient-multi-provider-llm-client-typescript-2026)**.

A small, dependency-free TypeScript library that wraps one or more LLM providers
behind a single `chat()` call and makes that call survive the things that
actually break in production: slow upstreams, rate limits, transient 5xx errors,
and whole-provider outages.

```ts
import { ResilientClient, AnthropicProvider } from 'resilient-llm-client-typescript';

const client = new ResilientClient({
  providers: [
    new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY! }),
    // ...add a second provider as a fallback chain
  ],
  timeoutMs: 30_000,
  retry: { maxAttempts: 3, baseDelayMs: 200 },
  breaker: { failureThreshold: 5, cooldownMs: 30_000 },
});

const res = await client.chat({ messages: [{ role: 'user', content: 'Hello!' }] });
console.log(res.provider, res.text);
```

## What it does

| Layer | File | Responsibility |
| --- | --- | --- |
| **Timeout** | `src/timeout.ts` | A hard per-attempt deadline that also aborts the underlying request. |
| **Retry** | `src/retry.ts` | Exponential backoff with full jitter; honors `Retry-After`; never retries non-retryable errors. |
| **Circuit breaker** | `src/circuit-breaker.ts` | Per-provider closed/open/half-open breaker so a dead upstream stops eating your latency budget. |
| **Failover** | `src/client.ts` | Composes the three layers and walks an ordered provider chain. |
| **Providers** | `src/providers/` | `AnthropicProvider` (real, via `fetch`) and `FakeProvider` (scriptable, for tests/demo). |

## Run it

```bash
npm install
npm test        # the full unit suite — no network, no API key
npm run demo    # offline walkthrough of retry → failover → circuit-open
npm run typecheck
```

The tests are fully deterministic: `sleep`, `random`, and the breaker's clock are
all injectable, so backoff and cooldown are exercised without real timers or
flakiness.

## Design notes

- **One interface, the whole library.** Every resilience concern is
  provider-agnostic because providers implement a single `Provider` interface.
  Swap Anthropic for OpenAI, a local model, or a test fake without touching the
  client.
- **Retryability lives in the error type.** `isRetryable` reads a flag off typed
  errors (`RateLimitError`, `ServerError`, `TimeoutError`, `ClientRequestError`)
  instead of string-matching messages at the call site.
- **The breaker counts one failure per exhausted provider**, not per retry — so
  `failureThreshold: 5` means "five `chat()` calls in a row couldn't get an
  answer from this provider," which is the signal you actually want.

MIT licensed. Part of [CrashBytes/ByteSizedExamples](https://github.com/CrashBytes/ByteSizedExamples).
