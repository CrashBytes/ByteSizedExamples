# Cost-Aware Multi-Model AI Router (TypeScript)

Companion code for the CrashBytes tutorial **[Build a Cost-Aware Multi-Model AI
Router in
TypeScript](https://crashbytes.com/articles/cost-aware-multi-model-router-typescript-tutorial-2026)**.

A thin, dependency-free TypeScript service that classifies each incoming prompt,
routes it to the **cheapest model that can actually answer it**, escalates up a
fallback ladder on failure, and emits per-request cost telemetry so you can prove
the router saved money. On a mixed enterprise workload this pattern typically
cuts inference spend 60–85% with no measurable quality loss — capturing the
$0.25/M-token price floor without giving up the frontier ceiling.

```ts
import { ask, FakeAdapter } from 'cost-aware-multi-model-router-typescript';

const fake = new FakeAdapter(); // swap for the real provider fan-out in prod
const result = await ask(
  { task: 'extract', userPrompt: 'Find the email: contact me at foo@bar.com.' },
  { call: fake.call }
);
console.log(result.modelUsed, result.actualCostCents); // gemini-3.1-flash-lite, ...
```

## What it does

| Part | File | Responsibility |
| --- | --- | --- |
| **Model registry** | `src/registry.ts` | Static, priced catalog of models with capability tags, context windows, and eval scores. |
| **Prompt classifier** | `src/classifier.ts` | Turns a declared task into required capabilities, token estimates, and a high-stakes flag. |
| **Router** | `src/router.ts` | Picks the cheapest model that covers the requirement; builds the fallback ladder. |
| **Fallback ladder** | `src/index.ts` (`ask`) | Walks one model per higher tier, escalating on retryable failures. |
| **Cost telemetry** | `src/telemetry.ts` | Per-request structured log with actual cost and the all-Opus baseline it beat. |
| **Providers** | `src/providers/` | Real `fetch` adapters (Anthropic/OpenAI/Google) **and** a `FakeAdapter` for offline tests/demo. |

## Run it

```bash
npm install
npm test        # full vitest suite — no network, no API key
npm run demo    # offline routing walkthrough + fallback-ladder escalation
npm run typecheck
```

Everything runs **fully offline**. `ask()` takes the provider call as an
injectable dependency, so the tests and the demo hand it the in-memory
`FakeAdapter` — no keys, no network. Wire the real adapters in
`src/providers/index.ts` (and copy `.env.example` to `.env`) only when you want
to route live traffic.

## Design notes

- **Prices live in code, not a database.** Model prices change quarterly, but the
  changes are pull requests you review — not runtime mutations.
- **The caller declares the task.** The classifier does not guess capabilities
  from the prompt text; declared task + high-stakes flag captures ~90% of the
  savings for ~5% of the effort.
- **The router is dumb on purpose.** No state, no learned policy, no
  LLM-as-a-judge in the hot path — dumb routers survive contact with production
  traffic in a way clever ones do not.
- **Telemetry ships first.** Every routed request logs what it would have cost on
  the all-Opus baseline, so "how much did the router save this month?" is a
  one-line aggregation.

## Deviations from the article

The article's replay-harness fixture for the high-stakes agent prompt asserts a
`frontier` routing decision. With the article's own registry that cannot hold:
`gemini-3.1-pro` is a **mid** model that carries *every* capability and a 2M
context window, so the cheapest-capable router settles on the mid tier (the
high-stakes flag only excludes the floor tier). This project keeps the article's
router logic verbatim and pins the fixture to `mid`, the value the code actually
produces. The frontier tier is exercised instead by the fallback-ladder tests,
where floor/mid failures escalate a request all the way to `gpt-5.5-pro`.

MIT licensed. Part of
[CrashBytes/ByteSizedExamples](https://github.com/CrashBytes/ByteSizedExamples).
