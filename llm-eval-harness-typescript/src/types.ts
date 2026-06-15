/**
 * Core types for the evaluation harness.
 *
 * The harness is string-in / string-out, which mirrors how almost every LLM
 * eval works in practice: you have a prompt (`input`), the system under test
 * produces text (`output`), and you optionally have a gold `expected` answer.
 */

/** A single example to evaluate the system under test against. */
export interface TestCase {
  /** Stable identifier — used in reports and to diff runs over time. */
  id: string
  /** The prompt / question fed to the system under test. */
  input: string
  /** Optional gold answer or reference for reference-based scorers. */
  expected?: string
  /** Freeform tags for filtering or grouping a suite. */
  tags?: string[]
  /** Arbitrary context a scorer can read (e.g. retrieved docs, a category). */
  metadata?: Record<string, unknown>
}

/** The system under test: given an input, produce output text. */
export type Target = (input: string, testCase: TestCase) => Promise<string> | string

/** Arguments handed to every scorer. */
export interface ScoreArgs {
  output: string
  expected?: string
  testCase: TestCase
}

/**
 * A scorer maps one model output to a normalized score in [0, 1].
 * Deterministic scorers (exact match, regex, similarity) and LLM-as-judge
 * scorers share this interface, so the runner treats them identically.
 */
export interface Scorer {
  name: string
  score(args: ScoreArgs): Promise<number> | number
}

/** Per-case outcome after running every scorer. */
export interface CaseResult {
  id: string
  input: string
  output: string
  /** Weighted aggregate across all scorers, in [0, 1]. */
  score: number
  passed: boolean
  /** Raw per-scorer scores, keyed by scorer name. */
  scores: Record<string, number>
  /** Optional extra detail a scorer may attach (e.g. a judge rationale). */
  details?: Record<string, unknown>
  /** Set when the target threw — the case fails but the run continues. */
  error?: string
}

/** Aggregate report for a whole suite. */
export interface RunReport {
  total: number
  passed: number
  failed: number
  /** Fraction of cases at or above the pass threshold, in [0, 1]. */
  passRate: number
  /** Mean aggregate score across all cases, in [0, 1]. */
  meanScore: number
  /** Mean score per scorer across the suite. */
  byScorer: Record<string, number>
  results: CaseResult[]
}
