# Parallel Subagent Orchestrator (TypeScript)

Companion code for the CrashBytes tutorial
**[Build a Parallel Subagent Orchestrator in TypeScript](https://crashbytes.com/articles/build-parallel-subagent-orchestrator-typescript-2026)**.

A small, dependency-light orchestrator for running many LLM "subagents" at
once: bounded-concurrency fan-out, automatic retries, schema-validated
structured output, and barrier-free pipelines. It is provider-agnostic — wire
in Anthropic, OpenAI, a local model, or a deterministic mock through a single
`CompletionFn` interface.

## Why

The 2026 frontier models ship parallel-subagent workflows as a first-class
feature. The pattern underneath is simple and worth owning yourself: a fixed
pool of workers pulling from a shared queue, each call retried and validated,
results returned in order. This repo is that pattern in ~150 lines of typed,
tested code.

## Install & run

```bash
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run build       # emit dist/
```

## The API

| Export                | What it does                                                              |
| --------------------- | ------------------------------------------------------------------------- |
| `mapWithConcurrency`  | Run a worker over items with at most N in flight; results stay in order.  |
| `parallel`            | Fan tasks out across subagents; never rejects — each settles.             |
| `pipeline`            | Thread items through stages with no barrier between stages.               |
| `runTask`             | Run one task with bounded retries + optional schema validation.           |
| `llmTask`             | Build a `Task` from a prompt + a `CompletionFn`, with optional JSON schema.|
| `extractJson`         | Pull the first JSON value out of a prose/fenced completion.               |

### Fan out a fleet of subagents

```ts
import { llmTask, parallel } from 'parallel-subagent-orchestrator'
import { z } from 'zod'

const Finding = z.object({ file: z.string(), severity: z.number().int() })

const tasks = changedFiles.map((file) =>
  llmTask({
    name: `review:${file}`,
    prompt: `Review ${file} and return JSON {file, severity}.`,
    complete,            // your CompletionFn
    validate: Finding,   // malformed output is retried automatically
  }),
)

const settled = await parallel(tasks, { concurrency: 8, maxRetries: 2 })
const findings = settled.filter((s) => s.status === 'fulfilled').map((s) => s.value)
```

### Wiring a real provider

`complete` is any `(prompt: string) => Promise<string>`. With the Anthropic SDK:

```ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()
const complete = async (prompt: string) => {
  const res = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  return res.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
}
```

## Layout

```
src/
  concurrency.ts   bounded-concurrency scheduler (the primitive)
  orchestrator.ts  runTask / parallel / pipeline
  llm.ts           CompletionFn, llmTask, extractJson
  types.ts         Task, Settled, Validator, RunOptions
  index.ts         public exports
test/
  concurrency.test.ts
  orchestrator.test.ts
  llm.test.ts
```

MIT licensed. Part of [Byte Sized Examples](https://github.com/CrashBytes/ByteSizedExamples).
