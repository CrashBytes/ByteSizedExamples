# Prompt Caching Cost Optimizer (TypeScript)

Structure an Anthropic Messages request so the stable prefix (system + tools + long context) is cached and only the volatile suffix pays full price — then measure the realized savings from the response `usage` fields and audit a prompt for "silent cache invalidators."

> **Tutorial**: [Full Tutorial on CrashBytes](https://crashbytes.com/tutorials/cut-llm-token-costs-prompt-caching-typescript-2026)

## What You'll Learn

- **Where the cache boundary goes.** Prompt caching is a prefix match (render order is `tools` → `system` → `messages`); the planner places one `cache_control` breakpoint on the last *stable* block and never on the volatile question.
- **The cost math.** How `usage.cache_creation_input_tokens` (~1.25×/2× base input), `usage.cache_read_input_tokens` (~0.1×), and `usage.input_tokens` (full price) combine — and how to turn them into realized dollar savings.
- **Silent cache invalidators.** How a `Date.now()`, a `crypto.randomUUID()`, or an unsorted `JSON.stringify` in the prefix quietly defeats caching, and how to detect them.
- **Minimum cacheable prefix.** Why a 3,000-token prefix caches on Sonnet 5 (2,048-token minimum) but silently will not on Opus 4.8 (4,096) — with no error, just `cache_creation_input_tokens: 0`.
- **Dependency-injected API calls.** How to structure the client so the whole flow is unit-testable offline with a mock.

## Prerequisites

- Node.js 20+
- npm

## Quick Start

```bash
git clone https://github.com/CrashBytes/ByteSizedExamples.git
cd ByteSizedExamples/prompt-caching-cost-optimizer-typescript
npm install
cp .env.example .env
npm start
```

`npm start` runs fully **offline** with no API key: it plans a request, audits a deliberately-poisoned prompt, and prints a simulated savings report (cache write, then cache read). Set `ANTHROPIC_API_KEY` in `.env` to run the same two-request pattern against the live API and watch a real cache write turn into a real cache read.

## Project Structure

```
prompt-caching-cost-optimizer-typescript/
├── src/
│   ├── models.ts             # Pricing + cache multipliers + getPricing()
│   ├── types.ts              # PlanInput, CachePlan, UsageLike, ToolDef, ...
│   ├── cache-planner.ts      # planRequest(): places the cache breakpoint
│   ├── invalidator-audit.ts  # auditForInvalidators(), stableStringify(), auditTools()
│   ├── savings.ts            # computeSavings(): realized $ from usage
│   ├── client.ts             # CachingClient: plan → send → measure (DI'd SDK)
│   └── index.ts              # Runnable demo (online + offline)
├── tests/
│   ├── cache-planner.test.ts
│   ├── invalidator-audit.test.ts
│   ├── savings.test.ts
│   └── client.test.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .env.example
├── LICENSE
└── README.md
```

## Configuration

| Variable            | Required | Description                                                        |
| ------------------- | -------- | ------------------------------------------------------------------ |
| `ANTHROPIC_API_KEY` | No       | If set, the demo calls the live API. If unset, it runs offline with a simulated savings calc. |

## Architecture

```
              ┌─────────────┐
  PlanInput ─▶│ planRequest │─▶ CachePlan
              └─────────────┘   (system[] with cache_control on the last
                                 stable block; tools passed through;
                                 volatile question — NO cache_control)
                     │
                     ▼
        cache_control-annotated request
                     │
                     ▼
        anthropic.messages.create(...)   ◀── dependency-injected (mocked in tests)
                     │
                     ▼
               response.usage
        (input / cache_creation / cache_read)
                     │
                     ▼
              ┌───────────────┐
              │ computeSavings│─▶ SavingsReport
              └───────────────┘   (cacheHitRate, actual vs uncached cost,
                                   savedUsd, savedPct)
```

`invalidator-audit.ts` sits alongside this flow: run `auditForInvalidators` / `auditTools` on any prefix text (and use `stableStringify` for tool sets) *before* you send, to catch the timestamps, UUIDs, and unsorted JSON that would silently defeat the cache.

## Available Scripts

| Script               | Description                                        |
| -------------------- | -------------------------------------------------- |
| `npm start`          | Run the demo (`tsx src/index.ts`) — offline by default. |
| `npm run dev`        | Run the demo in watch mode.                        |
| `npm run build`      | Compile TypeScript to `dist/` (`tsc`).             |
| `npm test`           | Run the test suite once (`vitest run`).            |
| `npm run test:watch` | Run tests in watch mode.                           |
| `npm run type-check` | Type-check without emitting (`tsc --noEmit`).      |

## Testing

```bash
npm test
```

Every test is offline: the Anthropic client is a structural `MessagesCreator` fake that records the request body and returns a canned `usage`, so the planner, audit, savings math, and client wiring are all verified with no network and no API key.

## Related

- [Cut LLM token costs with prompt caching (tutorial)](https://crashbytes.com/tutorials/cut-llm-token-costs-prompt-caching-typescript-2026)
- [Building a resilient multi-provider LLM client in TypeScript](https://crashbytes.com/articles/resilient-multi-provider-llm-client-typescript-2026)

## License

MIT — see [LICENSE](./LICENSE). Copyright (c) 2026 CrashBytes.

Project source: <https://github.com/CrashBytes/ByteSizedExamples/tree/main/prompt-caching-cost-optimizer-typescript>
