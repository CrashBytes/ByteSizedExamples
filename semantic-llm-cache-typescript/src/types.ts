/**
 * Shared types for the semantic LLM cache.
 *
 * The cache is deliberately provider-agnostic: it knows nothing about which
 * model produced a `response`, only how to embed a prompt, compare two
 * embeddings, and decide whether a stored response is close enough to reuse.
 */

/**
 * Turns arbitrary text into a fixed-dimension vector. Implementations may call
 * a hosted embedding API, a local model, or — as in {@link MockEmbedder} — a
 * deterministic hash so tests need no network or API key.
 */
export interface Embedder {
  /** Embed `text` into a numeric vector. Same text MUST yield the same vector. */
  embed(text: string): Promise<number[]>;
}

/** One cached entry: the embedding, the response it maps to, and its expiry. */
export interface CacheEntry {
  /** Embedding of the prompt that produced `response`. */
  vector: number[];
  /** The stored LLM response (or any value the caller wants to memoize). */
  response: string;
  /** Absolute epoch-millis after which this entry is stale. */
  expiresAt: number;
}

/** A nearest-neighbor search result from a {@link VectorStore}. */
export interface NearestMatch {
  /** The matching entry. */
  entry: CacheEntry;
  /** Cosine similarity between the query vector and `entry.vector`, in [-1, 1]. */
  similarity: number;
}

/**
 * Storage for cache entries plus nearest-neighbor search over their vectors.
 * The default {@link InMemoryVectorStore} is an exhaustive (brute-force) scan;
 * a production implementation might wrap a real ANN index.
 */
export interface VectorStore {
  /** Insert or append an entry. */
  add(entry: CacheEntry): void;
  /**
   * Return the single most-similar entry to `vector`, or `null` if the store is
   * empty. Implementations MUST NOT mutate state here — eviction is the cache's
   * job, not the store's.
   */
  nearest(vector: number[]): NearestMatch | null;
  /** Number of entries currently held. */
  size(): number;
  /** Remove every entry. */
  clear(): void;
  /** All entries, in insertion order. Used by the cache for TTL/LRU sweeps. */
  entries(): CacheEntry[];
  /** Remove a specific entry by reference identity. Returns true if removed. */
  remove(entry: CacheEntry): boolean;
}

/** Runtime counters returned by {@link SemanticCache.stats}. */
export interface CacheStats {
  /** Number of `getOrCompute` calls served from the cache. */
  hits: number;
  /** Number of `getOrCompute` calls that had to compute a fresh response. */
  misses: number;
  /** hits / (hits + misses), or 0 when no calls have been made. */
  hitRate: number;
  /** Current number of live entries in the store. */
  size: number;
}

/** Configuration for a {@link SemanticCache}. */
export interface SemanticCacheConfig {
  /** Pluggable embedder. Required — there is no sensible default. */
  embedder: Embedder;
  /** Vector store. Defaults to a fresh {@link InMemoryVectorStore}. */
  store?: VectorStore;
  /**
   * Cosine-similarity threshold for a hit, in [0, 1]. A candidate must score
   * `>= threshold` to be reused. Defaults to 0.95 — high, to avoid serving a
   * semantically-different answer.
   */
  threshold?: number;
  /** Time-to-live for entries, in milliseconds. Defaults to 1 hour. */
  ttlMs?: number;
  /** Maximum live entries; the oldest-touched entry is evicted past this. */
  maxEntries?: number;
  /** Clock injection point for deterministic tests. Defaults to `Date.now`. */
  now?: () => number;
}
