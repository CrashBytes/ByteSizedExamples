/**
 * Static audit for "silent cache invalidators".
 *
 * Prompt caching is a PREFIX MATCH: any byte change anywhere in the cached
 * prefix invalidates everything after it. The nastiest bugs are the ones that
 * change a byte on *every* request without you noticing — a `Date.now()` baked
 * into the system prompt, a `crypto.randomUUID()` request ID, an unsorted
 * `JSON.stringify` whose key order drifts. The request still succeeds; you just
 * silently pay full price forever (`cache_read_input_tokens` stays 0).
 *
 * This module scans prefix text for those patterns so you can catch them before
 * they cost you, and provides `stableStringify` — the deterministic serializer
 * you should use for anything (like a tool set) that goes into the prefix.
 */

import type { ToolDef } from "./types.js";

/** One detected invalidator, with a remediation hint. */
export interface Finding {
  /** Short rule name, e.g. "Date.now()" or "ISO-8601 datetime". */
  rule: string;
  /** The exact substring that matched. */
  match: string;
  /** Character offset of the match within the scanned text. */
  index: number;
  /** How to fix it. */
  hint: string;
}

/**
 * Each rule is a global regex plus a fix hint. Regexes are declared here (not
 * inline) so the scan loop stays readable and each pattern is documented.
 *
 * Note the `g` flag on every pattern: we reset `lastIndex` before each scan and
 * walk all matches, so multiple invalidators in one prompt are all reported.
 */
const RULES: Array<{ rule: string; regex: RegExp; hint: string }> = [
  {
    rule: "ISO-8601 datetime",
    // e.g. 2026-07-13T12:34:56Z or 2026-07-13T12:34:56.789+02:00
    regex:
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/g,
    hint: "A timestamp changes every request. Move it out of the cached prefix (into the volatile suffix) or drop it.",
  },
  {
    rule: "UUID",
    regex:
      /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g,
    hint: "A UUID makes the prefix unique per request. Remove it or move it after the last cache breakpoint.",
  },
  {
    rule: "Date.now(",
    regex: /Date\.now\(/g,
    hint: "Rendering Date.now() into the prefix rewrites it every call. Compute time in the volatile suffix instead.",
  },
  {
    rule: "new Date(",
    regex: /new Date\(/g,
    hint: "new Date() output drifts. Keep the current time out of the cached prefix.",
  },
  {
    rule: "Math.random(",
    regex: /Math\.random\(/g,
    hint: "Random values make every prefix unique. Remove randomness from cached content.",
  },
  {
    rule: "crypto.randomUUID",
    regex: /crypto\.randomUUID/g,
    hint: "A fresh UUID per request defeats the cache. Generate IDs in the volatile suffix, not the prefix.",
  },
  {
    rule: "uuidv4(",
    regex: /uuidv4\(/g,
    hint: "uuidv4() produces a new value each call. Keep generated IDs out of the cached prefix.",
  },
];

/**
 * Scan text for silent cache invalidators. Returns one `Finding` per match,
 * or `[]` when the text is clean.
 *
 * This is intentionally a text scan, not an AST parse: the prefix you send to
 * the API is ultimately a string, and literal timestamps/UUIDs that got
 * baked in by upstream code look identical to a source-level `Date.now()` call
 * once they land in the prompt. Catching both forms is the point.
 */
export function auditForInvalidators(text: string): Finding[] {
  const findings: Finding[] = [];
  for (const { rule, regex, hint } of RULES) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      findings.push({ rule, match: m[0], index: m.index, hint });
      // Guard against zero-width matches locking the loop (defensive; our
      // patterns always consume characters).
      if (m.index === regex.lastIndex) regex.lastIndex++;
    }
  }
  // Report in document order so the output reads top-to-bottom.
  return findings.sort((a, b) => a.index - b.index);
}

/**
 * Deterministic JSON serialization with recursively sorted object keys.
 *
 * Why this matters for caching: `JSON.stringify(obj)` preserves *insertion*
 * order, so two objects with the same data but different key order serialize to
 * different bytes — and different bytes in the prefix mean a cache miss. Sorting
 * keys makes the output canonical regardless of how the object was built.
 * Arrays keep their order (order is semantically meaningful in an array).
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

/** Recursively rebuild a value with object keys in sorted order. */
function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortDeep);
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortDeep((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

/**
 * Audit a tool set the way it will actually be cached: serialize it
 * canonically with `stableStringify`, then scan that canonical string for
 * invalidators. Returns both the canonical form (what you should send) and any
 * findings.
 *
 * Tools render first in the prompt, so an unstable tool serialization poisons
 * the cache for the system prompt and context that follow it — auditing the
 * canonical bytes catches an embedded timestamp/UUID in a tool description or
 * schema default.
 */
export function auditTools(tools: ToolDef[]): {
  canonical: string;
  findings: Finding[];
} {
  const canonical = stableStringify(tools);
  return { canonical, findings: auditForInvalidators(canonical) };
}
