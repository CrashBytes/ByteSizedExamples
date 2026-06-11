/**
 * Run `worker` over `items` with at most `limit` promises in flight at once.
 *
 * Results come back in input order, regardless of which item finishes first.
 * This is the scheduling primitive every other piece of the orchestrator is
 * built on: a fixed pool of workers pulling from a shared cursor.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (limit < 1) {
    throw new Error('concurrency limit must be at least 1')
  }

  const results = new Array<R>(items.length)
  let cursor = 0

  async function runner(): Promise<void> {
    while (true) {
      const index = cursor
      cursor += 1
      if (index >= items.length) {
        return
      }
      results[index] = await worker(items[index], index)
    }
  }

  const poolSize = Math.min(limit, items.length)
  const runners = Array.from({ length: poolSize }, () => runner())
  await Promise.all(runners)
  return results
}
