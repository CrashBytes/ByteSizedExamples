import { describe, it, expect } from "vitest";
import { HashingEmbeddingProvider, norm, cosineSimilarity } from "../src/index.js";

describe("HashingEmbeddingProvider", () => {
  const embedder = new HashingEmbeddingProvider(256);

  it("reports its configured dimensionality", () => {
    expect(embedder.dimensions).toBe(256);
  });

  it("produces vectors of the right length", async () => {
    const [v] = await embedder.embed(["refund my subscription"]);
    expect(v).toHaveLength(256);
  });

  it("is deterministic — same text, same vector", async () => {
    const [a] = await embedder.embed(["password reset link"]);
    const [b] = await embedder.embed(["password reset link"]);
    expect(a).toEqual(b);
  });

  it("returns unit-normalized vectors", async () => {
    const [v] = await embedder.embed(["offline sync notes"]);
    expect(norm(v as number[])).toBeCloseTo(1, 6);
  });

  it("scores lexically-overlapping text higher than unrelated text", async () => {
    const [query] = await embedder.embed(["how do I get a refund"]);
    const [related] = await embedder.embed(["request a refund within 30 days"]);
    const [unrelated] = await embedder.embed(["reset your password by email"]);
    const simRelated = cosineSimilarity(query as number[], related as number[]);
    const simUnrelated = cosineSimilarity(query as number[], unrelated as number[]);
    expect(simRelated).toBeGreaterThan(simUnrelated);
  });

  it("embeds empty text as the zero vector", async () => {
    const [v] = await embedder.embed([""]);
    expect((v as number[]).every((x) => x === 0)).toBe(true);
  });

  it("batches without cross-contamination", async () => {
    const batch = await embedder.embed(["alpha", "beta"]);
    const single = await embedder.embed(["alpha"]);
    expect(batch[0]).toEqual(single[0]);
  });
});
