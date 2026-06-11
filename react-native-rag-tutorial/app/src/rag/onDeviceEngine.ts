import {
  RagPipeline,
  HashingEmbeddingProvider,
  InMemoryVectorStore,
  ExtractiveSynthesizer,
  type RagAnswer,
  type RetrieveOptions,
} from "@cb/rag-core";
import { KNOWLEDGE_BASE } from "../data/knowledgeBase";

/**
 * The on-device retrieval engine.
 *
 * Identical `RagPipeline` to the server — only the injected collaborators differ:
 *   - HashingEmbeddingProvider  (no model download, runs in Hermes, deterministic)
 *   - InMemoryVectorStore       (brute-force cosine over a few hundred vectors)
 *   - ExtractiveSynthesizer     (returns the best passages with citations)
 *
 * No network, no API key, no data leaving the device. This is the privacy-first
 * default. The tutorial shows two upgrades behind these same interfaces: an ONNX
 * MiniLM embedder for real semantic recall, and an expo-sqlite store so the
 * embeddings survive app restarts instead of being rebuilt on every launch.
 */
let singleton: OnDeviceEngine | null = null;

export class OnDeviceEngine {
  private readonly pipeline: RagPipeline;
  private ready: Promise<void>;

  private constructor() {
    this.pipeline = new RagPipeline({
      embedder: new HashingEmbeddingProvider(512),
      store: new InMemoryVectorStore(),
      synthesizer: new ExtractiveSynthesizer(3),
      chunking: { maxTokens: 256, overlapTokens: 48 },
    });
    // Embedding the bundled corpus is fast (hashing is pure arithmetic), but we
    // still expose readiness so the UI can show an "indexing…" state on a very
    // large local corpus.
    this.ready = this.pipeline.ingest(KNOWLEDGE_BASE).then(() => undefined);
  }

  static get(): OnDeviceEngine {
    if (!singleton) singleton = new OnDeviceEngine();
    return singleton;
  }

  async answer(query: string, options?: RetrieveOptions): Promise<RagAnswer> {
    await this.ready;
    // alpha 0.5 = an even hybrid blend, which suits the lexical embedder well —
    // BM25 carries exact terms (error codes) while the vector adds soft overlap.
    return this.pipeline.answer(query, { k: 4, alpha: 0.5, ...options });
  }
}
