// src/job.ts
//
// The job state machine. Two pieces: the schema, and the allowed transitions.
// Everything else in the queue treats these as the single source of truth for
// what a job *is* and how it is *allowed to change*.

import { z } from 'zod'

export const JobStatus = z.enum([
  'queued', // accepted by us, not yet sent to provider
  'submitted', // sent to provider, awaiting first signal
  'running', // provider has started work
  'succeeded', // provider returned a result we accepted
  'failed', // provider returned an error or we rejected the result
  'over_budget', // we killed it because it crossed a cost ceiling
  'cancelled', // user or operator killed it
])
export type JobStatus = z.infer<typeof JobStatus>

export const Job = z.object({
  id: z.string(), // our id, ULID
  providerJobId: z.string().nullable(), // the provider's id, set on submit
  provider: z.enum(['mistral-work', 'openai-bg']),
  model: z.string(),
  prompt: z.string(),
  toolset: z.array(z.string()),
  status: JobStatus,
  budgetUsd: z.number(), // hard ceiling
  spentUsd: z.number(), // last-known cost
  createdAt: z.number(),
  startedAt: z.number().nullable(),
  finishedAt: z.number().nullable(),
  result: z.any().nullable(),
  error: z.string().nullable(),
})
export type Job = z.infer<typeof Job>

// Allowed transitions. Anything else is a bug.
export const transitions: Record<JobStatus, JobStatus[]> = {
  queued: ['submitted', 'cancelled', 'failed'],
  submitted: ['running', 'failed', 'cancelled'],
  running: ['succeeded', 'failed', 'over_budget', 'cancelled'],
  succeeded: [],
  failed: [],
  over_budget: [],
  cancelled: [],
}

/**
 * The single chokepoint for state changes. Every mutation goes through it.
 * Without this, a webhook arriving after a poll result will silently turn a
 * `succeeded` job back into `running`.
 */
export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return transitions[from].includes(to)
}

/** Terminal states never transition again. */
export function isTerminal(status: JobStatus): boolean {
  return transitions[status].length === 0
}
