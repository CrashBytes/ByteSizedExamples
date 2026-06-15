/**
 * LLM-as-judge scorer.
 *
 * A `JudgeFn` is any function that takes a prompt and returns completion text.
 * That single seam keeps the harness provider-agnostic: in production you wrap
 * the Anthropic SDK (or any model) behind it; in tests you pass a deterministic
 * fake so the suite is fast, free, and reproducible.
 */
import type { Scorer, ScoreArgs } from './types.js'
import { buildJudgePrompt, parseJudgeResponse, type Rubric } from './rubric.js'

export type JudgeFn = (prompt: string) => Promise<string> | string

export interface RubricScorerOptions {
  /** Scorer name in reports. Defaults to "rubric". */
  name?: string
}

/**
 * Build a scorer that asks an LLM judge to grade each output against a rubric,
 * then collapses the per-criterion scores into one weighted value in [0, 1].
 *
 * The 1..scale integer scores are mapped to [0, 1] as (score - 1) / (scale - 1)
 * so the bottom of the scale is 0 and the top is 1, then combined by weight.
 */
export function rubricScorer(
  judge: JudgeFn,
  rubric: Rubric,
  options: RubricScorerOptions = {},
): Scorer {
  const scale = rubric.scale ?? 5
  if (scale < 2) throw new Error('rubric scale must be >= 2')
  const totalWeight = rubric.criteria.reduce((sum, c) => sum + (c.weight ?? 1), 0)
  if (totalWeight <= 0) throw new Error('rubric criteria weights must sum to > 0')

  return {
    name: options.name ?? 'rubric',
    async score({ output, expected, testCase }: ScoreArgs) {
      const prompt = buildJudgePrompt(rubric, { input: testCase.input, output, expected })
      const raw = await judge(prompt)
      const { scores } = parseJudgeResponse(raw, rubric)

      let weighted = 0
      for (const c of rubric.criteria) {
        const normalized = (scores[c.name] - 1) / (scale - 1)
        weighted += normalized * (c.weight ?? 1)
      }
      return weighted / totalWeight
    },
  }
}
