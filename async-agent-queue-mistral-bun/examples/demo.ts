// examples/demo.ts
//
// Offline end-to-end walkthrough — no API key, no network, no real timers. Run
// with `bun run demo`.
//
// It builds a queue backed by an in-memory SQLite database and an in-memory
// fake provider scripted to produce a mix of outcomes: two jobs that succeed,
// one that fails, and one that blows its cost budget (so the queue trips it to
// `over_budget` and issues a cancel). Concurrency is capped at 2 so you can see
// the backlog drain in waves, and every timer is a no-op so it finishes
// instantly.

import { createStore } from '../src/store'
import { AgentQueue } from '../src/queue'
import { FakeAgentProvider, FakeScripts } from '../src/providers/fake'
import type { ProviderRegistry, QueueEvent } from '../src/index'

const store = createStore(':memory:')

// One fake per provider name, each scripted with a lifecycle per job it accepts.
const mistral = new FakeAgentProvider('mistral-work', {
  scripts: [
    FakeScripts.succeed({ polls: 3, spendPerPoll: 0.02, result: { review: 'LGTM, 2 nits' } }),
    FakeScripts.fail({ polls: 2, error: 'tool_budget_exceeded' }),
  ],
})
const openai = new FakeAgentProvider('openai-bg', {
  scripts: [
    FakeScripts.succeed({ polls: 4, spendPerPoll: 0.05, result: { review: 'ship it' } }),
    FakeScripts.overspend({ spendPerPoll: 30 }), // will exceed a $25 budget
  ],
})

const providers: ProviderRegistry = {
  'mistral-work': mistral,
  'openai-bg': openai,
}

let clock = Date.now()
const queue = new AgentQueue({
  store,
  providers,
  concurrency: 2, // watch the backlog drain in waves
  pollIntervalMs: 30_000, // real cadence...
  sleep: async () => {}, // ...but never actually wait
  now: () => (clock += 1_000), // deterministic monotonic clock
  onEvent: log,
})

function log(e: QueueEvent): void {
  const short = (id: string) => id.slice(-6)
  switch (e.type) {
    case 'enqueued':
      console.log(`  + enqueued  ${short(e.job.id)}  ${e.job.provider}  budget $${e.job.budgetUsd}`)
      break
    case 'submitted':
      console.log(`  → submitted ${short(e.job.id)}  provider id ${e.job.providerJobId}`)
      break
    case 'submit_retry':
      console.log(`  ↻ retry     ${short(e.job.id)}  attempt ${e.attempt}: ${e.error}`)
      break
    case 'transition':
      console.log(`  · ${e.from} → ${e.to}  ${short(e.job.id)}  ($${e.job.spentUsd.toFixed(2)})`)
      break
    case 'settled':
      console.log(`  ✓ settled   ${short(e.job.id)}  ${e.job.status}`)
      break
  }
}

console.log('Enqueuing 4 agent jobs...\n')
queue.enqueue({ provider: 'mistral-work', model: 'mistral-large-latest', prompt: 'Review PR #1', toolset: ['read_diff'], budgetUsd: 0.5 })
queue.enqueue({ provider: 'openai-bg', model: 'gpt-5.5', prompt: 'Review PR #2', toolset: ['read_diff'], budgetUsd: 0.5 })
queue.enqueue({ provider: 'mistral-work', model: 'mistral-large-latest', prompt: 'Audit auth module', toolset: ['read_file'], budgetUsd: 10 })
queue.enqueue({ provider: 'openai-bg', model: 'gpt-5.5', prompt: 'Refactor billing', toolset: ['read_file', 'write_file'], budgetUsd: 25 })

console.log('\nDraining the queue (offline, instant)...\n')
await queue.runToCompletion()

console.log('\nFinal state of every job:')
for (const job of store.all()) {
  console.log(
    `  ${job.status.padEnd(11)} ${job.provider.padEnd(12)} ` +
      `spent $${job.spentUsd.toFixed(2)} / $${job.budgetUsd.toFixed(2)}` +
      (job.error ? `  (${job.error})` : '') +
      (job.result ? `  ${JSON.stringify(job.result)}` : '')
  )
}

const overBudget = store.all().filter((j) => j.status === 'over_budget')
console.log(
  `\nCancels issued by the budget guard: ${openai.cancelCalls + mistral.cancelCalls}` +
    ` (${overBudget.length} job over budget). Everything above ran with no keys and no network.`
)
