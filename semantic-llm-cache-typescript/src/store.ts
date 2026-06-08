import { cosineSimilarity } from "./similarity.js";
import type { CacheEntry, NearestMatch, VectorStore } from "./types.js";

/**
 * In-memory vector store with brute-force nearest-neighbor search.
 *
 * Entries are kept in a plain array in insertion order. `nearest` does an
 * exhaustive cosine-similarity scan — O(n) per query. That is the right
 * tradeoff for a cache holding hundreds-to-low-thousands of entries: it is
 * exact, trivial to reason about, and has zero dependencies. For very large
 * caches you would swap in an approximate-nearest-neighbor index behind the
 * same {@link VectorStore} interface.
 */
export class InMemoryVectorStore implements VectorStore {
  private items: CacheEntry[] = [];

  add(entry: CacheEntry): void {
    this.items.push(entry);
  }

  nearest(vector: number[]): NearestMatch | null {
    let best: NearestMatch | null = null;
    for (const entry of this.items) {
      const similarity = cosineSimilarity(vector, entry.vector);
      if (best === null || similarity > best.similarity) {
        best = { entry, similarity };
      }
    }
    return best;
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }

  entries(): CacheEntry[] {
    // Return a shallow copy so callers iterating during eviction can't be
    // tripped up by concurrent mutation of the backing array.
    return [...this.items];
  }

  remove(entry: CacheEntry): boolean {
    const index = this.items.indexOf(entry);
    if (index === -1) {
      return false;
    }
    this.items.splice(index, 1);
    return true;
  }
}
