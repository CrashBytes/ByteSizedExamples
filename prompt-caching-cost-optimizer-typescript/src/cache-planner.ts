/**
 * The cache planner: turns a `PlanInput` into a cache-optimized Messages API
 * request.
 *
 * The core idea of provider-side prompt caching is to split the prompt into a
 * STABLE prefix (system + tools + long context) that is byte-identical across
 * requests, and a VOLATILE suffix (the user's question) that changes every
 * time. You place a `cache_control` breakpoint on the LAST stable block; the
 * API caches everything up to and including it. The first request writes the
 * cache (~1.25x/2x base input); every subsequent request reads it (~0.1x).
 *
 * The single most important decision this planner makes is WHERE the breakpoint
 * goes: on the last stable block (context if present, else system) and NEVER on
 * the volatile question. Put it on the question and every request writes a
 * distinct cache entry that is never read — you pay the write premium for
 * nothing.
 */

import type {
  CacheableTextBlock,
  CachePlan,
  PlanInput,
  ToolDef,
} from "./types.js";
import { getPricing } from "./models.js";
import { stableStringify } from "./invalidator-audit.js";

/**
 * Default token estimator: ~4 characters per token.
 *
 * This is a rough heuristic, deliberately not a real tokenizer — it needs no
 * network and no model download, which keeps the planner (and its tests)
 * offline. For real cost decisions on a borderline prefix, call the Anthropic
 * `count_tokens` endpoint and pass the result via `PlanInput.estimateTokens`.
 */
export function estimateTokensDefault(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Max `cache_control` breakpoints the Messages API allows per request. */
const MAX_BREAKPOINTS = 4;

/**
 * Build a cache-optimized request from a `PlanInput`.
 *
 * Layout produced:
 *   system:   [ {system text}, {context text}? ]   <- breakpoint on the LAST one
 *   tools:    passed through unchanged (already stable, rendered first)
 *   messages: [ { role: "user", content: [ {question} ] } ]   <- NO breakpoint
 */
export function planRequest(input: PlanInput): CachePlan {
  const estimate = input.estimateTokens ?? estimateTokensDefault;
  const ttl = input.ttl ?? "5m";
  const tools: ToolDef[] = input.tools ?? [];
  const warnings: string[] = [];

  // Build the stable system blocks: always the system prompt, plus the long
  // context block when provided. These are ordered stable-first so the
  // breakpoint on the last one caches the maximum amount of reusable content.
  const system: CacheableTextBlock[] = [{ type: "text", text: input.system }];
  if (input.context !== undefined) {
    system.push({ type: "text", text: input.context });
  }

  // Place the ONE breakpoint on the last stable block. 5m TTL is the absence of
  // `ttl` (just `{ type: "ephemeral" }`); 1h TTL adds `ttl: "1h"`.
  const lastStable = system[system.length - 1];
  lastStable.cache_control =
    ttl === "1h" ? { type: "ephemeral", ttl: "1h" } : { type: "ephemeral" };

  // The volatile question: a plain user turn with NO cache_control. This is the
  // suffix that pays full price and must never carry a breakpoint.
  const messages: CachePlan["messages"] = [
    { role: "user", content: [{ type: "text", text: input.question }] },
  ];

  // Estimate the stable-prefix size the way the API sees it: tools render
  // first (serialize deterministically so the estimate matches the cached
  // bytes), then system, then context.
  let estimatedStablePrefixTokens = 0;
  if (tools.length > 0) {
    estimatedStablePrefixTokens += estimate(stableStringify(tools));
  }
  estimatedStablePrefixTokens += estimate(input.system);
  if (input.context !== undefined) {
    estimatedStablePrefixTokens += estimate(input.context);
  }

  // Count breakpoints across the whole plan (system + question). By
  // construction this is exactly 1, but we count rather than assume so the
  // guard below is honest.
  const breakpoints = countBreakpoints(system, messages);

  // Warn when the stable prefix is too short to cache on this model. This is
  // the silent failure the whole exercise is about: the request succeeds, but
  // `cache_creation_input_tokens` comes back 0 and you keep paying full price.
  const pricing = getPricing(input.model);
  if (estimatedStablePrefixTokens < pricing.minCacheableTokens) {
    warnings.push(
      `Stable prefix ~${estimatedStablePrefixTokens} tokens is below the ` +
        `${pricing.minCacheableTokens}-token minimum for ${input.model}; ` +
        `it will not cache.`,
    );
  }

  // Guard: the API rejects more than 4 breakpoints. This planner never places
  // more than one, but if this code is extended the guard makes the violation
  // visible rather than letting the API 400 at runtime.
  if (breakpoints > MAX_BREAKPOINTS) {
    warnings.push(
      `Plan has ${breakpoints} cache breakpoints; the maximum is ${MAX_BREAKPOINTS}.`,
    );
  }

  return {
    model: input.model,
    system,
    tools,
    messages,
    breakpoints,
    estimatedStablePrefixTokens,
    warnings,
  };
}

/** Count `cache_control` markers across all content blocks in the plan. */
function countBreakpoints(
  system: CacheableTextBlock[],
  messages: CachePlan["messages"],
): number {
  let n = 0;
  for (const block of system) if (block.cache_control) n++;
  for (const msg of messages) {
    for (const block of msg.content) if (block.cache_control) n++;
  }
  return n;
}
