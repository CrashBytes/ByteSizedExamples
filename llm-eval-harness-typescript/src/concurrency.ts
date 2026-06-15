/**
 * A tiny promise-concurrency limiter — no dependencies.
 *
 * LLM eval suites are I/O bound and you almost always want to cap how many
 * requests hit a provider at once (rate limits, cost spikes). `pLimit(n)`
 * returns a wrapper that runs at most `n` thunks concurrently and queues the
 * rest, preserving each thunk's resolved value.
 */
export function pLimit(concurrency: number): <T>(fn: () => Promise<T>) => Promise<T> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error('concurrency must be an integer >= 1')
  }

  let active = 0
  const queue: Array<() => void> = []

  const next = () => {
    active--
    const run = queue.shift()
    if (run) run()
  }

  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        active++
        fn()
          .then(resolve, reject)
          .finally(next)
      }
      if (active < concurrency) run()
      else queue.push(run)
    })
}
