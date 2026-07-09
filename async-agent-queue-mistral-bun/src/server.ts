// src/server.ts
//
// The HTTP layer: POST /jobs to enqueue, GET /jobs/:id for status, GET /jobs for
// the list, POST /webhooks/:provider for provider callbacks, and a five-line
// dashboard at /. Two patterns from the tutorial earn their place:
//   - `queueMicrotask` submits out-of-band so the POST response is sub-ms.
//   - Every job is wired with a webhook URL even when you intend to poll.
//
// Deviation from the article: `createServer(deps)` takes the store and provider
// registry as parameters (instead of module globals) so it can be constructed
// in a test with a fake provider and driven via Hono's `app.request()` — fully
// offline. The webhook handler re-polls the provider for authoritative state
// and reuses `applyState`, exactly as the tutorial describes.

import { Hono } from 'hono'
import { ulid } from 'ulid'
import type { Store } from './store'
import type { ProviderName, ProviderRegistry } from './provider'
import type { Job } from './job'
import { applyState } from './reconcile'

export interface ServerDeps {
  store: Store
  providers: ProviderRegistry
  webhookBase?: string
  now?: () => number
}

// Conservative per-kind budget defaults; a single global ceiling would let
// small jobs cannibalize big ones.
export const DEFAULT_BUDGETS: Record<string, number> = {
  'pr-review': 0.5,
  refactor: 25,
  audit: 10,
  migration: 40,
}

export function createServer(deps: ServerDeps) {
  const { store, providers } = deps
  const now = deps.now ?? Date.now
  const webhookBase = deps.webhookBase ?? process.env.WEBHOOK_BASE ?? 'https://localhost:8787'

  const app = new Hono()

  app.post('/jobs', async (c) => {
    const body = await c.req.json()
    const provider = providers[body.provider as ProviderName]
    if (!provider) return c.json({ error: 'unknown provider' }, 400)

    const budget = body.budgetUsd ?? DEFAULT_BUDGETS[body.kind] ?? 5
    const id = ulid()
    const job: Job = {
      id,
      providerJobId: null,
      provider: provider.name,
      model: body.model,
      prompt: body.prompt,
      toolset: body.toolset ?? [],
      status: 'queued',
      budgetUsd: budget,
      spentUsd: 0,
      createdAt: now(),
      startedAt: null,
      finishedAt: null,
      result: null,
      error: null,
    }
    store.insert(job)

    // Submit out-of-band so the HTTP response stays fast.
    queueMicrotask(async () => {
      try {
        const { providerJobId } = await provider.submit({
          model: job.model,
          prompt: job.prompt,
          toolset: job.toolset,
          webhookUrl: `${webhookBase}/webhooks/${provider.name}`,
          metadata: { queue_job_id: id },
        })
        store.update({ ...job, providerJobId, status: 'submitted' })
      } catch (e) {
        store.update({ ...job, status: 'failed', error: (e as Error).message, finishedAt: now() })
      }
    })

    return c.json({ id, status: 'queued' }, 202)
  })

  app.get('/jobs', (c) => c.json({ jobs: store.all() }))

  app.get('/jobs/:id', (c) => {
    const job = store.get(c.req.param('id'))
    return job ? c.json(job) : c.json({ error: 'not found' }, 404)
  })

  app.post('/webhooks/:provider', async (c) => {
    const name = c.req.param('provider') as ProviderName
    const provider = providers[name]
    if (!provider) return c.json({ error: 'unknown provider' }, 400)

    const raw = await c.req.text() // raw body for signature
    const verified = provider.verifyWebhook(c.req.raw.headers, raw)
    if (!verified) return c.json({ error: 'bad signature' }, 401)

    const job = store.byProviderId(verified.providerJobId)
    if (!job) return c.json({ ok: true }) // not ours; ignore quietly

    // Let the webhook be a "ping" and re-poll for the authoritative state, then
    // reuse applyState — one parser, not two.
    const state = await provider.poll(verified.providerJobId)
    applyState(store, providers, job, state, now)
    return c.json({ ok: true })
  })

  // The five-line dashboard.
  app.get('/', (c) => {
    const jobs = store.all()
    const rows = jobs
      .map(
        (j) =>
          `<tr><td>${j.id}</td><td>${j.provider}</td><td>${j.status}</td>` +
          `<td>$${j.spentUsd.toFixed(2)} / $${j.budgetUsd.toFixed(2)}</td></tr>`
      )
      .join('')
    return c.html(
      `<h1>Agent Queue</h1><table border=1 cellpadding=6>` +
        `<tr><th>id</th><th>provider</th><th>status</th><th>spent/budget</th></tr>` +
        `${rows}</table>`
    )
  })

  return app
}
