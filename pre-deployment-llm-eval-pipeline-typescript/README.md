# Pre-Deployment LLM Evaluation Pipeline (TypeScript)

Companion code for the CrashBytes tutorial **[Build a Pre-Deployment LLM
Evaluation Pipeline in
TypeScript](https://crashbytes.com/articles/pre-deployment-llm-evaluation-pipelines)**.

A small, dependency-free TypeScript harness that turns "does the model still do
its job?" into a CI gate. It runs a suite of eval cases across three families —
**capability**, **safety**, and **regression** — against a model, scores each
with a deterministic grader, applies per-family pass-rate thresholds, and
**exits non-zero to block a deploy** when the gate fails. It is not a dashboard
you check after shipping; it is the check that fails the PR before the bad
change merges.

Everything runs **fully offline against a deterministic fake model** — `npm
test`, `npm run demo`, and `npm run gate` need **no API key and no network**. A
real OpenAI-compatible adapter (`src/lib/openai-model.ts`, `fetch`-based, no SDK)
is included but never required.

```ts
import { FakeModel, runGate, renderScorecard } from 'pre-deployment-llm-eval-pipeline-typescript';

const { modelName, results, outcome } = await runGate(new FakeModel('good'));
console.log(renderScorecard(modelName, results, outcome));
process.exit(outcome.passed ? 0 : 1); // <- the deploy gate
```

## What it does

| Layer            | File                          | Responsibility                                                              |
| ---------------- | ----------------------------- | --------------------------------------------------------------------------- |
| **Case types**   | `src/lib/types.ts`            | `EvalCase` / `EvalResult` shapes + a load-time validator (`parseEvalCase`). |
| **Graders**      | `src/lib/graders*.ts`         | `exact`, `substring`, `regex`, `refusal`, `jsonShape`, `snapshot`, `judge`. |
| **Model**        | `src/lib/{model,fake-model,openai-model}.ts` | Injectable `Model` interface; offline fake + optional real adapter. |
| **Runner**       | `src/lib/runner.ts`           | Loads cases, runs them serially, aggregates per-family pass rates.          |
| **Gate**         | `src/lib/gate.ts`             | Applies the pass-rate policy and returns pass/fail.                         |
| **Report**       | `src/lib/report.ts`           | Renders the scorecard printed locally and posted as a PR comment in CI.     |
| **Cases**        | `src/eval/{capability,safety,regression}/*.json` | The declarative eval dataset + a frozen regression snapshot. |
| **Gate CLI**     | `src/cli.ts`                  | `npm run gate` — runs the suite and exits non-zero on failure.             |

The gate policy is zero-tolerance on capability and safety (one fail trips it)
and allows 5% slack on regression, since LLM outputs are not bit-exact
reproducible even at temperature 0:

```ts
export const DEFAULT_POLICY = {
  capability: { minPassRate: 1.0 },
  safety: { minPassRate: 1.0 },
  regression: { minPassRate: 0.95 },
};
```

## Run it

```bash
npm install
npm test          # full vitest suite — no network, no API key
npm run demo      # offline: runs the suite for a healthy AND a regressed deploy, prints scorecards
npm run gate      # the real gate: prints the scorecard and EXITS non-zero on failure
npm run typecheck
```

Show both gate outcomes:

```bash
npm run gate ; echo "exit=$?"                        # passing dataset  -> exit=0
EVAL_MODEL_MODE=regressed npm run gate ; echo "exit=$?"  # regressed model -> exit=1
npm run gate -- --fail ; echo "exit=$?"              # same, via a flag  -> exit=1
```

## Wire it into CI

The whole point is the non-zero exit. Make the gate the last step of a CI job so
a failing gate fails the check and blocks the merge (see
`.github/workflows/llm-eval.yml`):

```yaml
- run: npm install
- run: npm test
- name: Run the deploy gate
  run: npm run gate     # exits 1 when capability/safety/regression fall below policy
```

Because the shipped harness runs against the fake model, CI needs **no secrets**.
To gate against a real endpoint, swap `new FakeModel('good')` for
`modelFromEnv()` (reads `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `EVAL_MODEL` — see
`.env.example`) and add the key as a CI secret.

## Re-baselining a regression snapshot

Snapshots are change-controlled state, not flaky fixtures. When an intentional
prompt change shifts an output, re-baseline in the same PR that justifies it:

```bash
EVAL_UPDATE_SNAPSHOTS=1 npm run gate   # rewrites src/eval/regression/snapshots/*, then commit them
```

## Notes / deviations from the tutorial

- The tutorial validates cases with `zod` and calls the model through the OpenAI
  SDK. To keep this companion **dependency-free and offline-first** (identical
  toolchain to the rest of ByteSizedExamples), case validation is hand-rolled in
  `parseEvalCase` and the real adapter uses `fetch`. The types, module
  decomposition, grader set, runner, and gate policy match the article.
- The `judge` grader (LLM-as-judge) is included as a **deterministic stub** — the
  tutorial deliberately leaves real LLM-judging out of the core gate. Swap its
  body for a model call when you need it; the grader interface is unchanged.

MIT licensed. Part of [CrashBytes/ByteSizedExamples](https://github.com/CrashBytes/ByteSizedExamples).
