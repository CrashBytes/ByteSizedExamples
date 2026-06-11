import {
  ExtractiveSynthesizer,
  HashingEmbeddingProvider,
  InMemoryVectorStore,
  RagPipeline,
  VoyageEmbeddingProvider,
  type EmbeddingProvider,
  type Synthesizer,
} from "@cb/rag-core";
import { ClaudeSynthesizer } from "./claudeSynthesizer.js";
import type { ServerConfig } from "./config.js";

export interface BuiltPipeline {
  pipeline: RagPipeline;
  embedderName: string;
  synthesizerName: string;
  /** True when both halves run with real hosted models. */
  cloud: boolean;
}

/**
 * Assemble a `RagPipeline` from configuration, degrading gracefully:
 *
 *   VOYAGE_API_KEY present     → Voyage embeddings (synonym-aware, high recall)
 *   VOYAGE_API_KEY absent      → hashing embeddings (lexical, offline)
 *
 *   ANTHROPIC_API_KEY present  → Claude Opus 4.8 answer synthesis
 *   ANTHROPIC_API_KEY absent   → extractive synthesis (top chunks + citations)
 *
 * This is what lets `npm test` and a fresh `git clone` run end-to-end with no
 * secrets, while a configured deployment gets full quality from the same code.
 */
export function buildPipeline(config: ServerConfig): BuiltPipeline {
  let embedder: EmbeddingProvider;
  let queryEmbedder: EmbeddingProvider;

  if (config.voyage.apiKey) {
    const voyage = new VoyageEmbeddingProvider({
      apiKey: config.voyage.apiKey,
      model: config.voyage.model,
      dimensions: config.voyage.dimensions,
    });
    embedder = voyage;
    // Voyage embeds questions and documents asymmetrically — use the query side.
    queryEmbedder = voyage.forQueries();
  } else {
    const hashing = new HashingEmbeddingProvider(512);
    embedder = hashing;
    queryEmbedder = hashing;
  }

  const synthesizer: Synthesizer = config.anthropic.apiKey
    ? new ClaudeSynthesizer({ apiKey: config.anthropic.apiKey, model: config.anthropic.model })
    : new ExtractiveSynthesizer(3);

  const pipeline = new RagPipeline({
    embedder,
    queryEmbedder,
    store: new InMemoryVectorStore(),
    synthesizer,
    chunking: { maxTokens: 256, overlapTokens: 48 },
    candidateK: 20,
  });

  return {
    pipeline,
    embedderName: embedder.name,
    synthesizerName: synthesizer.name,
    cloud: Boolean(config.voyage.apiKey && config.anthropic.apiKey),
  };
}
