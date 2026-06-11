import * as SQLite from "expo-sqlite";
import { dot, type EmbeddedChunk, type ScoredChunk, type VectorStore } from "@cb/rag-core";

/**
 * A persistent on-device vector store backed by expo-sqlite.
 *
 * Why this matters: the in-memory store re-embeds the whole corpus on every cold
 * start. That is fine for a bundled help center, but for a user's growing notes
 * it wastes battery and time. Persisting the embedded chunks means you embed
 * once (on sync), then every launch is an instant load.
 *
 * It still implements the SAME `VectorStore` interface as `InMemoryVectorStore`,
 * so swapping it into the pipeline is a one-line change:
 *
 *   const store = await SqliteVectorStore.open();
 *   const pipeline = new RagPipeline({ embedder, store, synthesizer });
 *
 * Vectors are stored as JSON; similarity is computed in JS after loading. For
 * the thousands-of-chunks scale a phone holds, that is sub-frame fast. Past tens
 * of thousands, move retrieval to the server (the whole point of "Cloud" mode).
 */
export class SqliteVectorStore implements VectorStore {
  private constructor(private readonly db: SQLite.SQLiteDatabase) {}

  static async open(name = "lumen-rag.db"): Promise<SqliteVectorStore> {
    const db = await SQLite.openDatabaseAsync(name);
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS chunks (
        id        TEXT PRIMARY KEY NOT NULL,
        doc_id    TEXT NOT NULL,
        idx       INTEGER NOT NULL,
        text      TEXT NOT NULL,
        metadata  TEXT,
        embedding TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS chunks_doc_id ON chunks (doc_id);
    `);
    return new SqliteVectorStore(db);
  }

  async upsert(chunks: EmbeddedChunk[]): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      for (const c of chunks) {
        await this.db.runAsync(
          `INSERT OR REPLACE INTO chunks (id, doc_id, idx, text, metadata, embedding)
           VALUES (?, ?, ?, ?, ?, ?)`,
          c.id,
          c.docId,
          c.index,
          c.text,
          c.metadata ? JSON.stringify(c.metadata) : null,
          JSON.stringify(c.embedding),
        );
      }
    });
  }

  async query(query: number[], k: number): Promise<ScoredChunk[]> {
    const rows = await this.allRows();
    const scored = rows.map<ScoredChunk>((chunk) => {
      const score = dot(query, chunk.embedding);
      return { chunk, score, components: { semantic: score } };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, Math.max(0, k));
  }

  async all(): Promise<EmbeddedChunk[]> {
    return this.allRows();
  }

  async removeDocument(docId: string): Promise<void> {
    await this.db.runAsync(`DELETE FROM chunks WHERE doc_id = ?`, docId);
  }

  async size(): Promise<number> {
    const row = await this.db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM chunks`);
    return row?.n ?? 0;
  }

  private async allRows(): Promise<EmbeddedChunk[]> {
    const rows = await this.db.getAllAsync<{
      id: string;
      doc_id: string;
      idx: number;
      text: string;
      metadata: string | null;
      embedding: string;
    }>(`SELECT id, doc_id, idx, text, metadata, embedding FROM chunks`);

    return rows.map((r) => ({
      id: r.id,
      docId: r.doc_id,
      index: r.idx,
      text: r.text,
      embedding: JSON.parse(r.embedding) as number[],
      ...(r.metadata ? { metadata: JSON.parse(r.metadata) as Record<string, unknown> } : {}),
    }));
  }
}
