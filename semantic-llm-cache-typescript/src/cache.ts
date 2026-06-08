import { InMemoryVectorStore } from "./store.js";
import type {
  CacheEntry,
  CacheStats,
  Embedder,
  SemanticCacheConfig,
  VectorStore,
} from "./types.js";

const DEFAULT_THRESHOLD = 0.95;
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_MAX_ENTRIES = 1000;

/**
 * A semantic cache for LLM responses.
 *
 * Where a traditional cache keys on an exact string, this one keys on *meaning*:
 * it embeds the prompt, finds the nearest stored prompt by cosine similarity,
 * and reuses that response when the two are close enough. That turns expensive,
 * slow model calls (~500-2000ms) into local lookups (~single-digit ms) not just
 * for verbatim repeats but for paraphrases of an already-answered question.
 *
 * Lifecycle of a {@link getOrCompute} call:
 *   1. Embed the prompt.
 *   2. Find the nearest non-expired neighbor in the store.
 *   3. If its similarity `>= threshold`, count a hit and return its response.
 *   4. Otherwise compute a fresh response, store it, count a miss, and return it.
 *
 * Freshness and size are bounded by a TTL and an LRU-style cap on entry count.
 */
export class SemanticCache {
  private readonly embedder: Embedder;
  private readonly store: VectorStore;
  private readonly threshold: number;
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly now: () => number;

  private hits = 0;
  private misses = 0;

  /**
   * Recency tracking for LRU eviction. We map each live entry to a monotonically
   * increasing "tick" that is bumped every time the entry is stored or read as a
   * hit. The entry with the smallest tick is the least-recently-used.
   */
  private recency = new Map<CacheEntry, number>();
  private tick = 0;

  constructor(config: SemanticCacheConfig) {
    if (!config.embedder) {
      throw new Error("SemanticCache: an `embedder` is required");
    }
    this.embedder = config.embedder;
    this.store = config.store ?? new InMemoryVectorStore();
    this.threshold = config.threshold ?? DEFAULT_THRESHOLD;
    this.ttlMs = config.ttlMs ?? DEFAULT_TTL_MS;
    this.maxEntries = config.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this.now = config.now ?? Date.now;

    if (this.threshold < 0 || this.threshold > 1) {
      throw new RangeError("SemanticCache: threshold must be within [0, 1]");
    }
    if (this.maxEntries < 1) {
      throw new RangeError("SemanticCache: maxEntries must be at least 1");
    }
  }

  /**
   * Look up `prompt` semantically without computing anything.
   *
   * Returns the cached response when a non-expired neighbor scores at or above
   * the threshold, otherwise `null`. A successful lookup counts as a hit and
   * refreshes the entry's recency, exactly like a {@link getOrCompute} hit.
   * Expired neighbors are swept on the way through.
   */
  async lookup(prompt: string): Promise<string | null> {
    const vector = await this.embedder.embed(prompt);
    return this.lookupByVector(vector);
  }

  /**
   * Return a cached response for `prompt` if one is semantically close enough,
   * otherwise call `computeFn`, store its result, and return that.
   *
   * `computeFn` is only invoked on a miss — that is the whole point: it stands
   * in for the expensive model call you are trying to avoid.
   */
  async getOrCompute(
    prompt: string,
    computeFn: (prompt: string) => Promise<string>,
  ): Promise<string> {
    const vector = await this.embedder.embed(prompt);

    const hit = this.lookupByVector(vector);
    if (hit !== null) {
      return hit;
    }

    // Miss: compute, store, count.
    const response = await computeFn(prompt);
    this.misses++;
    this.insert(vector, response);
    return response;
  }

  /** Snapshot of hit/miss counters, derived hit rate, and live size. */
  stats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total === 0 ? 0 : this.hits / total,
      size: this.store.size(),
    };
  }

  /** Drop every entry and reset recency tracking. Counters are preserved. */
  clear(): void {
    this.store.clear();
    this.recency.clear();
    this.tick = 0;
  }

  // --- internals -----------------------------------------------------------

  /**
   * Shared hit path for {@link lookup} and {@link getOrCompute}. Sweeps expired
   * entries first so a stale neighbor can never be returned, then applies the
   * similarity threshold. On a hit, bumps recency and the hit counter.
   */
  private lookupByVector(vector: number[]): string | null {
    this.sweepExpired();

    const match = this.store.nearest(vector);
    if (match !== null && match.similarity >= this.threshold) {
      this.hits++;
      this.touch(match.entry);
      return match.entry.response;
    }
    return null;
  }

  /** Add a new entry, set its expiry/recency, then enforce the size cap. */
  private insert(vector: number[], response: string): void {
    const entry: CacheEntry = {
      vector,
      response,
      expiresAt: this.now() + this.ttlMs,
    };
    this.store.add(entry);
    this.touch(entry);
    this.evictIfNeeded();
  }

  /** Mark `entry` as just-used for LRU purposes. */
  private touch(entry: CacheEntry): void {
    this.recency.set(entry, ++this.tick);
  }

  /** Remove every entry whose TTL has elapsed. */
  private sweepExpired(): void {
    const cutoff = this.now();
    for (const entry of this.store.entries()) {
      if (entry.expiresAt <= cutoff) {
        this.store.remove(entry);
        this.recency.delete(entry);
      }
    }
  }

  /**
   * Evict least-recently-used entries until the store is within `maxEntries`.
   * Runs after each insert, so at most one entry is ever over the cap — but the
   * loop is written defensively in case the cap is lowered between calls.
   */
  private evictIfNeeded(): void {
    while (this.store.size() > this.maxEntries) {
      let lruEntry: CacheEntry | null = null;
      let lruTick = Infinity;
      for (const entry of this.store.entries()) {
        const t = this.recency.get(entry) ?? 0;
        if (t < lruTick) {
          lruTick = t;
          lruEntry = entry;
        }
      }
      if (lruEntry === null) {
        break;
      }
      this.store.remove(lruEntry);
      this.recency.delete(lruEntry);
    }
  }
}
