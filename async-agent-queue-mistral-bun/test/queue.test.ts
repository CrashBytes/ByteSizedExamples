import { describe, it, expect } from 'bun:test'
import { createStore } from '../src/store'
import { AgentQueue, type QueueEvent } from '../src/queue'
import { FakeAgentProvider, FakeScripts } from '../src/providers/fake'
import type { ProviderRegistry } from '../src/provider'

// Every queue in these tests uses a no-op sleep so nothing actually waits, and a
// deterministic monotonic clock so timestamps are reproducible.
function makeQueue(
  fakes: { mistral?: FakeAgentProvider; openai?: FakeAgentProvider },
  opts: Partial<ConstructorParameters<typeof AgentQueue>[0]> = {}
) {
  const store = createStore(':memory:')
  const providers: ProviderRegistry = {
    'mistral-work': fakes.mistral ?? new FakeAgentProvider('mistral-work'),
    'openai-bg': fakes.openai ?? new FakeAgentProvider('openai-bg'),
  }
  let clock = 0
  const events: QueueEvent[] = []
  const queue = new AgentQueue({
    store,
    providers,
    sleep: async () => {},
    now: () => (clock += 1000),
    onEvent: (e) => events.push(e),
    ...opts,
  })
  return { store, providers, queue, events }
}

describe('AgentQueue', () => {
  it('enqueues a job as queued with a caller budget', () => {
    const { store, queue } = makeQueue({})
    const job = queue.enqueue({ provider: 'mistral-work', model: 'm', prompt: 'p', budgetUsd: 3 })
    expect(job.status).toBe('queued')
    expect(store.get(job.id)!.budgetUsd).toBe(3)
  })

  it('drives a job from queued through to succeeded, polling until done', async () => {
    const mistral = new FakeAgentProvider('mistral-work', {
      scripts: [FakeScripts.succeed({ polls: 4, spendPerPoll: 0.1, result: { ok: 1 } })],
    })
    const { store, queue } = makeQueue({ mistral })
    const job = queue.enqueue({ provider: 'mistral-work', model: 'm', prompt: 'p', budgetUsd: 5 })

    await queue.runToCompletion()

    const done = store.get(job.id)!
    expect(done.status).toBe('succeeded')
    expect(done.result).toEqual({ ok: 1 })
    expect(done.finishedAt).not.toBeNull()
    // It genuinely polled multiple times before completing.
    expect(mistral.pollCalls).toBeGreaterThanOrEqual(4)
  })

  it('records provider failures as failed jobs', async () => {
    const mistral = new FakeAgentProvider('mistral-work', {
      scripts: [FakeScripts.fail({ polls: 2, error: 'tool_budget_exceeded' })],
    })
    const { store, queue } = makeQueue({ mistral })
    const job = queue.enqueue({ provider: 'mistral-work', model: 'm', prompt: 'p' })

    await queue.runToCompletion()

    const done = store.get(job.id)!
    expect(done.status).toBe('failed')
    expect(done.error).toBe('tool_budget_exceeded')
  })

  it('enforces the per-job budget: over_budget + best-effort cancel', async () => {
    const openai = new FakeAgentProvider('openai-bg', {
      scripts: [FakeScripts.overspend({ spendPerPoll: 30 })], // > $25 budget
    })
    const { store, queue } = makeQueue({ openai })
    const job = queue.enqueue({ provider: 'openai-bg', model: 'm', prompt: 'p', budgetUsd: 25 })

    await queue.runToCompletion()

    const done = store.get(job.id)!
    expect(done.status).toBe('over_budget')
    expect(done.spentUsd).toBeGreaterThan(done.budgetUsd)
    expect(openai.cancelCalls).toBeGreaterThanOrEqual(1)
  })

  it('caps concurrency: submitPending fills only the open slots', async () => {
    const mistral = new FakeAgentProvider('mistral-work', {
      scripts: [FakeScripts.succeed({ polls: 5 })], // stay in-flight for a while
    })
    const { store, queue } = makeQueue({ mistral }, { concurrency: 2 })
    for (let i = 0; i < 4; i++) {
      queue.enqueue({ provider: 'mistral-work', model: 'm', prompt: `p${i}` })
    }

    await queue.submitPending()

    expect(store.inFlight().length).toBe(2)
    expect(store.queued().length).toBe(2)
    expect(mistral.submitCalls).toBe(2)
  })

  it('retries a transient submit error with backoff, then succeeds', async () => {
    const mistral = new FakeAgentProvider('mistral-work', {
      failSubmits: 1, // first submit rejects, second goes through
      scripts: [FakeScripts.succeed({ polls: 2 })],
    })
    const { store, queue, events } = makeQueue(
      { mistral },
      { maxSubmitAttempts: 3, backoff: { jitter: false, baseMs: 1 } }
    )
    const job = queue.enqueue({ provider: 'mistral-work', model: 'm', prompt: 'p' })

    await queue.runToCompletion()

    expect(mistral.submitCalls).toBe(2) // one failure + one success
    expect(events.some((e) => e.type === 'submit_retry')).toBe(true)
    expect(store.get(job.id)!.status).toBe('succeeded')
  })

  it('gives up after maxSubmitAttempts and marks the job failed', async () => {
    const mistral = new FakeAgentProvider('mistral-work', {
      failSubmits: 10, // always fails to submit
      submitError: new Error('provider 503'),
    })
    const { store, queue } = makeQueue({ mistral }, { maxSubmitAttempts: 2, backoff: { jitter: false, baseMs: 1 } })
    const job = queue.enqueue({ provider: 'mistral-work', model: 'm', prompt: 'p' })

    await queue.runToCompletion()

    const done = store.get(job.id)!
    expect(done.status).toBe('failed')
    expect(done.error).toBe('provider 503')
    expect(mistral.submitCalls).toBe(2)
  })

  it('drains a mixed backlog across both providers to terminal states', async () => {
    const mistral = new FakeAgentProvider('mistral-work', {
      scripts: [FakeScripts.succeed({ polls: 2 }), FakeScripts.fail({ polls: 1 })],
    })
    const openai = new FakeAgentProvider('openai-bg', {
      scripts: [FakeScripts.succeed({ polls: 3 }), FakeScripts.overspend({ spendPerPoll: 40 })],
    })
    const { store, queue } = makeQueue({ mistral, openai }, { concurrency: 2 })

    queue.enqueue({ provider: 'mistral-work', model: 'm', prompt: 'a', budgetUsd: 5 })
    queue.enqueue({ provider: 'openai-bg', model: 'm', prompt: 'b', budgetUsd: 5 })
    queue.enqueue({ provider: 'mistral-work', model: 'm', prompt: 'c', budgetUsd: 5 })
    queue.enqueue({ provider: 'openai-bg', model: 'm', prompt: 'd', budgetUsd: 25 })

    await queue.runToCompletion()

    const statuses = store.all().map((j) => j.status).sort()
    expect(store.queued().length).toBe(0)
    expect(store.inFlight().length).toBe(0)
    expect(statuses).toEqual(['failed', 'over_budget', 'succeeded', 'succeeded'])
  })
})
