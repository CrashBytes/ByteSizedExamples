import { cosine } from './similarity.js'
import type { MemoryRecord } from './types.js'

export interface RankWeights {
  similarity: number
  recency: number
  salience: number
  usage: number
}

export const defaultWeights: RankWeights = {
  similarity: 0.5,
  recency: 0.25,
  salience: 0.15,
  usage: 0.1,
}

export interface RankOptions {
  weights?: RankWeights
  /** Recency half-life in ms. Default 7 days. */
  halfLifeMs?: number
  now?: number
}

export interface Scored {
  record: MemoryRecord
  score: number
}

export function rank(
  query: number[],
  records: MemoryRecord[],
  opts: RankOptions = {}
): Scored[] {
  const w = opts.weights ?? defaultWeights
  const halfLife = opts.halfLifeMs ?? 7 * 24 * 60 * 60 * 1000
  const now = opts.now ?? Date.now()
  const decay = Math.LN2 / halfLife

  return records
    .map(record => {
      const similarity = Math.max(0, cosine(query, record.embedding))
      const ageMs = Math.max(0, now - record.createdAt)
      const recency = Math.exp(-decay * ageMs)
      const salience = clamp01(record.salience)
      // Diminishing-returns boost: log keeps a hot record from dominating.
      const usage = Math.min(1, Math.log10(record.accessCount + 1) / 2)
      const score =
        w.similarity * similarity +
        w.recency * recency +
        w.salience * salience +
        w.usage * usage
      return { record, score }
    })
    .sort((a, b) => b.score - a.score)
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}
