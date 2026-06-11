import { mapWithConcurrency } from './concurrency.js'
import type { RunOptions, Settled, Task } from './types.js'

const DEFAULT_MAX_RETRIES = 2
const DEFAULT_CONCURRENCY = 4

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

/**
 * Run a single task with bounded retries. A thrown error and a schema
 * validation failure are treated the same way: retry until success or until
 * the attempt budget is exhausted, then settle as `rejected`.
 */
export async function runTask<Output>(
  task: Task<Output>,
  maxRetries: number = DEFAULT_MAX_RETRIES,
): Promise<Settled<Output>> {
  let lastError: Error | undefined
  const totalAttempts = maxRetries + 1

  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
    try {
      const raw = await task.run()
      const value = task.validate ? task.validate.parse(raw) : raw
      return { name: task.name, status: 'fulfilled', value, attempts: attempt }
    } catch (error) {
      lastError = toError(error)
    }
  }

  return {
    name: task.name,
    status: 'rejected',
    reason: lastError,
    attempts: totalAttempts,
  }
}

/**
 * Fan a batch of tasks out across subagents, running at most
 * `options.concurrency` at a time. This call NEVER rejects: each task settles
 * into a `Settled` record, so one subagent blowing up can't sink the batch.
 * Filter on `status === 'fulfilled'` to collect the winners.
 */
export async function parallel<Output>(
  tasks: ReadonlyArray<Task<Output>>,
  options: RunOptions = {},
): Promise<Array<Settled<Output>>> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY
  return mapWithConcurrency(tasks, concurrency, (task) =>
    runTask(task, maxRetries),
  )
}

/** A single transform in a pipeline. Receives the previous stage's output. */
export type Stage<In, Out> = (input: In, index: number) => Promise<Out>

/**
 * Run each item through every stage independently, with NO barrier between
 * stages: item B can still be in stage 1 while item A is already in stage 3.
 * Wall-clock is the slowest single-item chain, not the sum of per-stage maxima.
 * A stage that throws drops just that item to `null`; the rest keep flowing.
 */
export async function pipeline<Out>(
  items: readonly unknown[],
  stages: ReadonlyArray<Stage<any, any>>,
  options: RunOptions = {},
): Promise<Array<Out | null>> {
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY
  return mapWithConcurrency(items, concurrency, async (item, index) => {
    let current: unknown = item
    try {
      for (const stage of stages) {
        current = await stage(current, index)
      }
      return current as Out
    } catch {
      return null
    }
  })
}
