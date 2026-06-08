/**
 * semantic-llm-cache-typescript
 *
 * A small, dependency-free semantic cache for LLM responses. Public surface:
 *
 *  - {@link SemanticCache}      — the cache: getOrCompute / lookup / stats.
 *  - {@link MockEmbedder}       — deterministic embedder for tests/local dev.
 *  - {@link InMemoryVectorStore}— brute-force vector store (the default).
 *  - {@link cosineSimilarity}   — the similarity metric the cache keys on.
 *  - types: Embedder, VectorStore, CacheEntry, CacheStats, SemanticCacheConfig…
 */
export { SemanticCache } from "./cache.js";
export { MockEmbedder } from "./embedder.js";
export { InMemoryVectorStore } from "./store.js";
export { cosineSimilarity } from "./similarity.js";
export type {
  Embedder,
  VectorStore,
  CacheEntry,
  CacheStats,
  NearestMatch,
  SemanticCacheConfig,
} from "./types.js";
