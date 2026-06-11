import { describe, it, expect } from "vitest";
import { InMemoryVectorStore, normalize, type EmbeddedChunk } from "../src/index.js";

function chunk(id: string, embedding: number[]): EmbeddedChunk {
  return {
    id,
    docId: id.split("::")[0] as string,
    index: 0,
    text: id,
    embedding: normalize(embedding),
  };
}

describe("InMemoryVectorStore", () => {
  it("returns the nearest neighbours in descending score order", async () => {
    const store = new InMemoryVectorStore();
    await store.upsert([
      chunk("a::0", [1, 0, 0]),
      chunk("b::0", [0, 1, 0]),
      chunk("c::0", [0.9, 0.1, 0]),
    ]);
    const results = await store.query(normalize([1, 0, 0]), 2);
    expect(results).toHaveLength(2);
    expect(results[0]!.chunk.id).toBe("a::0");
    expect(results[1]!.chunk.id).toBe("c::0");
    expect(results[0]!.score).toBeGreaterThan(results[1]!.score);
  });

  it("upsert replaces an existing chunk by id", async () => {
    const store = new InMemoryVectorStore();
    await store.upsert([chunk("a::0", [1, 0, 0])]);
    await store.upsert([chunk("a::0", [0, 1, 0])]);
    expect(await store.size()).toBe(1);
    const [top] = await store.query(normalize([0, 1, 0]), 1);
    expect(top!.score).toBeCloseTo(1, 6);
  });

  it("removes all chunks belonging to a document", async () => {
    const store = new InMemoryVectorStore();
    await store.upsert([chunk("doc::0", [1, 0, 0]), chunk("doc::1", [0, 1, 0]), chunk("other::0", [0, 0, 1])]);
    await store.removeDocument("doc");
    expect(await store.size()).toBe(1);
  });

  it("clear empties the store", async () => {
    const store = new InMemoryVectorStore();
    await store.upsert([chunk("a::0", [1, 0, 0])]);
    store.clear();
    expect(await store.size()).toBe(0);
  });

  it("never returns more than k results", async () => {
    const store = new InMemoryVectorStore();
    await store.upsert([chunk("a::0", [1, 0, 0]), chunk("b::0", [0, 1, 0])]);
    expect(await store.query(normalize([1, 1, 0]), 5)).toHaveLength(2);
  });
});
