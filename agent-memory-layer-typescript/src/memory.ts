import { randomUUID } from 'node:crypto'
import type { Embedder } from './embeddings.js'
import { rank, type RankOptions } from './ranking.js'
import type { MemoryKind, MemoryRecord, MemoryStore, RecallQuery } from './types.js'

export interface WriteInput {
  scope: string
  content: string
  kind?: MemoryKind
  salience?: number
}

// ~4 chars per token is a good-enough estimate for budgeting.
export const estimateTokens = (text: string): number => Math.ceil(text.length / 4)

export class MemoryLayer {
  constructor(
    private store: MemoryStore,
    private embed: Embedder,
    private rankOpts: RankOptions = {}
  ) {}

  async remember(input: WriteInput): Promise<MemoryRecord> {
    const [embedding] = await this.embed([input.content])
    const now = Date.now()
    const record: MemoryRecord = {
      id: randomUUID(),
      content: input.content,
      embedding,
      kind: input.kind ?? 'episodic',
      scope: input.scope,
      salience: input.salience ?? 0.5,
      tokens: estimateTokens(input.content),
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0,
    }
    await this.store.put(record)
    return record
  }

  async recall(q: RecallQuery): Promise<MemoryRecord[]> {
    const [queryEmbedding] = await this.embed([q.text])
    let candidates = await this.store.list(q.scope)
    if (q.kinds) candidates = candidates.filter(c => q.kinds!.includes(c.kind))

    const pool = q.candidatePool ?? 50
    const scored = rank(queryEmbedding, candidates, this.rankOpts).slice(0, pool)

    const packed: MemoryRecord[] = []
    let used = 0
    for (const { record } of scored) {
      if (used + record.tokens > q.tokenBudget) continue
      packed.push(record)
      used += record.tokens
    }

    await this.store.touch(
      packed.map(r => r.id),
      Date.now()
    )
    return packed
  }
}
