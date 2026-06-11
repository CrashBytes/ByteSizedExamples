import { describe, it, expect } from "vitest";
import { dot, norm, normalize, cosineSimilarity } from "../src/index.js";

describe("vector math", () => {
  it("computes dot products", () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
  });

  it("throws on dimension mismatch", () => {
    expect(() => dot([1, 2], [1, 2, 3])).toThrow(/dimension mismatch/);
  });

  it("computes the L2 norm", () => {
    expect(norm([3, 4])).toBe(5);
  });

  it("normalizes to unit length", () => {
    const u = normalize([3, 4]);
    expect(norm(u)).toBeCloseTo(1, 10);
  });

  it("handles the zero vector without dividing by zero", () => {
    expect(normalize([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it("cosine similarity of identical directions is 1", () => {
    expect(cosineSimilarity([1, 1], [2, 2])).toBeCloseTo(1, 10);
  });

  it("cosine similarity of opposite directions is -1", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 10);
  });

  it("cosine similarity of orthogonal vectors is 0", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });
});
