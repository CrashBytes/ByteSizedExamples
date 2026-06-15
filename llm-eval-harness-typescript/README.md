# LLM-as-Judge Evaluation Harness (TypeScript)

Companion code for the CrashBytes tutorial
**[Build an LLM-as-Judge Evaluation Harness in TypeScript](https://crashbytes.com/articles/build-llm-eval-harness-judge-typescript-2026)**.

A small, dependency-free harness for evaluating LLM and agent outputs. It gives
you the four pieces every real eval setup needs:

1. **Test cases** — `input`, optional gold `expected`, tags, metadata.
2. **Scorers** — cheap deterministic ones (`exactMatch`, `includes`,
   `regexMatch`, `similarity`, `jsonField`) and an LLM-as-judge `rubricScorer`,
   all returning a normalized score in `[0, 1]` so they compose.
3. **A runner** — concurrency-capped, per-case error isolation, retries, and
   weighted aggregation into a `RunReport`.
4. **A CI gate** — turn a report into pass/fail with human-readable reasons,
   including regression detection against a stored baseline.

The whole thing is provider-agnostic: the judge is just a
`(prompt: string) => Promise<string>` function, so you wrap your real model in
production and pass a deterministic fake in tests.

## Install & run

```bash
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run example     # build + run the end-to-end quickstart
```

## Quick start

```ts
import { runEval, gate, includes, rubricScorer } from './src/index.js'

const judge = async (prompt: string) => callYourModel(prompt) // e.g. Claude

const report = await runEval(testCases, {
  target: (input) => myAgent(input),
  scorers: [
    includes(),
    rubricScorer(judge, {
      criteria: [
        { name: 'helpfulness', description: 'directly answers the user', weight: 2 },
        { name: 'safety', description: 'no harmful content' },
      ],
      scale: 5,
    }),
  ],
  weights: { includes: 1, rubric: 2 },
  threshold: 0.7,
  concurrency: 4,
})

const result = gate(report, { minPassRate: 0.8, minMeanScore: 0.7 })
process.exit(result.ok ? 0 : 1)
```

## Wiring the judge to Claude

```ts
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic()

const judge = async (prompt: string) => {
  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })
  return msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
}
```

## Layout

| File                  | Purpose                                                        |
| --------------------- | ------------------------------------------------------------- |
| `src/types.ts`        | `TestCase`, `Scorer`, `Target`, `CaseResult`, `RunReport`     |
| `src/scorers.ts`      | Deterministic reference-based scorers + Levenshtein           |
| `src/rubric.ts`       | Build judge prompts, parse + validate judge JSON              |
| `src/judge.ts`        | `rubricScorer` — the LLM-as-judge scorer                      |
| `src/runner.ts`       | `runEval` — concurrency, retries, weighting, aggregation      |
| `src/gate.ts`         | `gate` — CI thresholds + regression detection                 |
| `src/concurrency.ts`  | `pLimit` — dependency-free concurrency cap                    |
| `src/json.ts`         | `extractJson` — pull JSON out of fenced / prose-wrapped text  |
| `examples/quickstart.ts` | Runnable end-to-end demo                                    |

MIT licensed.
