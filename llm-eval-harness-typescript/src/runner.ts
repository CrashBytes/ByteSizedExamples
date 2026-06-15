/**
 * The eval runner: take a suite of test cases, run the system under test on
 * each, score every output with every scorer, and aggregate into a report.
 *
 * Design choices that matter in practice:
 *  - Concurrency is capped (provider rate limits / cost control).
 *  - A target that throws fails *that* case but never aborts the run — one bad
 *    example shouldn't sink a 500-case suite.
 *  - Scorers combine by weight; an aggregate at or above `threshold` passes.
 */
import type { CaseResult, RunReport, Scorer, Target, TestCase } from './types.js'
import { pLimit } from './concurrency.js'

export interface RunOptions {
  /** The system under test. */
  target: Target
  /** One or more scorers; their weighted mean is the case score. */
  scorers: Scorer[]
  /** Aggregate score at or above which a case passes. Default 0.7. */
  threshold?: number
  /** Per-scorer weights, keyed by scorer name. Missing scorers default to 1. */
  weights?: Record<string, number>
  /** Max concurrent targets. Default 4. */
  concurrency?: number
  /** Retries if the target throws (transient errors). Default 0. */
  retries?: number
}

async function withRetries<T>(fn: () => Promise<T>, retries: number): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
    }
  }
  throw lastError
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0
  return Math.min(1, Math.max(0, n))
}

export async function runEval(cases: TestCase[], options: RunOptions): Promise<RunReport> {
  const { target, scorers } = options
  const threshold = options.threshold ?? 0.7
  const concurrency = options.concurrency ?? 4
  const retries = options.retries ?? 0
  const weights = options.weights ?? {}
  const totalWeight = scorers.reduce((sum, s) => sum + (weights[s.name] ?? 1), 0)
  const limit = pLimit(concurrency)

  const results = await Promise.all(
    cases.map((testCase) =>
      limit(async (): Promise<CaseResult> => {
        try {
          const output = await withRetries(
            async () => target(testCase.input, testCase),
            retries,
          )

          const scores: Record<string, number> = {}
          let weighted = 0
          for (const scorer of scorers) {
            const value = clamp01(
              await scorer.score({ output, expected: testCase.expected, testCase }),
            )
            scores[scorer.name] = value
            weighted += value * (weights[scorer.name] ?? 1)
          }
          const score = totalWeight === 0 ? 0 : weighted / totalWeight

          return {
            id: testCase.id,
            input: testCase.input,
            output,
            score,
            passed: score >= threshold,
            scores,
          }
        } catch (err) {
          return {
            id: testCase.id,
            input: testCase.input,
            output: '',
            score: 0,
            passed: false,
            scores: {},
            error: err instanceof Error ? err.message : String(err),
          }
        }
      }),
    ),
  )

  const passed = results.filter((r) => r.passed).length
  const meanScore = results.length
    ? results.reduce((sum, r) => sum + r.score, 0) / results.length
    : 0

  const byScorer: Record<string, number> = {}
  for (const scorer of scorers) {
    const values = results
      .map((r) => r.scores[scorer.name])
      .filter((v): v is number => typeof v === 'number')
    byScorer[scorer.name] = values.length
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0
  }

  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    passRate: results.length ? passed / results.length : 0,
    meanScore,
    byScorer,
    results,
  }
}
