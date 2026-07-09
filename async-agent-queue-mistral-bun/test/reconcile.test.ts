import { describe, it, expect } from 'bun:test'
import { createStore, type Store } from '../src/store'
import { applyState } from '../src/reconcile'
import { FakeAgentProvider } from '../src/providers/fake'
import type { Job } from '../src/job'
import type { ProviderRegistry } from '../src/provider'

function setup(job: Partial<Job>): { store: Store; providers: ProviderRegistry; fake: FakeAgentProvider; job: Job } {
  const store = createStore(':memory:')
  const fake = new FakeAgentProvider('mistral-work')
  const providers: ProviderRegistry = {
    'mistral-work': fake,
    'openai-bg': new FakeAgentProvider('openai-bg'),
  }
  const full: Job = {
    id: 'j1',
    providerJobId: 'p1',
    provider: 'mistral-work',
    model: 'm',
    prompt: 'p',
    toolset: [],
    status: 'submitted',
    budgetUsd: 5,
    spentUsd: 0,
    createdAt: 1,
    startedAt: null,
    finishedAt: null,
    result: null,
    error: null,
    ...job,
  }
  store.insert(full)
  return { store, providers, fake, job: full }
}

describe('applyState', () => {
  it('is a no-op for the submitted state', () => {
    const { store, providers, job } = setup({ status: 'submitted' })
    expect(applyState(store, providers, job, { kind: 'submitted' })).toBeNull()
    expect(store.get('j1')!.status).toBe('submitted')
  })

  it('moves submitted → running and stamps startedAt', () => {
    const { store, providers, job } = setup({ status: 'submitted' })
    const updated = applyState(store, providers, job, { kind: 'running', spentUsd: 1.2 }, () => 5000)
    expect(updated!.status).toBe('running')
    expect(updated!.spentUsd).toBe(1.2)
    expect(updated!.startedAt).toBe(5000)
  })

  it('trips over_budget and issues a best-effort cancel', () => {
    const { store, providers, fake, job } = setup({ status: 'running', budgetUsd: 5, startedAt: 1 })
    const updated = applyState(store, providers, job, { kind: 'running', spentUsd: 9.99 }, () => 7000)
    expect(updated!.status).toBe('over_budget')
    expect(updated!.finishedAt).toBe(7000)
    expect(fake.cancelCalls).toBe(1)
    expect(fake.cancelled.has('p1')).toBe(true)
  })

  it('records a succeeded result', () => {
    const { store, providers, job } = setup({ status: 'running', startedAt: 1 })
    const updated = applyState(store, providers, job, {
      kind: 'succeeded',
      spentUsd: 2.5,
      result: { review: 'ok' },
    })
    expect(updated!.status).toBe('succeeded')
    expect(updated!.result).toEqual({ review: 'ok' })
    expect(store.get('j1')!.status).toBe('succeeded')
  })

  it('records a failure with its error', () => {
    const { store, providers, job } = setup({ status: 'running', startedAt: 1 })
    const updated = applyState(store, providers, job, {
      kind: 'failed',
      spentUsd: 0.4,
      error: 'tool_loop',
    })
    expect(updated!.status).toBe('failed')
    expect(updated!.error).toBe('tool_loop')
  })

  it('ignores a late poll that would illegally resurrect a terminal job', () => {
    // A succeeded job that gets a stray "running" webhook must not go backwards.
    const { store, providers, job } = setup({ status: 'succeeded', finishedAt: 9 })
    const updated = applyState(store, providers, job, { kind: 'running', spentUsd: 1 })
    expect(updated).toBeNull()
    expect(store.get('j1')!.status).toBe('succeeded')
  })
})
