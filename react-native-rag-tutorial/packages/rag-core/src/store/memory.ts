import type { EmbeddedChunk, ScoredChunk, VectorStore } from "../types.js";
import { dot } from "../math.js";

/**
 * In-memory brute-force vector store.
 *
 * Brute force sounds naive, but for the corpus a mobile RAG cache holds — a
 * user's notes, a synced help center, the docs for one product — a linear scan
 * of a few thousand 512-to-1024-dim unit vectors is sub-millisecond in Hermes.
 * Approximate-nearest-neighbour indexes (HNSW, IVF) only start paying off in the
 * tens-of-thousands-of-vectors range, at which point you almost certainly want a
 * server-side store (pgvector, Pinecone, Qdrant) behind the same `VectorStore`
 * interface. Swapping is a one-file change; the pipeline is unaffected.
 *
 * Because embeddings are unit-normalized at embed time, cosine similarity is a
 * plain dot product here.
 */
export class InMemoryVectorStore implements VectorStore {
  private chunks = new Map<string, EmbeddedChunk>();

  async upsert(chunks: EmbeddedChunk[]): Promise<void> {
    for (const c of chunks) {
      this.chunks.set(c.id, c);
    }
  }

  async query(query: number[], k: number): Promise<ScoredChunk[]> {
    const scored: ScoredChunk[] = [];
    for (const chunk of this.chunks.values()) {
      const score = dot(query, chunk.embedding);
      scored.push({ chunk, score, components: { semantic: score } });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, Math.max(0, k));
  }

  async all(): Promise<EmbeddedChunk[]> {
    return [...this.chunks.values()];
  }

  async removeDocument(docId: string): Promise<void> {
    for (const [id, chunk] of this.chunks) {
      if (chunk.docId === docId) this.chunks.delete(id);
    }
  }

  async size(): Promise<number> {
    return this.chunks.size;
  }

  /** Drop everything. Handy in tests and for a "clear cache" affordance. */
  clear(): void {
    this.chunks.clear();
  }
}
