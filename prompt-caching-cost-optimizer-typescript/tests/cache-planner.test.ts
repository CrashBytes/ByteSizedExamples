import { describe, it, expect } from "vitest";
import { planRequest, estimateTokensDefault } from "../src/cache-planner.js";
import type { ToolDef } from "../src/types.js";

const TOOLS: ToolDef[] = [
  {
    name: "search_docs",
    description: "Search the docs.",
    input_schema: { type: "object", properties: { q: { type: "string" } } },
  },
];

// A big stable text so the estimated prefix clears the model minimums.
const BIG = "x".repeat(40_000); // ~10,000 tokens at chars/4

describe("planRequest", () => {
  it("places the cache breakpoint on the last stable block (context when present)", () => {
    const plan = planRequest({
      model: "claude-opus-4-8",
      system: "system prompt",
      context: BIG,
      question: "the question",
    });
    // Two stable blocks: system, then context. Breakpoint on the last one.
    expect(plan.system).toHaveLength(2);
    expect(plan.system[0].cache_control).toBeUndefined();
    expect(plan.system[1].cache_control).toEqual({ type: "ephemeral" });
  });

  it("places the breakpoint on the system block when there is no context", () => {
    const plan = planRequest({
      model: "claude-opus-4-8",
      system: BIG,
      question: "the question",
    });
    expect(plan.system).toHaveLength(1);
    expect(plan.system[0].cache_control).toEqual({ type: "ephemeral" });
  });

  it("never places cache_control on the volatile question", () => {
    const plan = planRequest({
      model: "claude-opus-4-8",
      system: BIG,
      context: BIG,
      question: "the question",
    });
    const questionBlock = plan.messages[0].content[0];
    expect(questionBlock.text).toBe("the question");
    expect(questionBlock.cache_control).toBeUndefined();
  });

  it("emits { type: 'ephemeral', ttl: '1h' } for a 1h TTL", () => {
    const plan = planRequest({
      model: "claude-opus-4-8",
      system: BIG,
      question: "q",
      ttl: "1h",
    });
    expect(plan.system[0].cache_control).toEqual({
      type: "ephemeral",
      ttl: "1h",
    });
  });

  it("warns when the stable prefix is below the model minimum", () => {
    const plan = planRequest({
      model: "claude-opus-4-8", // 4096-token minimum
      system: "short",
      question: "q",
    });
    expect(plan.estimatedStablePrefixTokens).toBeLessThan(4096);
    expect(plan.warnings.some((w) => w.includes("will not cache"))).toBe(true);
  });

  it("produces no warning for a large-enough prefix", () => {
    const plan = planRequest({
      model: "claude-opus-4-8",
      system: BIG,
      tools: TOOLS,
      question: "q",
    });
    expect(plan.estimatedStablePrefixTokens).toBeGreaterThanOrEqual(4096);
    expect(plan.warnings).toEqual([]);
  });

  it("uses exactly one breakpoint (well within the max of 4)", () => {
    const plan = planRequest({
      model: "claude-sonnet-5",
      system: BIG,
      context: BIG,
      tools: TOOLS,
      question: "q",
    });
    expect(plan.breakpoints).toBe(1);
    expect(plan.breakpoints).toBeLessThanOrEqual(4);
  });

  it("passes tools through unchanged and counts them into the prefix estimate", () => {
    const withTools = planRequest({
      model: "claude-opus-4-8",
      system: "sys",
      tools: TOOLS,
      question: "q",
    });
    const withoutTools = planRequest({
      model: "claude-opus-4-8",
      system: "sys",
      question: "q",
    });
    expect(withTools.tools).toEqual(TOOLS);
    expect(withTools.estimatedStablePrefixTokens).toBeGreaterThan(
      withoutTools.estimatedStablePrefixTokens,
    );
  });

  it("honors an injected token estimator", () => {
    const plan = planRequest({
      model: "claude-opus-4-8",
      system: "hello",
      question: "q",
      estimateTokens: () => 9999,
    });
    // system estimate only (no tools, no context) => exactly one call's value.
    expect(plan.estimatedStablePrefixTokens).toBe(9999);
  });
});

describe("estimateTokensDefault", () => {
  it("approximates chars / 4, rounding up", () => {
    expect(estimateTokensDefault("")).toBe(0);
    expect(estimateTokensDefault("abcd")).toBe(1);
    expect(estimateTokensDefault("abcde")).toBe(2);
  });
});
