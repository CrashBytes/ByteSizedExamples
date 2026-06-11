/**
 * Core domain types for the RAG engine.
 *
 * Design note: every collaborator in the pipeline is an interface, not a
 * concrete class. The *same* `RagPipeline` runs on a phone (hashing embedder +
 * extractive synthesizer) and on a server (Voyage embedder + Claude synthesizer)
 * purely by swapping the implementations injected at construction time. The
 * retrieval logic — chunk, embed, store, rank — never changes.
 */

/** A raw source document before it has been split into chunks. */
export interface RagDocument {
  /** Stable, caller-supplied identifier (e.g. a help-article slug). */
  id: string;
  /** Full document text. */
  text: string;
  /** Optional arbitrary metadata carried through to every chunk and citation. */
  metadata?: Record<string, unknown>;
}

/** A contiguous span of a document, the unit that actually gets embedded. */
export interface Chunk {
  /** Deterministic id: `${docId}::${index}`. */
  id: string;
  /** Id of the document this chunk came from. */
  docId: string;
  /** Zero-based position of this chunk within its document. */
  index: number;
  /** The chunk text. */
  text: string;
  /** Metadata inherited from the parent document. */
  metadata?: Record<string, unknown>;
}

/** A chunk that has been turned into a vector. */
export interface EmbeddedChunk extends Chunk {
  /** Unit-normalized embedding vector. */
  embedding: number[];
}

/** A chunk returned from retrieval, with the score that surfaced it. */
export interface ScoredChunk {
  chunk: Chunk;
  /** Final relevance score after ranking (higher is more relevant). */
  score: number;
  /** Component scores, useful for debugging and evaluation. */
  components?: {
    semantic?: number;
    keyword?: number;
  };
}

/**
 * Turns text into vectors. The single most important seam in the system: it is
 * the difference between a private, offline, deterministic embedder running on
 * the device and a high-recall hosted model running on a server.
 */
export interface EmbeddingProvider {
  /** Human-readable name, surfaced in API responses for observability. */
  readonly name: string;
  /** Dimensionality of the vectors this provider produces. */
  readonly dimensions: number;
  /**
   * Embed a batch of texts. Batching matters: hosted providers bill and
   * rate-limit per request, so callers should always embed arrays, not loops.
   */
  embed(texts: string[]): Promise<number[][]>;
}

/** Persists embedded chunks and answers nearest-neighbour queries. */
export interface VectorStore {
  /** Insert or replace embedded chunks. */
  upsert(chunks: EmbeddedChunk[]): Promise<void>;
  /** Return the `k` chunks whose embeddings are closest to `query`. */
  query(query: number[], k: number): Promise<ScoredChunk[]>;
  /** Every stored chunk, used by hybrid keyword ranking. */
  all(): Promise<EmbeddedChunk[]>;
  /** Remove every chunk belonging to a document. */
  removeDocument(docId: string): Promise<void>;
  /** Number of stored chunks. */
  size(): Promise<number>;
}

/** A single source attribution attached to a synthesized answer. */
export interface Citation {
  /** Index into the `contexts` array the synthesizer was given (1-based). */
  marker: number;
  docId: string;
  chunkId: string;
  /** Short snippet of the cited text, for display. */
  snippet: string;
  metadata?: Record<string, unknown>;
}

/** The final, user-facing output of the pipeline. */
export interface RagAnswer {
  answer: string;
  citations: Citation[];
  /** The chunks that were retrieved and passed to the synthesizer. */
  contexts: ScoredChunk[];
  /** Which embedder/synthesizer/mode produced this answer. */
  meta: {
    embedder: string;
    synthesizer: string;
    retrievedCount: number;
    durationMs: number;
  };
}

/** Produces a grounded natural-language answer from retrieved context. */
export interface Synthesizer {
  readonly name: string;
  synthesize(query: string, contexts: ScoredChunk[]): Promise<{ answer: string; citations: Citation[] }>;
}

/** Tunable retrieval parameters. */
export interface RetrieveOptions {
  /** How many chunks to return. */
  k?: number;
  /**
   * Hybrid blend weight in [0, 1]. 1 = pure semantic (vector) ranking,
   * 0 = pure keyword ranking. Reciprocal-rank fusion is used in between.
   */
  alpha?: number;
  /** Restrict retrieval to chunks whose metadata matches every entry. */
  filter?: Record<string, unknown>;
}
