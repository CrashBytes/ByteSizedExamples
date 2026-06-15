/**
 * CI regression gate.
 *
 * Evals are only useful if a regression actually fails the build. `gate` turns
 * a `RunReport` into a pass/fail with human-readable reasons: enforce absolute
 * floors (min pass rate, min mean score) and/or guard against a drop versus a
 * stored baseline report. Wire `result.ok` to your CI exit code.
 */
import type { RunReport } from './types.js'

export interface GateOptions {
  /** Minimum acceptable pass rate, in [0, 1]. */
  minPassRate?: number
  /** Minimum acceptable mean score, in [0, 1]. */
  minMeanScore?: number
  /** A previous run to compare against for regression detection. */
  baseline?: RunReport
  /** Max allowed drop in mean score vs the baseline. Requires `baseline`. */
  maxRegression?: number
}

export interface GateResult {
  ok: boolean
  reasons: string[]
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

export function gate(report: RunReport, options: GateOptions): GateResult {
  const reasons: string[] = []

  if (options.minPassRate !== undefined && report.passRate < options.minPassRate) {
    reasons.push(`pass rate ${pct(report.passRate)} is below required ${pct(options.minPassRate)}`)
  }

  if (options.minMeanScore !== undefined && report.meanScore < options.minMeanScore) {
    reasons.push(
      `mean score ${report.meanScore.toFixed(3)} is below required ${options.minMeanScore.toFixed(3)}`,
    )
  }

  if (options.baseline && options.maxRegression !== undefined) {
    const drop = options.baseline.meanScore - report.meanScore
    if (drop > options.maxRegression) {
      reasons.push(
        `mean score regressed by ${drop.toFixed(3)} vs baseline ` +
          `(max allowed ${options.maxRegression.toFixed(3)})`,
      )
    }
  }

  return { ok: reasons.length === 0, reasons }
}
