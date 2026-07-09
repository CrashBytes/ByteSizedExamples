// src/store.ts
//
// Bun ships with a SQLite driver as fast as anything you can buy. We use it.
//
// Deviation from the article: the tutorial shows a module-level singleton
// `const db = new Database('agent-queue.sqlite')`. That is fine for a running
// server but it opens a file at import time, which we do not want in a test
// suite. So we expose a `createStore(path)` factory instead — pass `:memory:`
// for a throwaway in-memory database (this is what the tests and demo use) or a
// filename for persistence. The SQL, indexes, and row<->Job mapping are
// otherwise verbatim from the tutorial.

import { Database } from 'bun:sqlite'
import { Job } from './job'

export interface Store {
  insert(j: Job): void
  get(id: string): Job | null
  byProviderId(pid: string): Job | null
  inFlight(): Job[]
  queued(): Job[]
  all(): Job[]
  update(j: Job): void
  close(): void
}

export function createStore(dbPath = 'agent-queue.sqlite'): Store {
  const db = new Database(dbPath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      provider_job_id TEXT,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt TEXT NOT NULL,
      toolset TEXT NOT NULL,
      status TEXT NOT NULL,
      budget_usd REAL NOT NULL,
      spent_usd REAL NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      started_at INTEGER,
      finished_at INTEGER,
      result TEXT,
      error TEXT
    );
    CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status);
    CREATE INDEX IF NOT EXISTS jobs_provider_job_idx ON jobs(provider_job_id);
  `)

  return {
    insert(j: Job) {
      db.run(
        `INSERT INTO jobs (id, provider_job_id, provider, model, prompt, toolset,
                           status, budget_usd, spent_usd, created_at, started_at,
                           finished_at, result, error)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          j.id,
          j.providerJobId,
          j.provider,
          j.model,
          j.prompt,
          JSON.stringify(j.toolset),
          j.status,
          j.budgetUsd,
          j.spentUsd,
          j.createdAt,
          j.startedAt,
          j.finishedAt,
          j.result ? JSON.stringify(j.result) : null,
          j.error,
        ]
      )
    },
    get(id: string): Job | null {
      const row = db.query('SELECT * FROM jobs WHERE id = ?').get(id)
      return row ? rowToJob(row) : null
    },
    byProviderId(pid: string): Job | null {
      const row = db.query('SELECT * FROM jobs WHERE provider_job_id = ?').get(pid)
      return row ? rowToJob(row) : null
    },
    inFlight(): Job[] {
      return db
        .query(`SELECT * FROM jobs WHERE status IN ('submitted','running')`)
        .all()
        .map(rowToJob)
    },
    queued(): Job[] {
      return db
        .query(`SELECT * FROM jobs WHERE status = 'queued' ORDER BY created_at ASC`)
        .all()
        .map(rowToJob)
    },
    all(): Job[] {
      return db.query('SELECT * FROM jobs ORDER BY created_at ASC').all().map(rowToJob)
    },
    update(j: Job) {
      db.run(
        `UPDATE jobs SET provider_job_id = ?, status = ?, spent_usd = ?,
                         started_at = ?, finished_at = ?, result = ?, error = ?
         WHERE id = ?`,
        [
          j.providerJobId,
          j.status,
          j.spentUsd,
          j.startedAt,
          j.finishedAt,
          j.result ? JSON.stringify(j.result) : null,
          j.error,
          j.id,
        ]
      )
    },
    close() {
      db.close()
    },
  }
}

// Every read goes through `Job.parse`, so a corrupted row throws at read time,
// not at use time.
function rowToJob(row: unknown): Job {
  const r = row as Record<string, unknown>
  return Job.parse({
    id: r.id,
    providerJobId: r.provider_job_id,
    provider: r.provider,
    model: r.model,
    prompt: r.prompt,
    toolset: JSON.parse(r.toolset as string),
    status: r.status,
    budgetUsd: r.budget_usd,
    spentUsd: r.spent_usd,
    createdAt: r.created_at,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    result: r.result ? JSON.parse(r.result as string) : null,
    error: r.error,
  })
}
