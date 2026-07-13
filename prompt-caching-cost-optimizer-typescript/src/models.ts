/**
 * Model pricing and prompt-caching cost multipliers.
 *
 * Why this file exists: every savings calculation ultimately reduces to
 * "tokens x per-token price x a cache multiplier". Keeping the pricing and the
 * multipliers in one place means the cost math in `savings.ts` never hardcodes
 * a number, and updating a price is a one-line change here.
 *
 * All prices are in USD per 1,000,000 tokens, taken from Anthropic's published
 * model pricing. `minCacheableTokens` is the model-specific minimum prefix size
 * below which a `cache_control` breakpoint is silently ignored (you get
 * `cache_creation_input_tokens: 0` with no error) — this is the single most
 * common reason a "cached" prompt never actually caches.
 */

export interface ModelPricing {
  /** USD per 1M input (prompt) tokens at full, uncached price. */
  inputPerMTok: number;
  /** USD per 1M output (completion) tokens. */
  outputPerMTok: number;
  /**
   * Minimum stable-prefix size (in tokens) that will actually cache on this
   * model. A shorter prefix silently does NOT cache — the request succeeds,
   * `cache_creation_input_tokens` is 0, and you keep paying full price.
   */
  minCacheableTokens: number;
}

/**
 * The three models this optimizer knows about.
 *
 * Note the two cache-minimum tiers: the current Sonnet tokenizer tier caches
 * from 2048 tokens, while Opus 4.8 and Haiku 4.5 require 4096. A 3,000-token
 * stable prefix caches on Sonnet but silently will not on Opus — which is
 * exactly the kind of trap `planRequest` warns about.
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  "claude-opus-4-8": {
    inputPerMTok: 5,
    outputPerMTok: 25,
    minCacheableTokens: 4096,
  },
  "claude-sonnet-5": {
    inputPerMTok: 3,
    outputPerMTok: 15,
    minCacheableTokens: 2048,
  },
  "claude-haiku-4-5": {
    inputPerMTok: 1,
    outputPerMTok: 5,
    minCacheableTokens: 4096,
  },
};

/**
 * Cache-write premium for the default 5-minute TTL: writing a token to the
 * cache costs ~1.25x the base input price. You pay this once, on the request
 * that creates the cache entry.
 */
export const CACHE_WRITE_MULTIPLIER_5M = 1.25;

/**
 * Cache-write premium for the 1-hour TTL: ~2x base input. The doubled write
 * cost is why the 1h TTL only pays off across more reads than the 5m TTL.
 */
export const CACHE_WRITE_MULTIPLIER_1H = 2;

/**
 * Cache-read discount: a token served from the cache costs ~0.1x base input —
 * the ~90% saving that makes prompt caching worthwhile.
 */
export const CACHE_READ_MULTIPLIER = 0.1;

/**
 * Look up pricing for a model, throwing a clear error for anything unknown.
 * Callers (the planner, the savings calculator) rely on this instead of
 * indexing `MODEL_PRICING` directly so an unrecognized model fails loudly at
 * the call site rather than producing `undefined`-driven NaN costs downstream.
 */
export function getPricing(model: string): ModelPricing {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    const known = Object.keys(MODEL_PRICING).join(", ");
    throw new Error(
      `Unknown model "${model}". Known models: ${known}.`,
    );
  }
  return pricing;
}
