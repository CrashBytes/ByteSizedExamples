/**
 * @cb/rag-core — a framework-agnostic Retrieval-Augmented Generation engine.
 *
 * Runs unchanged on Node (the retrieval server) and React Native (on-device
 * mode). The public surface is small on purpose: build a `RagPipeline` by
 * injecting an embedder, a store, and a synthesizer, then call `ingest` and
 * `answer`.
 */

export type {
  RagDocument,
  Chunk,
  EmbeddedChunk,
  ScoredChunk,
  EmbeddingProvider,
  VectorStore,
  Citation,
  RagAnswer,
  Synthesizer,
  RetrieveOptions,
} from "./types.js";

// Pipeline
export { RagPipeline, type RagPipelineConfig } from "./pipeline.js";

// Chunking
export { chunkDocument, chunkDocuments, type ChunkOptions } from "./chunking.js";

// Math + text utilities
export { dot, norm, normalize, cosineSimilarity } from "./math.js";
export { tokenize, splitSentences, estimateTokens, STOPWORDS } from "./tokenize.js";

// Embedding providers
export { HashingEmbeddingProvider } from "./embeddings/hashing.js";
export { VoyageEmbeddingProvider, type VoyageOptions } from "./embeddings/voyage.js";

// Vector stores
export { InMemoryVectorStore } from "./store/memory.js";

// Ranking
export { bm25Scores, fuse } from "./ranking.js";

// Synthesizers + prompt building
export { ExtractiveSynthesizer } from "./synthesize/extractive.js";
export {
  buildGroundedPrompt,
  filterCitations,
  DEFAULT_SYSTEM_PROMPT,
  type GroundedPrompt,
} from "./synthesize/prompt.js";
