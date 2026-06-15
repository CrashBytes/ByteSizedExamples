import { describe, it, expect } from 'vitest'
import { buildJudgePrompt, parseJudgeResponse, type Rubric } from '../src/rubric.js'

const rubric: Rubric = {
  criteria: [
    { name: 'accuracy', description: 'factually correct' },
    { name: 'tone', description: 'professional tone', weight: 0.5 },
  ],
  scale: 5,
}

describe('buildJudgePrompt', () => {
  it('mentions every criterion, the scale, and the reference block', () => {
    const prompt = buildJudgePrompt(rubric, { input: 'hi', output: 'hello', expected: 'hello there' })
    expect(prompt).toContain('accuracy')
    expect(prompt).toContain('tone')
    expect(prompt).toContain('1-5')
    expect(prompt).toContain('Reference answer')
  })

  it('omits the reference block when there is no expected answer', () => {
    const prompt = buildJudgePrompt(rubric, { input: 'hi', output: 'hello' })
    expect(prompt).not.toContain('Reference answer')
  })
})

describe('parseJudgeResponse', () => {
  it('parses fenced JSON and clamps out-of-range scores', () => {
    const raw = 'Sure!\n```json\n{ "scores": { "accuracy": 9, "tone": 0 }, "rationale": "ok" }\n```'
    const parsed = parseJudgeResponse(raw, rubric)
    expect(parsed.scores.accuracy).toBe(5) // clamped to scale max
    expect(parsed.scores.tone).toBe(1) // clamped to min
    expect(parsed.rationale).toBe('ok')
  })

  it('throws when a criterion score is missing', () => {
    const raw = '{ "scores": { "accuracy": 4 } }'
    expect(() => parseJudgeResponse(raw, rubric)).toThrow(/tone/)
  })

  it('throws when the scores object is absent', () => {
    expect(() => parseJudgeResponse('{ "rationale": "no scores" }', rubric)).toThrow(/scores/)
  })
})
