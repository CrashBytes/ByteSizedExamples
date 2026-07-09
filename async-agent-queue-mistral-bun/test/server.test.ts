import { describe, it, expect } from 'bun:test'
import { createStore } from '../src/store'
import { createServer } from '../src/server'
import { FakeAgentProvider, FakeScripts } from '../src/providers/fake'
import type { ProviderRegistry } from '../src/provider'

function setup(mistral = new FakeAgentProvider('mistral-work', { scripts: [FakeScripts.succeed({ polls: 2 })] })) {
  const store = createStore(':memory:')
  const providers: ProviderRegistry = {
    'mistral-work': mistral,
    'openai-bg': new FakeAgentProvider('openai-bg'),
  }
  const app = createServer({ store, providers })
  return { store, providers, mistral, app }
}

// The POST handler submits in a queueMicrotask; yield so it can run.
const flush = () => new Promise((r) => setTimeout(r, 0))

describe('createServer (offline via app.request)', () => {
  it('accepts a job with 202 and submits it out-of-band', async () => {
    const { store, mistral, app } = setup()
    const res = await app.request('/jobs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'mistral-work', model: 'm', prompt: 'review', toolset: ['read_diff'] }),
    })
    expect(res.status).toBe(202)
    const { id, status } = (await res.json()) as { id: string; status: string }
    expect(status).toBe('queued')

    await flush()
    const stored = store.get(id)!
    expect(stored.status).toBe('submitted')
    expect(stored.providerJobId).toBe('mistral-work-fake-0')
    expect(mistral.submitCalls).toBe(1)
  })

  it('applies a per-kind default budget when none is given', async () => {
    const { store, app } = setup()
    const res = await app.request('/jobs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'mistral-work', model: 'm', prompt: 'x', kind: 'migration' }),
    })
    const { id } = (await res.json()) as { id: string }
    expect(store.get(id)!.budgetUsd).toBe(40) // DEFAULT_BUDGETS.migration
  })

  it('rejects an unknown provider with 400', async () => {
    const { app } = setup()
    const res = await app.request('/jobs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'nope', model: 'm', prompt: 'x' }),
    })
    expect(res.status).toBe(400)
  })

  it('serves job status and 404s unknown ids', async () => {
    const { app } = setup()
    const post = await app.request('/jobs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'mistral-work', model: 'm', prompt: 'x' }),
    })
    const { id } = (await post.json()) as { id: string }
    await flush()

    const ok = await app.request(`/jobs/${id}`)
    expect(ok.status).toBe(200)

    const missing = await app.request('/jobs/does-not-exist')
    expect(missing.status).toBe(404)
  })

  it('drives applyState from a signature-verified webhook and rejects bad signatures', async () => {
    const { store, app } = setup()
    // Enqueue + submit so the job has a providerJobId the webhook can reference.
    const post = await app.request('/jobs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'mistral-work', model: 'm', prompt: 'x' }),
    })
    const { id } = (await post.json()) as { id: string }
    await flush()
    const providerJobId = store.get(id)!.providerJobId!

    // Bad signature → 401, no state change.
    const bad = await app.request('/webhooks/mistral-work', {
      method: 'POST',
      body: JSON.stringify({ providerJobId }),
    })
    expect(bad.status).toBe(401)

    // Valid signature → 200; the handler re-polls and applies the new state.
    const good = await app.request('/webhooks/mistral-work', {
      method: 'POST',
      headers: { 'x-fake-signature': 'valid' },
      body: JSON.stringify({ providerJobId }),
    })
    expect(good.status).toBe(200)
    // First poll of a 2-step succeed script returns "running".
    expect(store.get(id)!.status).toBe('running')
  })
})
