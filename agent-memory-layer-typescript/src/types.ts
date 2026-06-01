export type MemoryKind = 'episodic' | 'semantic' | 'procedural'

export interface MemoryRecord {
  id: string
  /** The text the model will actually read on recall. */
  content: string
  /** Embedding of `content`. Length depends on your model. */
  embedding: number[]
  /**
   * episodic  = a thing that happened ("user said their deploy failed at 14:02")
   * semantic  = a durable fact distilled from episodes ("user runs on GKE")
   * procedural = a learned how-to ("to restart their cluster, run X")
   */
  kind: MemoryKind
  /** Namespace: who/what this memory belongs to. See Part 4. */
  scope: string
  /** Higher = more important. Drives ranking and eviction. 0..1. */
  salience: number
  /** Rough token count of `content`, for budget packing. */
  tokens: number
  createdAt: number
  lastAccessedAt: number
  accessCount: number
  /** Set when this record was folded into a summary and superseded. */
  archivedAt?: number
}

export interface RecallQuery {
  scope: string
  text: string
  /** Max tokens of recalled content to return. */
  tokenBudget: number
  /** Restrict to certain kinds, e.g. only semantic facts. */
  kinds?: MemoryKind[]
  /** How many candidates to pull before re-ranking. */
  candidatePool?: number
}

export interface MemoryStore {
  put(record: MemoryRecord): Promise<void>
  /** All non-archived records in a scope, used by ranking + maintenance. */
  list(scope: string): Promise<MemoryRecord[]>
  delete(ids: string[]): Promise<void>
  markArchived(ids: string[], at: number): Promise<void>
  touch(ids: string[], at: number): Promise<void>
}
