// src/reconcile.ts
//
// Two ways to know a job's state changed: poll the provider, or receive a
// webhook. We do both, because the webhook can fail and polling is the safety
// net. Both paths funnel into the same `applyState` — that single function is
// the state-transition guard, the cost-budget guard, the cancel-on-overbudget
// action, and the persist, all at once. Atomic in one place beats clean across
// three.
//
// Deviation from the article: `applyState` and `reconcileOnce` take the store
// and provider registry as parameters instead of closing over module globals,
// so the same logic drives the real server, the AgentQueue, and the tests.

import type { Store } from './store'
import type { AsyncAgentProvider, ProviderRegistry, ProviderState } from './provider'
import { canTransition, type Job, type JobStatus } from './job'

/**
 * Fold a provider-reported state into a job and persist the change if (and only
 * if) it is a legal transition. Returns the updated job when it changed, or
 * null on a no-op (already past this state, illegal transition, or still
 * `submitted`).
 */
export function applyState(
  store: Store,
  providers: ProviderRegistry,
  job: Job,
  state: ProviderState,
  now: () => number = Date.now
): Job | null {
  const next: Partial<Job> = {}

  if (state.kind === 'submitted') return null
  if (state.kind === 'running') {
    next.status = 'running'
    next.spentUsd = state.spentUsd
    next.startedAt = job.startedAt ?? now()
    if (state.spentUsd > job.budgetUsd) {
      next.status = 'over_budget'
      next.finishedAt = now()
      void providers[job.provider].cancel(job.providerJobId!).catch(() => {})
    }
  } else if (state.kind === 'succeeded') {
    next.status = 'succeeded'
    next.spentUsd = state.spentUsd
    next.result = state.result
    next.finishedAt = now()
  } else {
    next.status = 'failed'
    next.spentUsd = state.spentUsd
    next.error = state.error
    next.finishedAt = now()
  }

  if (next.status && !canTransition(job.status, next.status as JobStatus)) {
    return null // no-op; either already past this state or a bug we want to ignore
  }
  const updated = { ...job, ...next } as Job
  store.update(updated)
  return updated
}

/**
 * One pass over every in-flight job: poll the provider and reconcile. This is
 * the safety-net loop; a real deployment runs it on a `setInterval`.
 */
export async function reconcileOnce(
  store: Store,
  providers: ProviderRegistry,
  now: () => number = Date.now
): Promise<void> {
  for (const job of store.inFlight()) {
    if (!job.providerJobId) continue // still queued
    const provider: AsyncAgentProvider = providers[job.provider]
    try {
      const state = await provider.poll(job.providerJobId)
      applyState(store, providers, job, state, now)
    } catch (e) {
      console.warn(`poll failed for ${job.id}: ${(e as Error).message}`)
    }
  }
}
