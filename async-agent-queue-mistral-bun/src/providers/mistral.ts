// src/providers/mistral.ts
//
// The real Mistral Le Chat Work-mode adapter. Work mode exposes async sessions:
// "create a session, get an id, poll or webhook for state, fetch artifacts".
//
// Two notes on typing/offline behavior:
//   1. The SDK client is created lazily (first use), so importing this module
//      never requires MISTRAL_API_KEY and never touches the network — the tests
//      and demo import the barrel without a key.
//   2. Work mode is a 2026 surface the published `@mistralai/mistralai` types do
//      not describe yet, so the async-session calls go through a loosely-typed
//      handle. The shapes match the tutorial; swap in the typed methods once the
//      SDK ships them.

import { Mistral } from '@mistralai/mistralai'
import type { AsyncAgentProvider, ProviderState, SubmitArgs } from '../provider'

let _client: Mistral | null = null

// Loosely-typed view of the Work-mode session API (see note 2 above).
function work(): {
  workSessions: {
    create(args: unknown): Promise<{ id: string }>
    retrieve(id: string): Promise<{
      status: string
      usage?: { totalCostUsd?: number }
      failureReason?: string
    }>
    artifacts(id: string): Promise<unknown>
    cancel(id: string): Promise<void>
  }
} {
  if (!_client) _client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })
  return _client as unknown as ReturnType<typeof work>
}

export const mistralWork: AsyncAgentProvider = {
  name: 'mistral-work',

  async submit({ model, prompt, toolset, webhookUrl, metadata }: SubmitArgs) {
    const session = await work().workSessions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      tools: toolset.map((t) => ({ type: 'function', function: { name: t } })),
      mode: 'async',
      webhook: webhookUrl ? { url: webhookUrl, events: ['*'] } : undefined,
      metadata,
    })
    return { providerJobId: session.id }
  },

  async poll(id: string): Promise<ProviderState> {
    const s = await work().workSessions.retrieve(id)
    const spent = s.usage?.totalCostUsd ?? 0
    if (s.status === 'pending') return { kind: 'submitted' }
    if (s.status === 'running') return { kind: 'running', spentUsd: spent }
    if (s.status === 'completed') {
      const out = await work().workSessions.artifacts(id)
      return { kind: 'succeeded', spentUsd: spent, result: out }
    }
    return { kind: 'failed', spentUsd: spent, error: s.failureReason ?? 'unknown' }
  },

  async cancel(id: string) {
    await work().workSessions.cancel(id).catch(() => {}) // best-effort
  },

  verifyWebhook(headers: Headers, body: string) {
    const sig = headers.get('mistral-webhook-signature')
    if (!sig || !verifyHmac(sig, body, process.env.MISTRAL_WEBHOOK_SECRET!)) {
      return null
    }
    const ev = JSON.parse(body) as { session_id: string }
    return { providerJobId: ev.session_id }
  },
}

// Mistral, OpenAI, and Anthropic all sign webhook payloads with HMAC-SHA256; an
// unsigned webhook is a "trigger any state transition" RCE on your queue.
// `Bun.CryptoHasher` does the right thing on recent Bun versions.
function verifyHmac(sig: string, body: string, secret: string): boolean {
  const h = new Bun.CryptoHasher('sha256', secret)
  h.update(body)
  return h.digest('hex') === sig
}
