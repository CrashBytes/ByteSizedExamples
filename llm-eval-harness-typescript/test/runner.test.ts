import { describe, it, expect } from 'vitest'
import { runEval } from '../src/runner.js'
import { exactMatch, includes } from '../src/scorers.js'
import { rubricScorer, type JudgeFn } from '../src/judge.js'
import type { Rubric } from '../src/rubric.js'
import type { TestCase } from '../src/types.js'

const cases: TestCase[] = [
  { id: '1', input: 'capital of France?', expected: 'Paris' },
  { id: '2', input: 'capital of Japan?', expected: 'Tokyo' },
]

describe('runEval', () => {
  it('scores a perfect target as all-passed', async () => {
    const report = await runEval(cases, {
      target: (_input, testCase) => testCase.expected!,
      scorers: [exactMatch()],
    })
    expect(report.total).toBe(2)
    expect(report.passed).toBe(2)
    expect(report.passRate).toBe(1)
    expect(report.meanScore).toBe(1)
  })

  it('marks failing cases and isolates target errors without aborting the run', async () => {
    const report = await runEval([...cases, { id: '3', input: 'boom', expected: 'x' }], {
      target: (input) => {
        if (input === 'boom') throw new Error('model down')
        return 'wrong'
      },
      scorers: [exactMatch()],
      threshold: 0.7,
    })
    expect(report.total).toBe(3)
    expect(report.failed).toBe(3)
    const errored = report.results.find((r) => r.id === '3')!
    expect(errored.error).toContain('model down')
    expect(errored.passed).toBe(false)
  })

  it('retries a flaky target before giving up', async () => {
    let attempts = 0
    const report = await runEval([{ id: 'flaky', input: 'q', expected: 'ok' }], {
      target: () => {
        attempts++
        if (attempts < 3) throw new Error('transient')
        return 'ok'
      },
      scorers: [exactMatch()],
      retries: 2,
    })
    expect(attempts).toBe(3)
    expect(report.passed).toBe(1)
  })

  it('combines scorers with weights', async () => {
    const report = await runEval(cases, {
      target: () => 'Paris is the capital',
      scorers: [exactMatch(), includes()],
      weights: { exactMatch: 0, includes: 1 },
      threshold: 0.5,
    })
    const c1 = report.results.find((r) => r.id === '1')!
    // exactMatch fails but is weighted 0; includes passes for "Paris"
    expect(c1.scores.exactMatch).toBe(0)
    expect(c1.scores.includes).toBe(1)
    expect(c1.score).toBe(1)
  })

  it('drives an LLM-judge scorer with a deterministic fake judge', async () => {
    // Fake judge: 5 points when the AI response section contains "Paris", else 2.
    const fakeJudge: JudgeFn = (prompt) => {
      const responseSection = prompt.slice(prompt.indexOf('AI response:'))
      const points = responseSection.includes('Paris') ? 5 : 2
      return JSON.stringify({ scores: { helpfulness: points }, rationale: 'fake' })
    }
    const rubric: Rubric = {
      criteria: [{ name: 'helpfulness', description: 'helps the user' }],
      scale: 5,
    }
    const report = await runEval([cases[0]], {
      target: () => 'The capital is Paris.',
      scorers: [rubricScorer(fakeJudge, rubric)],
      threshold: 0.9,
    })
    expect(report.results[0].scores.rubric).toBe(1) // (5 - 1) / (5 - 1)
    expect(report.passed).toBe(1)
    expect(report.byScorer.rubric).toBe(1)
  })
})
