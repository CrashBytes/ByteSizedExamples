/**
 * Realized-savings calculator.
 *
 * A cache plan is a hypothesis; the `usage` fields on the response are the
 * evidence. This module turns those fields into dollars so you can see whether
 * caching actually paid off on a given request — and by how much.
 *
 * The comparison is always "what you actually paid for input tokens" vs "what
 * you would have paid with no caching at all", using the same total prompt
 * size. That isolates the caching effect from everything else.
 */

import type { Ttl, UsageLike } from "./types.js";
import { CACHE_READ_MULTIPLIER, getPricing } from "./models.js";

/** A per-request cost breakdown attributable to prompt caching. */
export interface SavingsReport {
  model: string;
  /** Fraction of total prompt tokens served from cache (0..1). */
  cacheHitRate: number;
  /** Actual USD paid for INPUT tokens (uncached + write premium + reads). */
  actualInputCostUsd: number;
  /** USD the same prompt would cost with zero caching. */
  uncachedInputCostUsd: number;
  /** Dollars saved this request (uncached - actual). */
  savedUsd: number;
  /** Fraction saved vs the uncached baseline (0..1). */
  savedPct: number;
}

/**
 * Compute realized savings from a response's `usage`.
 *
 * The cost model (all on the INPUT side — output tokens are unaffected by
 * caching and priced identically either way, so they cancel out of a savings
 * comparison and are excluded here):
 *
 *   inputPrice = inputPerMTok / 1e6                (USD per token)
 *   actual     = input   * inputPrice
 *              + creation * inputPrice * writeMult  (1.25x @5m, 2x @1h)
 *              + read    * inputPrice * 0.1         (the cache-read discount)
 *   total      = input + creation + read            (whole prompt, either way)
 *   uncached   = total * inputPrice                 (no caching baseline)
 *   saved      = uncached - actual
 *
 * `cache_creation_input_tokens` and `cache_read_input_tokens` default to 0 when
 * the API omits them (e.g. a response that did no caching at all).
 */
export function computeSavings(
  model: string,
  usage: UsageLike,
  ttl?: Ttl,
): SavingsReport {
  const pricing = getPricing(model);
  const inputPrice = pricing.inputPerMTok / 1e6;

  const input = usage.input_tokens;
  const creation = usage.cache_creation_input_tokens ?? 0;
  const read = usage.cache_read_input_tokens ?? 0;

  // Write premium depends on TTL: 2x for the 1-hour cache, 1.25x for the
  // default 5-minute cache.
  const writeMult = ttl === "1h" ? 2 : 1.25;
  const readMult = CACHE_READ_MULTIPLIER;

  const actualInput =
    input * inputPrice +
    creation * inputPrice * writeMult +
    read * inputPrice * readMult;

  const total = input + creation + read;
  const uncached = total * inputPrice;

  const saved = uncached - actualInput;
  const savedPct = uncached > 0 ? saved / uncached : 0;
  const cacheHitRate = total > 0 ? read / total : 0;

  return {
    model,
    cacheHitRate,
    actualInputCostUsd: actualInput,
    uncachedInputCostUsd: uncached,
    savedUsd: saved,
    savedPct,
  };
}
