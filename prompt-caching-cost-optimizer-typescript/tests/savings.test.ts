import { describe, it, expect } from "vitest";
import { computeSavings } from "../src/savings.js";
import type { UsageLike } from "../src/types.js";

describe("computeSavings", () => {
  it("reports a high hit rate and large savings when most tokens are cache reads", () => {
    const usage: UsageLike = {
      input_tokens: 100,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 9900,
      output_tokens: 200,
    };
    const report = computeSavings("claude-opus-4-8", usage, "5m");
    expect(report.cacheHitRate).toBeCloseTo(9900 / 10000, 6);
    // Reads cost 0.1x, so savings should be well above 80%.
    expect(report.savedPct).toBeGreaterThan(0.8);
    expect(report.savedUsd).toBeGreaterThan(0);
  });

  it("yields ~0 savings and 0 hit rate for an all-uncached usage", () => {
    const usage: UsageLike = {
      input_tokens: 5000,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      output_tokens: 100,
    };
    const report = computeSavings("claude-opus-4-8", usage);
    expect(report.cacheHitRate).toBe(0);
    expect(report.savedPct).toBeCloseTo(0, 6);
    expect(report.savedUsd).toBeCloseTo(0, 9);
  });

  it("treats missing cache fields as zero", () => {
    const usage: UsageLike = { input_tokens: 1000, output_tokens: 50 };
    const report = computeSavings("claude-sonnet-5", usage);
    expect(report.cacheHitRate).toBe(0);
    expect(report.savedUsd).toBeCloseTo(0, 9);
  });

  it("charges the 1h write multiplier (2x) higher than the 5m multiplier (1.25x)", () => {
    const usage: UsageLike = {
      input_tokens: 50,
      cache_creation_input_tokens: 8000,
      cache_read_input_tokens: 0,
      output_tokens: 100,
    };
    const fiveMin = computeSavings("claude-opus-4-8", usage, "5m");
    const oneHour = computeSavings("claude-opus-4-8", usage, "1h");
    // The 1h cache write is more expensive, so actual cost is higher and the
    // realized saving vs the uncached baseline is smaller.
    expect(oneHour.actualInputCostUsd).toBeGreaterThan(
      fiveMin.actualInputCostUsd,
    );
    expect(oneHour.savedUsd).toBeLessThan(fiveMin.savedUsd);

    // Verify the exact multiplier difference: (2 - 1.25) x creation x price.
    const inputPrice = 5 / 1e6; // opus input $/token
    const expectedDelta = 8000 * inputPrice * (2 - 1.25);
    expect(oneHour.actualInputCostUsd - fiveMin.actualInputCostUsd).toBeCloseTo(
      expectedDelta,
      9,
    );
  });

  it("throws a clear error for an unknown model", () => {
    expect(() =>
      computeSavings("gpt-does-not-exist", { input_tokens: 1, output_tokens: 1 }),
    ).toThrow(/Unknown model/);
  });
});
