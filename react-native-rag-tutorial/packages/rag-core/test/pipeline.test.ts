import { describe, it, expect, beforeEach } from "vitest";
import {
  RagPipeline,
  HashingEmbeddingProvider,
  InMemoryVectorStore,
  ExtractiveSynthesizer,
  type EmbeddingProvider,
} from "../src/index.js";
import { CORPUS } from "./fixtures.js";

describe("RagPipeline (end to end, offline providers)", () => {
  let pipeline: RagPipeline;

  beforeEach(async () => {
    pipeline = new RagPipeline({
      embedder: new HashingEmbeddingProvider(512),
      store: new InMemoryVectorStore(),
      synthesizer: new ExtractiveSynthesizer(2),
    });
    await pipeline.ingest(CORPUS);
  });

  it("indexes every document into chunks", async () => {
    expect(await pipeline.size()).toBeGreaterThanOrEqual(CORPUS.length);
  });

  it("retrieves the correct document for a billing question", async () => {
    // NOTE: the offline hashing embedder is lexical, so the query must share
    // vocabulary with the source ("refund"). Synonym matching ("money back")
    // is what the cloud Voyage path buys you — see the tutorial's tradeoff
    // discussion and the eval harness.
    const results = await pipeline.retrieve("how do I request a refund", { k: 1, alpha: 0.5 });
    expect(results[0]!.chunk.docId).toBe("billing-refunds");
  });

  it("retrieves the correct document for a password question", async () => {
    const results = await pipeline.retrieve("I forgot my password", { k: 1 });
    expect(results[0]!.chunk.docId).toBe("account-password");
  });

  it("hybrid retrieval surfaces an exact error code keyword match", async () => {
    // 'E-4012' is a rare token vector search can smear; BM25 should rescue it.
    const results = await pipeline.retrieve("what does E-4012 mean", { k: 1, alpha: 0.4 });
    expect(results[0]!.chunk.docId).toBe("account-password");
  });

  it("answer() returns grounded text with citations and metadata", async () => {
    const result = await pipeline.answer("how long do refunds take", { k: 2 });
    expect(result.answer).toContain("[1]");
    expect(result.citations.length).toBeGreaterThan(0);
    expect(result.citations[0]!.docId).toBe("billing-refunds");
    expect(result.meta.embedder).toBe("hashing-trick");
    expect(result.meta.synthesizer).toBe("extractive");
    expect(result.meta.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("forget() removes a document from the index", async () => {
    const before = await pipeline.size();
    await pipeline.forget("sync-offline");
    expect(await pipeline.size()).toBeLessThan(before);
    const results = await pipeline.retrieve("offline notes sync", { k: 1 });
    expect(results[0]?.chunk.docId).not.toBe("sync-offline");
  });

  it("rejects mismatched query/document embedder dimensions", () => {
    const docEmbedder = new HashingEmbeddingProvider(512);
    const queryEmbedder: EmbeddingProvider = new HashingEmbeddingProvider(256);
    expect(
      () =>
        new RagPipeline({
          embedder: docEmbedder,
          queryEmbedder,
          store: new InMemoryVectorStore(),
          synthesizer: new ExtractiveSynthesizer(),
        }),
    ).toThrow(/dimension mismatch/i);
  });
});
