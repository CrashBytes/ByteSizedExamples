import type { Embedder } from "./types.js";

/**
 * Deterministic, dependency-free embedder for tests and local development.
 *
 * It builds a fixed-dimension "bag of words" vector: every token is hashed into
 * a bucket and that bucket's weight is incremented. Because the same text always
 * hashes the same way, embeddings are reproducible with no network call and no
 * API key — which is exactly what the test suite needs.
 *
 * Properties that make it useful as a stand-in for a real embedding model:
 *
 *  - Identical prompts produce identical vectors  → exact-repeat hits.
 *  - Prompts that share most tokens produce vectors that point in nearly the
 *    same direction → near-paraphrase hits above a high threshold.
 *  - Prompts with disjoint vocabulary produce near-orthogonal vectors → misses.
 *
 * It is NOT a substitute for a real semantic embedding model in production —
 * it has no notion of synonyms or meaning beyond surface tokens. Swap in a real
 * {@link Embedder} (one that calls an embeddings API) for production use.
 */
export class MockEmbedder implements Embedder {
  constructor(private readonly dimensions: number = 64) {
    if (dimensions <= 0 || !Number.isInteger(dimensions)) {
      throw new RangeError("MockEmbedder: dimensions must be a positive integer");
    }
  }

  async embed(text: string): Promise<number[]> {
    const vector = new Array<number>(this.dimensions).fill(0);
    for (const token of this.tokenize(text)) {
      const bucket = this.hash(token) % this.dimensions;
      // Weight by token length so longer, more distinctive words count for more;
      // this spreads the vector out and keeps unrelated prompts well-separated.
      vector[bucket] += 1 + token.length / 10;
    }
    return vector;
  }

  /** Lowercase, split on non-word characters, drop empties. */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 0);
  }

  /**
   * Deterministic 32-bit FNV-1a hash. Stable across runs and platforms, which
   * is what keeps the embeddings reproducible.
   */
  private hash(token: string): number {
    let h = 0x811c9dc5; // FNV offset basis
    for (let i = 0; i < token.length; i++) {
      h ^= token.charCodeAt(i);
      // FNV prime, kept in 32-bit unsigned range via Math.imul + >>> 0.
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }
}
