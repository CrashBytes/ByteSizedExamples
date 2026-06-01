# Agent Memory Layer (TypeScript)

Companion code for the CrashBytes tutorial
**[Build a Durable Agent Memory Layer in TypeScript: Recall, Summarize, Evict](https://crashbytes.com/articles/build-durable-agent-memory-layer-typescript-2026)**.

A durable agent memory layer in ~400 lines: a typed memory record and swappable
store, embeddings behind a one-function interface, hybrid ranking that beats pure
similarity, scoped budget-aware recall, rolling summarization that keeps the
store bounded, and eviction policies with a salience safety valve — all tested.

> The context window is **working memory** — bounded, volatile, paid for on every
> request. This layer is the durable, unbounded store beside it, plus the
> retrieval step that bridges the two. See
> [the context window is not memory](https://crashbytes.com/articles/context-window-is-not-memory-agent-memory-2026)
> for the why.

## The six parts

| File               | Responsibility                                                       |
| ------------------ | -------------------------------------------------------------------- |
| `src/types.ts`     | `MemoryRecord`, `RecallQuery`, and the `MemoryStore` interface       |
| `src/jsonStore.ts` | A durable JSON-file backend implementing `MemoryStore`               |
| `src/embeddings.ts`| `Embedder` interface + an OpenAI-compatible implementation           |
| `src/similarity.ts`| Cosine similarity for exact nearest-neighbor over small scopes       |
| `src/ranking.ts`   | Hybrid ranking: similarity + recency decay + salience + usage        |
| `src/memory.ts`    | `MemoryLayer` — `remember()` and budget-packed `recall()`            |
| `src/summarize.ts` | Rolling summarization: fold the oldest episodic cluster to semantic  |
| `src/eviction.ts`  | TTL, capacity, and salience-floor eviction                           |
| `src/agentLoop.ts` | `runTurn()` — recall → model call → remember → maintain              |

## Quickstart

```bash
npm install
npm test          # runs the vitest suite (no API key needed — uses a stub embedder)
npm run typecheck
```

To use real embeddings and summarization, supply an OpenAI-compatible API key:

```ts
import { MemoryLayer, JsonStore, openAIEmbedder } from './src/index.js'

const store = new JsonStore('./memory.json')
const embed = openAIEmbedder(process.env.OPENAI_API_KEY!)
const memory = new MemoryLayer(store, embed)

await memory.remember({ scope: 'user:agent', content: 'User runs on GKE.', kind: 'semantic' })
const recalled = await memory.recall({
  scope: 'user:agent',
  text: 'where does the user deploy?',
  tokenBudget: 800,
})
```

## Notes

- **Recall is hybrid, not just similarity.** Pure cosine has no sense of time or
  importance; the ranker blends similarity, recency (exponential decay with a
  half-life), salience, and usage frequency. Tune the weights in `ranking.ts`.
- **Memory is an untrusted input.** Anything the agent ingests can carry a
  planted instruction that resurfaces later with the authority of "the agent's
  own memory." Treat recalled memory as data that informs the model, never as a
  command, and gate privileged actions on signed authorization — not on a
  recalled fact. See
  [prompt injection is the threat model](https://crashbytes.com/articles/prompt-injection-agent-security-threat-model-2026).
- **The JSON store is for learning.** It loads everything into memory and
  rewrites the whole file on every put. Swap in pgvector or SQLite + a vector
  extension behind the same `MemoryStore` interface for production; nothing above
  the interface changes.

## License

MIT
