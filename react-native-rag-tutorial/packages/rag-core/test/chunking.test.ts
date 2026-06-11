import { describe, it, expect } from "vitest";
import { chunkDocument, estimateTokens, splitSentences, tokenize } from "../src/index.js";

describe("tokenize", () => {
  it("lowercases and strips punctuation", () => {
    expect(tokenize("Hello, WORLD! 123")).toEqual(["hello", "world", "123"]);
  });

  it("returns an empty array for empty input", () => {
    expect(tokenize("   ")).toEqual([]);
  });
});

describe("splitSentences", () => {
  it("splits on sentence punctuation", () => {
    const s = splitSentences("First sentence. Second one! A third?");
    expect(s).toHaveLength(3);
  });

  it("splits on paragraph breaks", () => {
    const s = splitSentences("Para one\n\nPara two");
    expect(s).toEqual(["Para one", "Para two"]);
  });
});

describe("chunkDocument", () => {
  const longText = Array.from({ length: 40 }, (_, i) => `This is sentence number ${i} about retrieval.`).join(" ");

  it("produces multiple overlapping chunks for long text", () => {
    const chunks = chunkDocument({ id: "doc", text: longText }, { maxTokens: 60, overlapTokens: 12 });
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("respects the token budget per chunk (allowing one sentence of slack)", () => {
    const chunks = chunkDocument({ id: "doc", text: longText }, { maxTokens: 60, overlapTokens: 12 });
    for (const c of chunks) {
      // Each chunk should be within budget plus at most one extra sentence.
      expect(estimateTokens(c.text)).toBeLessThanOrEqual(60 + 20);
    }
  });

  it("creates overlap between consecutive chunks", () => {
    const chunks = chunkDocument({ id: "doc", text: longText }, { maxTokens: 60, overlapTokens: 20 });
    const first = chunks[0]!;
    const second = chunks[1]!;
    const firstWords = new Set(tokenize(first.text));
    const secondWords = tokenize(second.text);
    const shared = secondWords.filter((w) => firstWords.has(w));
    expect(shared.length).toBeGreaterThan(0);
  });

  it("assigns stable, sequential ids and carries metadata", () => {
    const chunks = chunkDocument(
      { id: "guide", text: longText, metadata: { title: "Guide" } },
      { maxTokens: 60 },
    );
    chunks.forEach((c, i) => {
      expect(c.id).toBe(`guide::${i}`);
      expect(c.index).toBe(i);
      expect(c.docId).toBe("guide");
      expect(c.metadata).toEqual({ title: "Guide" });
    });
  });

  it("emits an over-long single sentence as its own chunk", () => {
    const huge = `${"word ".repeat(500)}.`;
    const chunks = chunkDocument({ id: "big", text: huge }, { maxTokens: 50 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.text.length).toBeGreaterThan(100);
  });

  it("returns no chunks for empty documents", () => {
    expect(chunkDocument({ id: "empty", text: "" })).toEqual([]);
  });
});
