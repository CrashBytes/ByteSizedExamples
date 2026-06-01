import { describe, it, expect } from 'vitest'
import { randomUUID } from 'node:crypto'
import { MemoryLayer } from '../src/memory.js'
import { JsonStore } from '../src/jsonStore.js'
import type { Embedder } from '../src/embeddings.js'

// Deterministic stub: embed by hashing words into a small vector.
const stubEmbed: Embedder = async texts =>
  texts.map(t => {
    const v = new Array(16).fill(0)
    for (const word of t.toLowerCase().split(/\W+/)) {
      if (word) v[word.length % 16] += 1
    }
    return v
  })

describe('MemoryLayer', () => {
  it('recalls the most relevant record first', async () => {
    const store = new JsonStore(`/tmp/mem-${randomUUID()}.json`)
    const mem = new MemoryLayer(store, stubEmbed)
    await mem.remember({ scope: 's', content: 'user deploys on kubernetes gke' })
    await mem.remember({ scope: 's', content: 'user likes dark roast coffee' })

    const out = await mem.recall({ scope: 's', text: 'kubernetes gke deploy', tokenBudget: 200 })
    expect(out[0].content).toContain('kubernetes')
  })

  it('respects the token budget', async () => {
    const store = new JsonStore(`/tmp/mem-${randomUUID()}.json`)
    const mem = new MemoryLayer(store, stubEmbed)
    for (let i = 0; i < 20; i++) {
      await mem.remember({ scope: 's', content: `fact number ${i} about the system state` })
    }
    const out = await mem.recall({ scope: 's', text: 'system state', tokenBudget: 30 })
    const used = out.reduce((n, r) => n + r.tokens, 0)
    expect(used).toBeLessThanOrEqual(30)
  })

  it('isolates scopes', async () => {
    const store = new JsonStore(`/tmp/mem-${randomUUID()}.json`)
    const mem = new MemoryLayer(store, stubEmbed)
    await mem.remember({ scope: 'alice', content: 'alice secret project falcon' })
    await mem.remember({ scope: 'bob', content: 'bob secret project condor' })

    const out = await mem.recall({ scope: 'bob', text: 'secret project', tokenBudget: 200 })
    expect(out.every(r => !r.content.includes('falcon'))).toBe(true)
  })
})
