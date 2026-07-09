// src/providers/fake.ts
//
// A scriptable, in-memory AsyncAgentProvider for the tests and the offline
// demo. No network, no API key, no real timers. You hand it one "script" per
// job — an ordered list of ProviderState values that successive `poll()` calls
// walk through — and it plays them back deterministically. The final state
// sticks, so terminal states repeat if polled again (mirroring a real
// provider). It can also be told to fail the first N `submit()` calls so the
// queue's retry/backoff path is exercised without a flaky upstream.

import type {
  AsyncAgentProvider,
  ProviderName,
  ProviderState,
  SubmitArgs,
} from '../provider'

/** One job's lifecycle: the states `poll()` returns, in order. */
export type FakeScript = ProviderState[]

export interface FakeProviderOptions {
  /** One script per submitted job; the last script repeats once exhausted. */
  scripts?: FakeScript[]
  /** Reject this many `submit()` calls (with a transient error) before succeeding. */
  failSubmits?: number
  /** Error thrown by the first `failSubmits` submissions. */
  submitError?: Error
}

interface Live {
  script: FakeScript
  cursor: number
}

export class FakeAgentProvider implements AsyncAgentProvider {
  readonly name: ProviderName

  private readonly scripts: FakeScript[]
  private submitFailuresLeft: number
  private readonly submitError: Error

  private seq = 0
  private readonly live = new Map<string, Live>()

  // Observability handles for assertions.
  submitCalls = 0
  pollCalls = 0
  cancelCalls = 0
  readonly cancelled = new Set<string>()

  constructor(name: ProviderName, opts: FakeProviderOptions = {}) {
    this.name = name
    this.scripts = opts.scripts ?? [FakeScripts.succeed()]
    this.submitFailuresLeft = opts.failSubmits ?? 0
    this.submitError = opts.submitError ?? new Error('fake transient submit error (503)')
  }

  submit(_args: SubmitArgs): Promise<{ providerJobId: string }> {
    this.submitCalls++
    if (this.submitFailuresLeft > 0) {
      this.submitFailuresLeft--
      return Promise.reject(this.submitError)
    }
    const idx = this.seq++
    const script = this.scripts[Math.min(idx, this.scripts.length - 1)]
    const providerJobId = `${this.name}-fake-${idx}`
    this.live.set(providerJobId, { script, cursor: 0 })
    return Promise.resolve({ providerJobId })
  }

  poll(providerJobId: string): Promise<ProviderState> {
    this.pollCalls++
    const entry = this.live.get(providerJobId)
    if (!entry) return Promise.resolve({ kind: 'failed', spentUsd: 0, error: 'unknown job' })
    if (this.cancelled.has(providerJobId)) {
      return Promise.resolve({ kind: 'failed', spentUsd: 0, error: 'cancelled' })
    }
    const state = entry.script[Math.min(entry.cursor, entry.script.length - 1)]
    entry.cursor++
    return Promise.resolve(state)
  }

  cancel(providerJobId: string): Promise<void> {
    this.cancelCalls++
    this.cancelled.add(providerJobId)
    return Promise.resolve()
  }

  verifyWebhook(headers: Headers, body: string): { providerJobId: string } | null {
    // The fake "signature" is a shared token; a real adapter uses HMAC-SHA256.
    if (headers.get('x-fake-signature') !== 'valid') return null
    try {
      const ev = JSON.parse(body) as { providerJobId?: string }
      return ev.providerJobId ? { providerJobId: ev.providerJobId } : null
    } catch {
      return null
    }
  }
}

/** Ready-made lifecycle scripts so tests and the demo read like prose. */
export const FakeScripts = {
  /** submitted → running (spend grows) → succeeded, over `polls` poll calls. */
  succeed(
    { polls = 3, spendPerPoll = 0.01, result = { ok: true } as unknown } = {}
  ): FakeScript {
    const steps: FakeScript = []
    for (let i = 1; i < polls; i++) {
      steps.push({ kind: 'running', spentUsd: +(spendPerPoll * i).toFixed(4) })
    }
    steps.push({ kind: 'succeeded', spentUsd: +(spendPerPoll * polls).toFixed(4), result })
    return steps
  },

  /** submitted → running → failed with `error`. */
  fail({ polls = 2, spendPerPoll = 0.01, error = 'tool_budget_exceeded' } = {}): FakeScript {
    const steps: FakeScript = []
    for (let i = 1; i < polls; i++) {
      steps.push({ kind: 'running', spentUsd: +(spendPerPoll * i).toFixed(4) })
    }
    steps.push({ kind: 'failed', spentUsd: +(spendPerPoll * polls).toFixed(4), error })
    return steps
  },

  /**
   * Establishes `running` cheaply, then lets spend climb past any sane budget —
   * the queue's budget guard should trip it to `over_budget` and issue a cancel.
   * (A job must be `running` before it can go `over_budget`, so the first poll
   * is deliberately under budget.)
   */
  overspend({ spendPerPoll = 30, steps = 4 } = {}): FakeScript {
    const out: FakeScript = [{ kind: 'running', spentUsd: 0.01 }]
    for (let i = 1; i <= steps; i++) {
      out.push({ kind: 'running', spentUsd: spendPerPoll * i })
    }
    return out
  },
}
