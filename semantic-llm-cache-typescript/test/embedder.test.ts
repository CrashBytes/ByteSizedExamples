import { describe, expect, it } from "vitest";
import { MockEmbedder } from "../src/embedder.js";
import { cosineSimilarity } from "../src/similarity.js";

describe("MockEmbedder", () => {
  it("produces a vector of the configured dimension", async () => {
    const embedder = new MockEmbedder(32);
    const vector = await embedder.embed("hello world");
    expect(vector).toHaveLength(32);
  });

  it("is deterministic — same text yields the same vector", async () => {
    const embedder = new MockEmbedder(64);
    const a = await embedder.embed("the quick brown fox");
    const b = await embedder.embed("the quick brown fox");
    expect(a).toEqual(b);
  });

  it("is order/whitespace/case insensitive for the same bag of words", async () => {
    const embedder = new MockEmbedder(64);
    const a = await embedder.embed("Reset My Password");
    const b = await embedder.embed("password   reset my");
    expect(cosineSimilarity(a, b)).toBeCloseTo(1, 10);
  });

  it("scores paraphrases high and unrelated prompts low", async () => {
    const embedder = new MockEmbedder(64);
    const base = await embedder.embed("Summarize the quarterly earnings report");
    const paraphrase = await embedder.embed(
      "Summarize the quarterly earnings report for Q3",
    );
    const unrelated = await embedder.embed(
      "How do I reverse a linked list in Python?",
    );

    expect(cosineSimilarity(base, paraphrase)).toBeGreaterThan(0.85);
    expect(cosineSimilarity(base, unrelated)).toBeLessThan(0.2);
  });

  it("rejects an invalid dimension", () => {
    expect(() => new MockEmbedder(0)).toThrow(RangeError);
    expect(() => new MockEmbedder(-4)).toThrow(RangeError);
    expect(() => new MockEmbedder(1.5)).toThrow(RangeError);
  });
});
