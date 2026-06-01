import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { MemoryRecord, MemoryStore } from './types.js'

export class JsonStore implements MemoryStore {
  private cache = new Map<string, MemoryRecord>()
  private loaded = false

  constructor(private path: string) {}

  private async load(): Promise<void> {
    if (this.loaded) return
    try {
      const raw = await readFile(this.path, 'utf8')
      for (const rec of JSON.parse(raw) as MemoryRecord[]) {
        this.cache.set(rec.id, rec)
      }
    } catch {
      // First run: no file yet.
    }
    this.loaded = true
  }

  private async flush(): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true })
    await writeFile(this.path, JSON.stringify([...this.cache.values()]))
  }

  async put(record: MemoryRecord): Promise<void> {
    await this.load()
    this.cache.set(record.id, record)
    await this.flush()
  }

  async list(scope: string): Promise<MemoryRecord[]> {
    await this.load()
    return [...this.cache.values()].filter(r => r.scope === scope && !r.archivedAt)
  }

  async delete(ids: string[]): Promise<void> {
    await this.load()
    for (const id of ids) this.cache.delete(id)
    await this.flush()
  }

  async markArchived(ids: string[], at: number): Promise<void> {
    await this.load()
    for (const id of ids) {
      const r = this.cache.get(id)
      if (r) r.archivedAt = at
    }
    await this.flush()
  }

  async touch(ids: string[], at: number): Promise<void> {
    await this.load()
    for (const id of ids) {
      const r = this.cache.get(id)
      if (r) {
        r.lastAccessedAt = at
        r.accessCount += 1
      }
    }
    await this.flush()
  }
}
