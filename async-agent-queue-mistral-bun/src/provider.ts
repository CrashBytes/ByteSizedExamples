// src/provider.ts
//
// Rule 2 from the tutorial: provider-agnostic at the seam, provider-specific in
// the leaves. One interface, four methods, because that is all the queue needs.
// The Mistral Work-mode and OpenAI background-mode adapters implement this; so
// does the in-memory fake used by the tests and the offline demo.

export type ProviderName = 'mistral-work' | 'openai-bg'

export interface AsyncAgentProvider {
  name: ProviderName

  /** Submit a job. Returns the provider's id. */
  submit(args: SubmitArgs): Promise<{ providerJobId: string }>

  /** Look up the current state of the job. */
  poll(providerJobId: string): Promise<ProviderState>

  /** Cancel the job. Best-effort; some providers ignore this. */
  cancel(providerJobId: string): Promise<void>

  /** Verify a webhook signature. Returns the matching providerJobId or null. */
  verifyWebhook(headers: Headers, body: string): { providerJobId: string } | null
}

export type SubmitArgs = {
  model: string
  prompt: string
  toolset: string[]
  webhookUrl?: string
  metadata?: Record<string, string>
}

// A closed sum type. Adding a new state means changing this in one place and
// getting compile errors at every call site — exactly the experience you want.
export type ProviderState =
  | { kind: 'submitted' }
  | { kind: 'running'; spentUsd: number }
  | { kind: 'succeeded'; spentUsd: number; result: unknown }
  | { kind: 'failed'; spentUsd: number; error: string }

/** Convenience map type used throughout the queue and server. */
export type ProviderRegistry = Record<ProviderName, AsyncAgentProvider>
