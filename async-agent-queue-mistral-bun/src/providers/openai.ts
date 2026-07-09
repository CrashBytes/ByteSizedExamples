// src/providers/openai.ts
//
// The real OpenAI background-mode adapter. Background mode lives on the
// Responses API with `background: true`. Same shape as Mistral Work — submit,
// poll, webhook — with slightly different field names. Note: background mode
// does not stream tool calls, so `result` is the final-state artifact, not an
// event stream.
//
// As with the Mistral adapter, the client is created lazily so importing this
// module needs no OPENAI_API_KEY and no network, and the background-mode fields
// the published SDK types do not describe yet go through a loosely-typed handle.

import OpenAI from 'openai'
import type { AsyncAgentProvider, ProviderState, SubmitArgs } from '../provider'

let _client: OpenAI | null = null

function api(): {
  responses: {
    create(args: unknown): Promise<{ id: string }>
    retrieve(id: string): Promise<{
      status: string
      usage?: { total_cost_usd?: number }
      output?: unknown
      error?: { message?: string }
    }>
    cancel(id: string): Promise<void>
  }
} {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  return _client as unknown as ReturnType<typeof api>
}

export const openaiBg: AsyncAgentProvider = {
  name: 'openai-bg',

  async submit({ model, prompt, toolset, webhookUrl, metadata }: SubmitArgs) {
    const r = await api().responses.create({
      model,
      input: prompt,
      tools: toolset.map((t) => ({ type: 'function', name: t, parameters: {} })),
      background: true,
      webhook_url: webhookUrl,
      metadata,
    })
    return { providerJobId: r.id }
  },

  async poll(id: string): Promise<ProviderState> {
    const r = await api().responses.retrieve(id)
    const spent = r.usage?.total_cost_usd ?? 0
    if (r.status === 'queued') return { kind: 'submitted' }
    if (r.status === 'in_progress') return { kind: 'running', spentUsd: spent }
    if (r.status === 'completed') {
      return { kind: 'succeeded', spentUsd: spent, result: r.output }
    }
    return { kind: 'failed', spentUsd: spent, error: r.error?.message ?? 'unknown' }
  },

  async cancel(id: string) {
    await api().responses.cancel(id).catch(() => {})
  },

  verifyWebhook(headers: Headers, body: string) {
    const sig = headers.get('openai-signature')
    if (!sig || !verifyHmac(sig, body, process.env.OPENAI_WEBHOOK_SECRET!)) {
      return null
    }
    const ev = JSON.parse(body) as { data: { response_id: string } }
    return { providerJobId: ev.data.response_id }
  },
}

function verifyHmac(sig: string, body: string, secret: string): boolean {
  const h = new Bun.CryptoHasher('sha256', secret)
  h.update(body)
  return h.digest('hex') === sig
}
