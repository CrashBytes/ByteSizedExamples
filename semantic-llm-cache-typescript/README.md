# semantic-llm-cache-typescript

A small, dependency-free **semantic cache for LLM responses**, in TypeScript.

Unlike an exact-match cache, this one keys on *meaning*: it embeds the prompt,
finds the nearest already-answered prompt by **cosine similarity**, and reuses
that response when the two are close enough. That turns a slow, expensive model
call (~500-2000ms) into a local lookup (~single-digit ms) — not just for
verbatim repeats, but for paraphrases of a question you have already answered.

Companion code for the CrashBytes tutorial:
**[Build a Semantic LLM Cache in TypeScript](https://crashbytes.com/articles/build-semantic-llm-cache-typescript-tutorial-2026)**

## Features

- `SemanticCache` — `getOrCompute(prompt, computeFn)`, `lookup(prompt)`, `stats()`
- Cosine-similarity threshold tuning (default `0.95`)
- TTL expiry and LRU-style eviction at `maxEntries`
- Pluggable `Embedder` and `VectorStore` interfaces
- `MockEmbedder` — deterministic, hash-based; **no network or API key** required
- **Zero runtime dependencies** (dev-only: TypeScript + Vitest)

## Install & run

```bash
git clone https://github.com/CrashBytes/ByteSizedExamples.git
cd ByteSizedExamples/semantic-llm-cache-typescript
npm install
npm run typecheck
npm test
```

## Usage

```ts
import { SemanticCache, MockEmbedder } from "./src/index.js";

const cache = new SemanticCache({
  embedder: new MockEmbedder(),   // swap for a real embeddings-API embedder in prod
  threshold: 0.9,
  ttlMs: 60 * 60 * 1000,
  maxEntries: 1000,
});

// Only calls the model on a miss:
const answer = await cache.getOrCompute(
  "Summarize the quarterly earnings report",
  async (prompt) => callYourLLM(prompt),
);

console.log(cache.stats()); // { hits, misses, hitRate, size }
```

To use a real embedding model, implement the `Embedder` interface
(`embed(text: string): Promise<number[]>`) against your provider and pass it in
place of `MockEmbedder` — nothing else changes.

## Project layout

| Path | What |
|------|------|
| `src/types.ts` | `Embedder`, `VectorStore`, `CacheEntry`, `CacheStats`, config types |
| `src/similarity.ts` | `cosineSimilarity(a, b)` |
| `src/embedder.ts` | `MockEmbedder` (deterministic hash-based) |
| `src/store.ts` | `InMemoryVectorStore` (brute-force nearest-neighbor) |
| `src/cache.ts` | `SemanticCache` (embed → nearest → threshold → TTL/LRU) |
| `src/index.ts` | Barrel export |
| `test/` | Vitest suites (similarity, embedder, cache) |

## License

MIT
