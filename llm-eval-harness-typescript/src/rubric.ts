/**
 * Rubric construction and parsing for LLM-as-judge scoring.
 *
 * A rubric is a list of named criteria scored on a 1..scale integer scale.
 * `buildJudgePrompt` turns a rubric + one sample into a strict prompt; the
 * judge returns JSON; `parseJudgeResponse` validates and clamps it. Keeping
 * prompt-building and parsing pure (no I/O) makes them trivially unit-testable.
 */
import { extractJson } from './json.js'

export interface RubricCriterion {
  name: string
  description: string
  /** Relative weight when combining criteria. Defaults to 1. */
  weight?: number
}

export interface Rubric {
  criteria: RubricCriterion[]
  /** Max integer points per criterion. Defaults to 5. */
  scale?: number
}

export interface JudgeSample {
  input: string
  output: string
  expected?: string
}

/** Render a strict, deterministic judging prompt for one sample. */
export function buildJudgePrompt(rubric: Rubric, sample: JudgeSample): string {
  const scale = rubric.scale ?? 5
  const criteriaList = rubric.criteria
    .map((c, i) => `${i + 1}. ${c.name}: ${c.description}`)
    .join('\n')
  const referenceBlock = sample.expected
    ? `\nReference answer:\n"""\n${sample.expected}\n"""\n`
    : ''
  const keys = rubric.criteria.map((c) => `"${c.name}": <integer 1-${scale}>`).join(', ')

  return [
    `You are a strict evaluator. Score the AI response against each criterion on a 1-${scale} scale ` +
      `(1 = fails completely, ${scale} = perfect). Be conservative; do not award the top score unless the response is excellent.`,
    ``,
    `Criteria:`,
    criteriaList,
    ``,
    `User input:`,
    `"""\n${sample.input}\n"""`,
    referenceBlock,
    `AI response:`,
    `"""\n${sample.output}\n"""`,
    ``,
    `Respond with ONLY a JSON object of the form:`,
    `{ "scores": { ${keys} }, "rationale": "<one short sentence>" }`,
  ].join('\n')
}

export interface ParsedJudgement {
  /** Raw integer score per criterion, clamped to [1, scale]. */
  scores: Record<string, number>
  rationale?: string
}

/** Parse and validate a judge response against the rubric it was asked about. */
export function parseJudgeResponse(raw: string, rubric: Rubric): ParsedJudgement {
  const obj = JSON.parse(extractJson(raw)) as {
    scores?: Record<string, unknown>
    rationale?: unknown
  }
  if (!obj || typeof obj !== 'object' || !obj.scores || typeof obj.scores !== 'object') {
    throw new Error('judge response missing a "scores" object')
  }

  const scale = rubric.scale ?? 5
  const scores: Record<string, number> = {}
  for (const c of rubric.criteria) {
    const value = Number((obj.scores as Record<string, unknown>)[c.name])
    if (!Number.isFinite(value)) {
      throw new Error(`judge omitted a numeric score for criterion "${c.name}"`)
    }
    scores[c.name] = Math.min(scale, Math.max(1, value))
  }

  return {
    scores,
    rationale: typeof obj.rationale === 'string' ? obj.rationale : undefined,
  }
}
