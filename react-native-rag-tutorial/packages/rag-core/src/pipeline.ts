import type {
  EmbeddedChunk,
  EmbeddingProvider,
  RagAnswer,
  RagDocument,
  RetrieveOptions,
  ScoredChunk,
  Synthesizer,
  VectorStore,
} from "./types.js";
import { chunkDocuments, type ChunkOptions } from "./chunking.js";
import { bm25Scores, fuse } from "./ranking.js";

export interface RagPipelineConfig {
  embedder: EmbeddingProvider;
  store: VectorStore;
  synthesizer: Synthesizer;
  /**
   * Optional separate embedder for queries. Hosted providers (Voyage) embed
   * questions and documents asymmetrically; pass `embedder.forQueries()` here.
   * Defaults to `embedder`.
   */
  queryEmbedder?: EmbeddingProvider;
  chunking?: ChunkOptions;
  /** How many candidates the vector store returns before fusion/truncation. */
  candidateK?: number;
}

/**
 * The orchestrator. This is the class the tutorial keeps returning to, because
 * it is identical on every platform — only the three collaborators injected into
 * it change. On a phone: `HashingEmbeddingProvider` + `InMemoryVectorStore` +
 * `ExtractiveSynthesizer`. On the server: `VoyageEmbeddingProvider` +
 * (still) `InMemoryVectorStore` or pgvector + `ClaudeSynthesizer`.
 *
 * The flow is the canonical RAG loop:
 *   ingest:  documents → chunks → embeddings → store
 *   answer:  query → embed → vector search → hybrid re-rank → synthesize
 */
export class RagPipeline {
  private readonly embedder: EmbeddingProvider;
  private readonly queryEmbedder: EmbeddingProvider;
  private readonly store: VectorStore;
  private readonly synthesizer: Synthesizer;
  private readonly chunking: ChunkOptions;
  private readonly candidateK: number;

  constructor(config: RagPipelineConfig) {
    this.embedder = config.embedder;
    this.queryEmbedder = config.queryEmbedder ?? config.embedder;
    this.store = config.store;
    this.synthesizer = config.synthesizer;
    this.chunking = config.chunking ?? {};
    this.candidateK = config.candidateK ?? 20;

    if (this.queryEmbedder.dimensions !== this.embedder.dimensions) {
      throw new Error(
        `Embedder dimension mismatch: documents=${this.embedder.dimensions}, queries=${this.queryEmbedder.dimensions}. ` +
          "Document and query embedders must produce the same vector space.",
      );
    }
  }

  /** Chunk, embed, and store a batch of documents. Returns the chunk count. */
  async ingest(documents: RagDocument[]): Promise<number> {
    const chunks = chunkDocuments(documents, this.chunking);
    if (chunks.length === 0) return 0;

    const embeddings = await this.embedder.embed(chunks.map((c) => c.text));
    const embedded: EmbeddedChunk[] = chunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddings[i] as number[],
    }));

    await this.store.upsert(embedded);
    return embedded.length;
  }

  /**
   * Retrieve the most relevant chunks for a query. Does NOT call the LLM — this
   * is the seam you evaluate against a labelled set (recall@k, MRR) before ever
   * paying for synthesis.
   */
  async retrieve(query: string, options: RetrieveOptions = {}): Promise<ScoredChunk[]> {
    const k = options.k ?? 5;
    const alpha = options.alpha ?? 0.6;

    const [queryVec] = await this.queryEmbedder.embed([query]);
    let candidates = await this.store.query(queryVec as number[], this.candidateK);

    if (options.filter) {
      candidates = candidates.filter((c) => matchesFilter(c, options.filter as Record<string, unknown>));
    }

    // Pure semantic shortcut.
    if (alpha >= 1) return candidates.slice(0, k);

    // Hybrid: blend the semantic candidates with BM25 over the same pool.
    const keyword = bm25Scores(
      query,
      candidates.map((c) => c.chunk as EmbeddedChunk),
    );
    return fuse(candidates, keyword, { alpha, k });
  }

  /** Full RAG: retrieve, then synthesize a grounded answer. */
  async answer(query: string, options: RetrieveOptions = {}): Promise<RagAnswer> {
    const start = Date.now();
    const contexts = await this.retrieve(query, options);
    const { answer, citations } = await this.synthesizer.synthesize(query, contexts);

    return {
      answer,
      citations,
      contexts,
      meta: {
        embedder: this.embedder.name,
        synthesizer: this.synthesizer.name,
        retrievedCount: contexts.length,
        durationMs: Date.now() - start,
      },
    };
  }

  /** Remove a document's chunks from the store (e.g. on content update). */
  async forget(docId: string): Promise<void> {
    await this.store.removeDocument(docId);
  }

  /** Number of indexed chunks. */
  async size(): Promise<number> {
    return this.store.size();
  }
}

function matchesFilter(scored: ScoredChunk, filter: Record<string, unknown>): boolean {
  const meta = scored.chunk.metadata ?? {};
  return Object.entries(filter).every(([key, value]) => meta[key] === value);
}
