// src/queue.ts
//
// The driver that ties the tutorial's pieces together into an actual queue:
// enqueue jobs, submit them (out-of-band, with bounded concurrency and
// retry/backoff), then poll every in-flight job to completion via the same
// `applyState` the webhook handler uses. Every timer is injectable, so the
// tests run this to completion with no real sleeping and no network.
//
// This is the "queue is the product" layer the article argues for — the model
// (and provider) is interchangeable behind AsyncAgentProvider.

import { ulid } from 'ulid'
import type { Store } from './store'
import type { ProviderName, ProviderRegistry } from './provider'
import type { Job, JobStatus } from './job'
import { isTerminal } from './job'
import { applyState } from './reconcile'
import { backoffDelay, defaultSleep, POLL_INTERVAL_MS, type BackoffOptions } from './backoff'

export interface EnqueueInput {
  provider: ProviderName
  model: string
  prompt: string
  toolset?: string[]
  budgetUsd?: number
}

export type QueueEvent =
  | { type: 'enqueued'; job: Job }
  | { type: 'submitted'; job: Job }
  | { type: 'submit_retry'; job: Job; attempt: number; error: string; delayMs: number }
  | { type: 'transition'; job: Job; from: JobStatus; to: JobStatus }
  | { type: 'settled'; job: Job }

export interface AgentQueueOptions {
  store: Store
  providers: ProviderRegistry
  /** Max jobs in flight (submitted+running) at once. Default 4. */
  concurrency?: number
  /** Sleep between poll rounds. Injected as a no-op in tests. */
  pollIntervalMs?: number
  /** How many times to try `submit()` before giving up on a job. Default 3. */
  maxSubmitAttempts?: number
  backoff?: BackoffOptions
  /** Base URL every job's webhook is wired to (used even when polling). */
  webhookBase?: string
  /** Injectable timer so tests never actually wait. */
  sleep?: (ms: number) => Promise<void>
  /** Injectable clock for deterministic timestamps. */
  now?: () => number
  onEvent?: (e: QueueEvent) => void
}

export class AgentQueue {
  private readonly store: Store
  private readonly providers: ProviderRegistry
  private readonly concurrency: number
  private readonly pollIntervalMs: number
  private readonly maxSubmitAttempts: number
  private readonly backoff: BackoffOptions
  private readonly webhookBase: string
  private readonly sleep: (ms: number) => Promise<void>
  private readonly now: () => number
  private readonly onEvent: (e: QueueEvent) => void

  constructor(opts: AgentQueueOptions) {
    this.store = opts.store
    this.providers = opts.providers
    this.concurrency = opts.concurrency ?? 4
    this.pollIntervalMs = opts.pollIntervalMs ?? POLL_INTERVAL_MS
    this.maxSubmitAttempts = opts.maxSubmitAttempts ?? 3
    this.backoff = opts.backoff ?? {}
    this.webhookBase = opts.webhookBase ?? 'https://localhost:8787'
    this.sleep = opts.sleep ?? defaultSleep
    this.now = opts.now ?? Date.now
    this.onEvent = opts.onEvent ?? (() => {})
  }

  /** Accept a job and persist it as `queued`. Does not touch the provider. */
  enqueue(input: EnqueueInput): Job {
    const id = ulid()
    const job: Job = {
      id,
      providerJobId: null,
      provider: input.provider,
      model: input.model,
      prompt: input.prompt,
      toolset: input.toolset ?? [],
      status: 'queued',
      budgetUsd: input.budgetUsd ?? 5,
      spentUsd: 0,
      createdAt: this.now(),
      startedAt: null,
      finishedAt: null,
      result: null,
      error: null,
    }
    this.store.insert(job)
    this.onEvent({ type: 'enqueued', job })
    return job
  }

  /** How many more jobs we may submit right now without exceeding concurrency. */
  private capacity(): number {
    return this.concurrency - this.store.inFlight().length
  }

  /**
   * Fill open concurrency slots from the queued backlog. Submits are done
   * out-of-band and in parallel, each with its own retry/backoff.
   */
  async submitPending(): Promise<void> {
    const slots = this.capacity()
    if (slots <= 0) return
    const pending = this.store.queued().slice(0, slots)
    await Promise.all(pending.map((job) => this.submitOne(job)))
  }

  /** Submit a single job, retrying transient provider errors with backoff. */
  private async submitOne(job: Job): Promise<void> {
    const provider = this.providers[job.provider]
    for (let attempt = 0; ; attempt++) {
      const current = this.store.get(job.id)
      if (!current || current.status !== 'queued') return // someone else moved it
      try {
        const { providerJobId } = await provider.submit({
          model: current.model,
          prompt: current.prompt,
          toolset: current.toolset,
          webhookUrl: `${this.webhookBase}/webhooks/${provider.name}`,
          metadata: { queue_job_id: current.id },
        })
        const submitted: Job = { ...current, providerJobId, status: 'submitted' }
        this.store.update(submitted)
        this.onEvent({ type: 'submitted', job: submitted })
        return
      } catch (e) {
        const message = (e as Error).message ?? String(e)
        if (attempt + 1 >= this.maxSubmitAttempts) {
          const failed: Job = {
            ...current,
            status: 'failed',
            error: message,
            finishedAt: this.now(),
          }
          this.store.update(failed)
          this.emitTransition(current.status, failed)
          this.onEvent({ type: 'settled', job: failed })
          return
        }
        const delayMs = backoffDelay(attempt, this.backoff)
        this.onEvent({ type: 'submit_retry', job: current, attempt: attempt + 1, error: message, delayMs })
        await this.sleep(delayMs)
      }
    }
  }

  /** One reconcile pass: poll every in-flight job and fold in its new state. */
  async tick(): Promise<void> {
    for (const job of this.store.inFlight()) {
      if (!job.providerJobId) continue
      const provider = this.providers[job.provider]
      let updated: Job | null = null
      try {
        const state = await provider.poll(job.providerJobId)
        updated = applyState(this.store, this.providers, job, state, this.now)
      } catch (e) {
        console.warn(`poll failed for ${job.id}: ${(e as Error).message}`)
        continue
      }
      if (updated && updated.status !== job.status) {
        this.emitTransition(job.status, updated)
        if (isTerminal(updated.status)) this.onEvent({ type: 'settled', job: updated })
      }
    }
  }

  private emitTransition(from: JobStatus, job: Job): void {
    this.onEvent({ type: 'transition', job, from, to: job.status })
  }

  /** True once nothing is queued and nothing is in flight. */
  private allSettled(): boolean {
    return this.store.queued().length === 0 && this.store.inFlight().length === 0
  }

  /**
   * Drive the whole backlog to terminal states: submit, poll, sleep, repeat.
   * Bounded by `maxRounds` so a stuck provider can never hang the loop forever.
   */
  async runToCompletion({ maxRounds = 10_000 }: { maxRounds?: number } = {}): Promise<void> {
    for (let round = 0; round < maxRounds; round++) {
      await this.submitPending()
      if (this.allSettled()) return
      await this.tick()
      if (this.allSettled()) return
      await this.sleep(this.pollIntervalMs)
    }
    throw new Error(`runToCompletion exceeded ${maxRounds} rounds; jobs may be stuck`)
  }
}
