import { describe, expect, it } from 'vitest'
import { mapWithConcurrency } from '../src/concurrency.js'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('mapWithConcurrency', () => {
  it('preserves input order regardless of completion order', async () => {
    const out = await mapWithConcurrency([30, 10, 20], 3, async (ms) => {
      await sleep(ms)
      return ms
    })
    expect(out).toEqual([30, 10, 20])
  })

  it('never exceeds the concurrency limit', async () => {
    let inFlight = 0
    let peak = 0
    const items = Array.from({ length: 12 }, (_, i) => i)

    await mapWithConcurrency(items, 3, async (i) => {
      inFlight += 1
      peak = Math.max(peak, inFlight)
      await sleep(5)
      inFlight -= 1
      return i
    })

    expect(peak).toBeLessThanOrEqual(3)
    expect(peak).toBeGreaterThan(1)
  })

  it('passes the index to the worker', async () => {
    const out = await mapWithConcurrency(['a', 'b', 'c'], 2, async (v, i) => `${i}:${v}`)
    expect(out).toEqual(['0:a', '1:b', '2:c'])
  })

  it('rejects a limit below 1', async () => {
    await expect(mapWithConcurrency([1], 0, async (x) => x)).rejects.toThrow(
      /at least 1/,
    )
  })
})
