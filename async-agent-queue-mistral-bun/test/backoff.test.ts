import { describe, it, expect } from 'bun:test'
import { backoffDelay } from '../src/backoff'

describe('backoffDelay', () => {
  it('grows exponentially without jitter', () => {
    const opts = { baseMs: 100, factor: 2, jitter: false }
    expect(backoffDelay(0, opts)).toBe(100)
    expect(backoffDelay(1, opts)).toBe(200)
    expect(backoffDelay(2, opts)).toBe(400)
    expect(backoffDelay(3, opts)).toBe(800)
  })

  it('caps at maxMs', () => {
    expect(backoffDelay(20, { baseMs: 100, factor: 2, maxMs: 5_000, jitter: false })).toBe(5_000)
  })

  it('full-jitter stays within [0, raw] using the injected RNG', () => {
    const raw = 800 // base 100 * 2^3
    expect(backoffDelay(3, { baseMs: 100, factor: 2, jitter: true, random: () => 0 })).toBe(0)
    expect(backoffDelay(3, { baseMs: 100, factor: 2, jitter: true, random: () => 1 })).toBe(raw)
    expect(backoffDelay(3, { baseMs: 100, factor: 2, jitter: true, random: () => 0.5 })).toBe(raw / 2)
  })
})
