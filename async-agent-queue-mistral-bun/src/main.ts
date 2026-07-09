// src/main.ts
//
// The real single-binary entrypoint: `bun run serve`. Wires the SQLite store,
// the real Mistral Work-mode and OpenAI background-mode adapters, the Hono HTTP
// layer, and the reconcile safety-net loop, then serves on Bun.
//
// This needs real API keys (see .env.example) — it is the production shape from
// the tutorial. The tests and demo do NOT run this; they drive the queue with
// the in-memory fake provider and no keys.

import { createStore } from './store'
import { createServer } from './server'
import { reconcileOnce } from './reconcile'
import { POLL_INTERVAL_MS } from './backoff'
import { mistralWork } from './providers/mistral'
import { openaiBg } from './providers/openai'
import type { ProviderRegistry } from './provider'

const store = createStore(process.env.QUEUE_DB ?? 'agent-queue.sqlite')
const providers: ProviderRegistry = {
  'mistral-work': mistralWork,
  'openai-bg': openaiBg,
}

const app = createServer({ store, providers })

// The reconcile worker: poll the provider for every in-flight job on a fixed
// cadence. Runs forever alongside the HTTP server; the webhook path is the fast
// route and this is the safety net.
setInterval(() => {
  reconcileOnce(store, providers).catch((e) => console.warn('reconcile error', e))
}, POLL_INTERVAL_MS)

const port = Number(process.env.PORT ?? 8787)
console.log(`agent queue listening on http://localhost:${port}`)

export default { port, fetch: app.fetch }
