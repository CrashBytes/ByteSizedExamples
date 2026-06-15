/**
 * End-to-end example: run a small suite against a mock system under test,
 * score it with a deterministic scorer plus a (faked) LLM judge, and apply a
 * CI gate. Run with `npm run example`.
 *
 * In production you would replace `mockTarget` with a call to your real agent
 * and `mockJudge` with a call to a strong model (e.g. Claude) behind the same
 * `JudgeFn` signature — nothing else in this file changes.
 */
import {
  runEval,
  gate,
  includes,
  rubricScorer,
  type JudgeFn,
  type Rubric,
  type Target,
  type TestCase,
} from '../src/index.js'

const suite: TestCase[] = [
  { id: 'refund', input: 'How do I get a refund?', expected: 'refund' },
  { id: 'hours', input: 'What are your support hours?', expected: '24/7' },
  { id: 'reset', input: 'How do I reset my password?', expected: 'reset link' },
]

// A stand-in for the agent under test. Deterministic so the example is stable.
const mockTarget: Target = (input) => {
  if (input.includes('refund')) return 'You can request a refund from the Orders page within 30 days.'
  if (input.includes('hours')) return 'Our support team is available 24/7 via chat and email.'
  return 'Use the "Forgot password" reset link on the sign-in screen.'
}

// A stand-in for a strong judge model. Returns valid rubric JSON.
const mockJudge: JudgeFn = (prompt) => {
  const responseSection = prompt.slice(prompt.indexOf('AI response:'))
  const helpful = responseSection.length > 60 ? 5 : 3
  return JSON.stringify({
    scores: { helpfulness: helpful, safety: 5 },
    rationale: 'mock judgement',
  })
}

const rubric: Rubric = {
  criteria: [
    { name: 'helpfulness', description: 'directly answers the user', weight: 2 },
    { name: 'safety', description: 'no harmful or policy-violating content' },
  ],
  scale: 5,
}

const report = await runEval(suite, {
  target: mockTarget,
  scorers: [includes(), rubricScorer(mockJudge, rubric)],
  weights: { includes: 1, rubric: 2 },
  threshold: 0.7,
  concurrency: 4,
})

console.log(`pass rate : ${(report.passRate * 100).toFixed(1)}%`)
console.log(`mean score: ${report.meanScore.toFixed(3)}`)
console.log('by scorer :', report.byScorer)

const result = gate(report, { minPassRate: 0.8, minMeanScore: 0.7 })
console.log('\ngate      :', result.ok ? 'PASS' : 'FAIL')
if (!result.ok) for (const reason of result.reasons) console.log(`  - ${reason}`)

process.exit(result.ok ? 0 : 1)
