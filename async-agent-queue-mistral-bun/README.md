# Async Agent Queue (Bun + Mistral Work mode + OpenAI background mode)

Companion code for the CrashBytes tutorial **[Building a Production Async Agent
Queue in TypeScript with Bun and Mistral Work
Mode](https://crashbytes.com/articles/building-async-agent-queue-mistral-bun-tutorial-2026)**.

A small, single-binary TypeScript queue on Bun that moves long-running coding
agents off the synchronous request/response model and onto async, cloud-
orchestrated jobs: you `POST /jobs`, the queue submits each job to a provider
(Mistral Le Chat Work mode or OpenAI background mode) out-of-band, tracks it in a
Bun SQLite table, reconciles state by polling **or** webhook, enforces a per-job
cost ceiling (cancel-on-over-budget), and exposes a `/jobs` endpoint plus a
five-line status dashboard. The queue owns the truth; the model is
interchangeable behind one `AsyncAgentProvider` interface.

## Run it

```bash
bun install
bun test        # full suite — no API key, no network, no real timers
bun run demo    # offline end-to-end trace: submit → poll → succeed/fail/over-budget
bun run typecheck
```

`bun test` and `bun run demo` are **fully offline**: the queue is driven by an
in-memory `FakeAgentProvider` and an in-memory SQLite database, every timer is
injected as a no-op, and the clock is deterministic. No keys required.

To run the real server against live providers, copy `.env.example` to `.env`,
fill in the Mistral/OpenAI keys and webhook secrets, and:

```bash
bun run serve   # Hono on Bun; real provider adapters + reconcile loop
```

## What's inside

| File | Responsibility |
| --- | --- |
| `src/job.ts` | Zod job schema + the allowed-transitions state machine (`canTransition`). |
| `src/store.ts` | Bun `bun:sqlite` store; every read re-parses through the schema. |
| `src/provider.ts` | The four-method `AsyncAgentProvider` seam and the closed `ProviderState` sum type. |
| `src/providers/mistral.ts` | Real Mistral Le Chat Work-mode adapter (lazy client, HMAC webhook check). |
| `src/providers/openai.ts` | Real OpenAI background-mode adapter (Responses API, `background: true`). |
| `src/providers/fake.ts` | Scriptable in-memory adapter that drives the tests and demo offline. |
| `src/reconcile.ts` | `applyState` — the single transition/budget/cancel/persist chokepoint — and the poll loop. |
| `src/backoff.ts` | Full-jitter exponential backoff for submit retries + the fixed poll cadence. |
| `src/queue.ts` | `AgentQueue`: enqueue, bounded concurrency, retry/backoff, run-to-completion. |
| `src/server.ts` | Hono HTTP layer: `POST /jobs`, `GET /jobs/:id`, `POST /webhooks/:provider`, dashboard. |
| `src/main.ts` | The single-binary `bun run serve` entrypoint wiring the real adapters. |

## Design notes

- **The queue owns the truth.** The provider is authoritative for the agent's
  state (tools, tokens, artifacts); the queue is authoritative for yours
  (applied? billed? notified?). `applyState` is the one place they meet.
- **Poll and webhook are the same code path.** The webhook handler treats the
  callback as a "ping" and re-polls for authoritative state, then reuses
  `applyState` — one parser, not two, and idempotent under duplicate delivery.
- **Budgets are per-job and sticky.** A `pr-review` job might carry a $0.50
  ceiling and a `refactor` a $40 one; a single global ceiling lets small jobs
  cannibalize big ones. Cancel is best-effort, so reserve ~10% overshoot.

## Deviations from the article

The tutorial shows module-level singletons (`const db = ...`, module-global
`store`/`providers`). This project refactors those into `createStore(path)`,
`createServer(deps)`, and an `AgentQueue` class with injectable `sleep`/`now`, so
the exact same logic is exercised deterministically and offline in CI. The
Mistral Work-mode / OpenAI background-mode async surfaces are a 2026 API shape
the published SDKs do not fully type yet, so those calls go through a loosely-
typed handle — swap in the typed methods once the SDKs ship them.

MIT licensed. Part of
[CrashBytes/ByteSizedExamples](https://github.com/CrashBytes/ByteSizedExamples).
