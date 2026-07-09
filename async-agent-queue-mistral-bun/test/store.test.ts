import { describe, it, expect } from 'bun:test'
import { createStore } from '../src/store'
import type { Job } from '../src/job'

function makeJob(over: Partial<Job> = {}): Job {
  return {
    id: 'j1',
    providerJobId: null,
    provider: 'mistral-work',
    model: 'mistral-large-latest',
    prompt: 'review the diff',
    toolset: ['read_file', 'read_diff'],
    status: 'queued',
    budgetUsd: 5,
    spentUsd: 0,
    createdAt: 1000,
    startedAt: null,
    finishedAt: null,
    result: null,
    error: null,
    ...over,
  }
}

describe('createStore (in-memory)', () => {
  it('round-trips a job through insert/get, preserving JSON columns', () => {
    const store = createStore(':memory:')
    const job = makeJob({ result: { findings: 3 } })
    store.insert(job)
    const got = store.get('j1')
    expect(got).not.toBeNull()
    expect(got!.toolset).toEqual(['read_file', 'read_diff'])
    expect(got!.result).toEqual({ findings: 3 })
    store.close()
  })

  it('looks a job up by provider id', () => {
    const store = createStore(':memory:')
    store.insert(makeJob({ providerJobId: 'sess-42', status: 'submitted' }))
    expect(store.byProviderId('sess-42')!.id).toBe('j1')
    expect(store.byProviderId('nope')).toBeNull()
    store.close()
  })

  it('partitions jobs into queued vs in-flight', () => {
    const store = createStore(':memory:')
    store.insert(makeJob({ id: 'a', status: 'queued', createdAt: 1 }))
    store.insert(makeJob({ id: 'b', status: 'submitted', providerJobId: 'p-b', createdAt: 2 }))
    store.insert(makeJob({ id: 'c', status: 'running', providerJobId: 'p-c', createdAt: 3 }))
    store.insert(makeJob({ id: 'd', status: 'succeeded', createdAt: 4 }))

    expect(store.queued().map((j) => j.id)).toEqual(['a'])
    expect(store.inFlight().map((j) => j.id).sort()).toEqual(['b', 'c'])
    expect(store.all().length).toBe(4)
    store.close()
  })

  it('update() persists status and cost changes', () => {
    const store = createStore(':memory:')
    const job = makeJob()
    store.insert(job)
    store.update({ ...job, status: 'running', spentUsd: 1.25, startedAt: 2000, providerJobId: 'p1' })
    const got = store.get('j1')!
    expect(got.status).toBe('running')
    expect(got.spentUsd).toBe(1.25)
    expect(got.providerJobId).toBe('p1')
    store.close()
  })
})
