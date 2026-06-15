/**
 * Deterministic, reference-based scorers.
 *
 * These are cheap, fast, and free — run them before reaching for an LLM judge.
 * Every scorer returns a normalized score in [0, 1] so they compose with
 * rubric (judge) scorers under one weighting scheme in the runner.
 */
import type { Scorer, ScoreArgs } from './types.js'
import { extractJson } from './json.js'

/** 1 when output equals expected. Case-insensitive and trimmed by default. */
export const exactMatch = (opts: { caseSensitive?: boolean } = {}): Scorer => ({
  name: 'exactMatch',
  score({ output, expected }: ScoreArgs) {
    if (expected === undefined) return 0
    const norm = (s: string) => (opts.caseSensitive ? s : s.toLowerCase()).trim()
    return norm(output) === norm(expected) ? 1 : 0
  },
})

/** 1 when output contains expected as a substring. */
export const includes = (opts: { caseSensitive?: boolean } = {}): Scorer => ({
  name: 'includes',
  score({ output, expected }: ScoreArgs) {
    if (!expected) return 0
    const haystack = opts.caseSensitive ? output : output.toLowerCase()
    const needle = opts.caseSensitive ? expected : expected.toLowerCase()
    return haystack.includes(needle) ? 1 : 0
  },
})

/** 1 when output matches the supplied pattern. Great for format checks. */
export const regexMatch = (pattern: RegExp): Scorer => ({
  name: 'regexMatch',
  score({ output }: ScoreArgs) {
    return pattern.test(output) ? 1 : 0
  },
})

/** Classic Levenshtein edit distance (two-row, O(n) memory). */
export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  let prev = new Array<number>(n + 1)
  let curr = new Array<number>(n + 1)
  for (let j = 0; j <= n; j++) prev[j] = j

  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[n]
}

/** Normalized string similarity: 1 - editDistance / maxLength, in [0, 1]. */
export const similarity = (): Scorer => ({
  name: 'similarity',
  score({ output, expected }: ScoreArgs) {
    if (expected === undefined) return 0
    const a = output.trim()
    const b = expected.trim()
    const maxLen = Math.max(a.length, b.length)
    if (maxLen === 0) return 1
    return 1 - levenshtein(a, b) / maxLen
  },
})

/** Parse output as (possibly fenced) JSON and compare one field to expected. */
export const jsonField = (field: string): Scorer => ({
  name: `jsonField:${field}`,
  score({ output, expected }: ScoreArgs) {
    if (expected === undefined) return 0
    try {
      const parsed = JSON.parse(extractJson(output)) as Record<string, unknown>
      return String(parsed?.[field]) === expected ? 1 : 0
    } catch {
      return 0
    }
  },
})
