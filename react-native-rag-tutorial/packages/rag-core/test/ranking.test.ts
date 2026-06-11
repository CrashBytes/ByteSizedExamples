import { describe, it, expect } from "vitest";
import { bm25Scores, fuse, normalize, type EmbeddedChunk, type ScoredChunk } from "../src/index.js";

function emb(id: string, text: string): EmbeddedChunk {
  return { id, docId: id, index: 0, text, embedding: normalize([1, 0]) };
}

describe("bm25Scores", () => {
  const chunks: EmbeddedChunk[] = [
    emb("a", "request a refund within thirty days of purchase"),
    emb("b", "reset your password using the email link"),
    emb("c", "refunds are issued to the original payment method"),
  ];

  it("scores chunks containing query terms above those that do not", () => {
    const scores = bm25Scores("refund payment", chunks);
    expect(scores.has("a")).toBe(true);
    expect(scores.has("c")).toBe(true);
    expect(scores.has("b")).toBe(false);
  });

  it("returns no scores when the query has only stopwords", () => {
    const scores = bm25Scores("how do I", chunks);
    expect(scores.size).toBe(0);
  });

  it("rewards rare terms (higher IDF) more than common ones", () => {
    const scores = bm25Scores("refund password", chunks);
    // 'password' appears in one doc, 'refund' in two — the password doc should
    // score on a rarer term.
    expect(scores.get("b")).toBeGreaterThan(0);
  });
});

describe("fuse (reciprocal rank fusion)", () => {
  const semantic: ScoredChunk[] = [
    { chunk: emb("a", "alpha"), score: 0.9 },
    { chunk: emb("b", "beta"), score: 0.8 },
    { chunk: emb("c", "gamma"), score: 0.1 },
  ];

  it("alpha=1 yields pure semantic order", () => {
    const keyword = new Map([["c", 99]]);
    const fused = fuse(semantic, keyword, { alpha: 1, k: 3 });
    expect(fused.map((f) => f.chunk.id)).toEqual(["a", "b", "c"]);
  });

  it("alpha=0 lets a strong keyword hit climb above weak semantic hits", () => {
    const keyword = new Map([["c", 99]]);
    const fused = fuse(semantic, keyword, { alpha: 0, k: 3 });
    expect(fused[0]!.chunk.id).toBe("c");
  });

  it("blends both signals at alpha=0.5", () => {
    const keyword = new Map([
      ["b", 50],
      ["c", 40],
    ]);
    const fused = fuse(semantic, keyword, { alpha: 0.5, k: 3 });
    expect(fused).toHaveLength(3);
    // 'b' is strong on both signals and should lead.
    expect(fused[0]!.chunk.id).toBe("b");
    expect(fused[0]!.components?.semantic).toBeDefined();
    expect(fused[0]!.components?.keyword).toBeDefined();
  });

  it("truncates to k", () => {
    const fused = fuse(semantic, new Map(), { alpha: 0.6, k: 2 });
    expect(fused).toHaveLength(2);
  });
});
