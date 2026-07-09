import { describe, it, expect } from 'bun:test'
import { canTransition, isTerminal, transitions, Job } from '../src/job'

describe('job state machine', () => {
  it('allows the happy-path transitions', () => {
    expect(canTransition('queued', 'submitted')).toBe(true)
    expect(canTransition('submitted', 'running')).toBe(true)
    expect(canTransition('running', 'succeeded')).toBe(true)
    expect(canTransition('running', 'over_budget')).toBe(true)
  })

  it('rejects illegal transitions', () => {
    expect(canTransition('succeeded', 'running')).toBe(false)
    expect(canTransition('queued', 'running')).toBe(false)
    expect(canTransition('running', 'running')).toBe(false)
    expect(canTransition('failed', 'succeeded')).toBe(false)
  })

  it('marks the four terminal states as terminal', () => {
    expect(isTerminal('succeeded')).toBe(true)
    expect(isTerminal('failed')).toBe(true)
    expect(isTerminal('over_budget')).toBe(true)
    expect(isTerminal('cancelled')).toBe(true)
    expect(isTerminal('queued')).toBe(false)
    expect(isTerminal('running')).toBe(false)
  })

  it('has a transition entry for every status', () => {
    for (const status of Object.keys(transitions)) {
      expect(Array.isArray(transitions[status as keyof typeof transitions])).toBe(true)
    }
  })

  it('validates a well-formed job through the zod schema', () => {
    const parsed = Job.parse({
      id: 'j1',
      providerJobId: null,
      provider: 'mistral-work',
      model: 'mistral-large-latest',
      prompt: 'hi',
      toolset: ['read_file'],
      status: 'queued',
      budgetUsd: 5,
      spentUsd: 0,
      createdAt: 1,
      startedAt: null,
      finishedAt: null,
      result: null,
      error: null,
    })
    expect(parsed.provider).toBe('mistral-work')
    expect(() => Job.parse({ id: 'x' })).toThrow()
  })
})
