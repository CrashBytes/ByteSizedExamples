/**
 * Shared request/response shapes for the cache planner and cost analyzer.
 *
 * These types deliberately mirror the fields of a real Anthropic Messages API
 * request (`system` blocks with `cache_control`, `tools`, `messages`) and the
 * `usage` fields of a real response, so a `CachePlan` can be spread straight
 * into `anthropic.messages.create(...)` and a real `usage` object satisfies
 * `UsageLike`.
 */

/** Cache time-to-live. "5m" is the default (absence of an explicit TTL). */
export type Ttl = "5m" | "1h";

/**
 * A tool definition, in the exact shape the Messages API expects. Tools render
 * FIRST in the prompt (order is tools -> system -> messages), so any change to
 * this list — added tool, reordered keys — invalidates the entire cache.
 */
export interface ToolDef {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

/**
 * A cacheable text content block.
 *
 * Modeling decision: we only ever EMIT `ttl: "1h"`. The 5-minute TTL is
 * represented by the *absence* of `ttl` (just `{ type: "ephemeral" }`), which
 * matches the API — there is no `ttl: "5m"` on the wire. Encoding that in the
 * type prevents accidentally serializing an invalid `"5m"` string.
 */
export interface CacheableTextBlock {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral"; ttl?: "1h" };
}

/**
 * Everything the planner needs to build a cache-optimized request.
 *
 * The mental model: `system` + `tools` + `context` form the STABLE prefix that
 * should be cached; `question` is the VOLATILE suffix that changes per request
 * and must never carry a cache breakpoint.
 */
export interface PlanInput {
  /** Model ID — drives pricing and the minimum-cacheable-prefix check. */
  model: string;
  /** Stable system prompt. Frozen text — no timestamps, no per-user IDs. */
  system: string;
  /** Stable tool set. Rendered first; serialize deterministically. */
  tools?: ToolDef[];
  /** Optional long, stable context (docs, few-shot examples, knowledge base). */
  context?: string;
  /** The volatile user question. Pays full price; never cached. */
  question: string;
  /** Cache TTL for the stable prefix. Defaults to "5m". */
  ttl?: Ttl;
  /**
   * Injected token estimator. Dependency-injected so tests are deterministic
   * and offline; defaults to `estimateTokensDefault` (chars / 4).
   */
  estimateTokens?: (text: string) => number;
}

/**
 * The output of the planner: a ready-to-send request plus the metadata a
 * caller needs to reason about whether caching will actually help.
 */
export interface CachePlan {
  model: string;
  /** `system` blocks — the last stable block carries the cache breakpoint. */
  system: CacheableTextBlock[];
  /** Tools, passed through unchanged (already stable). */
  tools: ToolDef[];
  /** The user turn. The question block has NO cache_control. */
  messages: Array<{ role: "user"; content: CacheableTextBlock[] }>;
  /** How many `cache_control` markers the plan contains. Must be <= 4. */
  breakpoints: number;
  /** Estimated size of the stable prefix, used for the minimum-size warning. */
  estimatedStablePrefixTokens: number;
  /** Human-readable warnings (e.g. prefix too short to cache). */
  warnings: string[];
}

/**
 * The subset of an Anthropic response `usage` object this tool reads. A real
 * `@anthropic-ai/sdk` `Usage` satisfies this structurally.
 *
 * Total prompt tokens = input + cache_creation + cache_read. `input_tokens` is
 * the UNCACHED remainder only — a common source of "why is my token count so
 * low?" confusion when most of the prompt was served from cache.
 */
export interface UsageLike {
  /** Uncached prompt tokens, charged at full input price. */
  input_tokens: number;
  /** Tokens written to cache this request (charged ~1.25x/2x base input). */
  cache_creation_input_tokens?: number;
  /** Tokens served from cache this request (charged ~0.1x base input). */
  cache_read_input_tokens?: number;
  /** Completion tokens. */
  output_tokens: number;
}
