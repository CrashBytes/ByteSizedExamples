import { beforeEach, describe, expect, it, vi } from "vitest";
import { SemanticCache } from "../src/cache.js";
import { MockEmbedder } from "../src/embedder.js";
import { InMemoryVectorStore } from "../src/store.js";

/** A controllable clock so TTL behavior is deterministic. */
function makeClock(start = 0) {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

describe("SemanticCache", () => {
  let embedder: MockEmbedder;

  beforeEach(() => {
    embedder = new MockEmbedder(64);
  });

  it("computes on first call (miss) and returns the computed value", async () => {
    const cache = new SemanticCache({ embedder });
    const compute = vi.fn(async () => "Paris");

    const result = await cache.getOrCompute("What is the capital of France?", compute);

    expect(result).toBe("Paris");
    expect(compute).toHaveBeenCalledTimes(1);
    expect(cache.stats()).toMatchObject({ hits: 0, misses: 1, size: 1 });
  });

  it("serves an exact repeat from cache without recomputing (hit)", async () => {
    const cache = new SemanticCache({ embedder });
    const compute = vi.fn(async () => "Paris");

    await cache.getOrCompute("What is the capital of France?", compute);
    const second = await cache.getOrCompute("What is the capital of France?", compute);

    expect(second).toBe("Paris");
    expect(compute).toHaveBeenCalledTimes(1); // not called the second time
    expect(cache.stats()).toMatchObject({ hits: 1, misses: 1, size: 1 });
  });

  it("serves a near-paraphrase above the threshold from cache", async () => {
    // Threshold lowered to a realistic semantic-cache value; the paraphrase pair
    // scores ~0.91 with the MockEmbedder.
    const cache = new SemanticCache({ embedder, threshold: 0.85 });
    const compute = vi.fn(async () => "earnings summary");

    await cache.getOrCompute("Summarize the quarterly earnings report", compute);
    const para = await cache.getOrCompute(
      "Summarize the quarterly earnings report for Q3",
      compute,
    );

    expect(para).toBe("earnings summary");
    expect(compute).toHaveBeenCalledTimes(1);
    expect(cache.stats().hits).toBe(1);
  });

  it("misses on a dissimilar prompt and computes a fresh response", async () => {
    const cache = new SemanticCache({ embedder, threshold: 0.85 });
    const compute = vi
      .fn<(p: string) => Promise<string>>()
      .mockResolvedValueOnce("Paris")
      .mockResolvedValueOnce("use a slow/fast pointer");

    await cache.getOrCompute("What is the capital of France?", compute);
    const second = await cache.getOrCompute(
      "How do I reverse a linked list in Python?",
      compute,
    );

    expect(second).toBe("use a slow/fast pointer");
    expect(compute).toHaveBeenCalledTimes(2);
    expect(cache.stats()).toMatchObject({ hits: 0, misses: 2, size: 2 });
  });

  it("respects a high default threshold: a weak paraphrase still misses", async () => {
    // Default threshold is 0.95. "What's the capital..." scores ~0.89 < 0.95.
    const cache = new SemanticCache({ embedder });
    const compute = vi.fn(async () => "Paris");

    await cache.getOrCompute("What is the capital of France?", compute);
    await cache.getOrCompute("What's the capital of France?", compute);

    expect(compute).toHaveBeenCalledTimes(2);
    expect(cache.stats().misses).toBe(2);
  });

  it("expires entries after the TTL and recomputes (TTL → miss)", async () => {
    const clock = makeClock(1_000);
    const cache = new SemanticCache({
      embedder,
      ttlMs: 5_000,
      now: clock.now,
    });
    const compute = vi.fn(async () => "Paris");

    await cache.getOrCompute("What is the capital of France?", compute);
    expect(cache.stats().size).toBe(1);

    // Within TTL → hit, no recompute.
    clock.advance(4_000);
    await cache.getOrCompute("What is the capital of France?", compute);
    expect(compute).toHaveBeenCalledTimes(1);

    // Past TTL → entry swept, recompute.
    clock.advance(10_000);
    await cache.getOrCompute("What is the capital of France?", compute);
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it("lookup() returns null for an expired entry", async () => {
    const clock = makeClock(0);
    const cache = new SemanticCache({ embedder, ttlMs: 1_000, now: clock.now });

    await cache.getOrCompute("ping", async () => "pong");
    clock.advance(2_000);

    expect(await cache.lookup("ping")).toBeNull();
  });

  it("evicts the least-recently-used entry past maxEntries", async () => {
    const cache = new SemanticCache({
      embedder,
      maxEntries: 2,
      threshold: 0.99, // keep distinct prompts from colliding as hits
    });

    await cache.getOrCompute("alpha apple", async () => "A"); // entry 1
    await cache.getOrCompute("bravo banana", async () => "B"); // entry 2

    // Touch entry 1 so it becomes most-recently-used; entry 2 is now the LRU.
    expect(await cache.lookup("alpha apple")).toBe("A");

    // Third insert pushes us over the cap → entry 2 ("bravo banana") evicted.
    await cache.getOrCompute("charlie cherry", async () => "C"); // entry 3

    expect(cache.stats().size).toBe(2);
    expect(await cache.lookup("bravo banana")).toBeNull(); // evicted
    expect(await cache.lookup("alpha apple")).toBe("A"); // survived
    expect(await cache.lookup("charlie cherry")).toBe("C"); // survived
  });

  it("never exceeds maxEntries under sustained distinct inserts", async () => {
    const cache = new SemanticCache({
      embedder,
      maxEntries: 5,
      threshold: 0.999,
    });
    for (let i = 0; i < 50; i++) {
      await cache.getOrCompute(`distinct prompt number ${i}`, async () => `r${i}`);
      expect(cache.stats().size).toBeLessThanOrEqual(5);
    }
    expect(cache.stats().size).toBe(5);
  });

  it("computes hitRate correctly", async () => {
    const cache = new SemanticCache({ embedder });
    const compute = vi.fn(async () => "Paris");

    // No calls yet → hitRate is 0 (no division by zero).
    expect(cache.stats().hitRate).toBe(0);

    await cache.getOrCompute("What is the capital of France?", compute); // miss
    await cache.getOrCompute("What is the capital of France?", compute); // hit
    await cache.getOrCompute("What is the capital of France?", compute); // hit
    await cache.getOrCompute("What is the capital of France?", compute); // hit

    const stats = cache.stats();
    expect(stats.hits).toBe(3);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBeCloseTo(0.75, 10); // 3 / 4
  });

  it("clear() empties the store but preserves counters", async () => {
    const cache = new SemanticCache({ embedder });
    await cache.getOrCompute("ping", async () => "pong");
    await cache.getOrCompute("ping", async () => "pong"); // hit

    cache.clear();

    expect(cache.stats().size).toBe(0);
    expect(cache.stats().hits).toBe(1);
    expect(await cache.lookup("ping")).toBeNull();
  });

  it("accepts a custom VectorStore via config", async () => {
    const store = new InMemoryVectorStore();
    const cache = new SemanticCache({ embedder, store });

    await cache.getOrCompute("ping", async () => "pong");

    expect(store.size()).toBe(1);
  });

  it("validates configuration", () => {
    expect(() => new SemanticCache({ embedder, threshold: 1.5 })).toThrow(RangeError);
    expect(() => new SemanticCache({ embedder, maxEntries: 0 })).toThrow(RangeError);
    // @ts-expect-error embedder is required
    expect(() => new SemanticCache({})).toThrow();
  });
});
