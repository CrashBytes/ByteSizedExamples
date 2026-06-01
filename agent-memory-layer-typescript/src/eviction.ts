import { rank } from './ranking.js'
import type { MemoryStore } from './types.js'

export interface EvictionPolicy {
  /** Delete episodic records older than this (ms). */
  episodicTtlMs?: number
  /** Max non-archived records per scope. */
  maxRecords?: number
  /** Never evict records at or above this salience. */
  salienceFloor?: number
}

export async function evict(
  scope: string,
  store: MemoryStore,
  policy: EvictionPolicy,
  now = Date.now()
): Promise<string[]> {
  const records = await store.list(scope)
  const floor = policy.salienceFloor ?? 0.9
  const evictable = records.filter(r => r.salience < floor)
  const toDelete = new Set<string>()

  // TTL: episodic only.
  if (policy.episodicTtlMs) {
    for (const r of evictable) {
      if (r.kind === 'episodic' && now - r.createdAt > policy.episodicTtlMs) {
        toDelete.add(r.id)
      }
    }
  }

  // Capacity: drop lowest-scored evictable records until under the cap.
  if (policy.maxRecords && records.length > policy.maxRecords) {
    const overBy = records.length - policy.maxRecords
    // Score with a zero query so ranking reduces to recency+salience+usage.
    const zero = new Array(records[0]?.embedding.length ?? 0).fill(0)
    const ranked = rank(zero, evictable, { now }).reverse() // worst first
    for (const { record } of ranked) {
      if (toDelete.size >= overBy) break
      toDelete.add(record.id)
    }
  }

  const ids = [...toDelete]
  if (ids.length) await store.delete(ids)
  return ids
}
