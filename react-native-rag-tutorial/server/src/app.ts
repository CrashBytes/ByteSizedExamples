import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import type { RagDocument, RetrieveOptions } from "@cb/rag-core";
import type { BuiltPipeline } from "./factory.js";

/**
 * Build the Express app around an already-constructed pipeline. Taking the
 * pipeline as an argument (rather than reading the environment here) is what
 * makes the API testable: tests inject a deterministic offline pipeline and
 * assert on real retrieval behaviour without a network or any keys.
 */
export function createApp(built: BuiltPipeline, corsOrigins: string[] = ["*"]): Express {
  const app = express();
  app.use(express.json({ limit: "4mb" }));
  app.use(cors({ origin: corsOrigins.includes("*") ? true : corsOrigins }));

  // ── Health / introspection ────────────────────────────────────────────────
  app.get("/health", async (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      indexedChunks: await built.pipeline.size(),
      embedder: built.embedderName,
      synthesizer: built.synthesizerName,
      cloud: built.cloud,
    });
  });

  // ── Ingest documents ──────────────────────────────────────────────────────
  app.post("/ingest", async (req: Request, res: Response) => {
    const documents = req.body?.documents;
    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: "Body must include a non-empty `documents` array." });
    }
    for (const doc of documents) {
      if (typeof doc?.id !== "string" || typeof doc?.text !== "string") {
        return res.status(400).json({ error: "Each document needs string `id` and `text` fields." });
      }
    }

    const ingestedChunks = await built.pipeline.ingest(documents as RagDocument[]);
    res.json({ ingestedChunks, totalChunks: await built.pipeline.size() });
  });

  // ── Query ─────────────────────────────────────────────────────────────────
  // `synthesize: false` returns retrieval only — the cheap path you evaluate
  // and the one the app uses when it just wants ranked snippets.
  app.post("/query", async (req: Request, res: Response) => {
    const query = req.body?.query;
    if (typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({ error: "Body must include a non-empty `query` string." });
    }

    const options: RetrieveOptions = {
      k: clampInt(req.body?.k, 1, 20, 5),
      alpha: clampFloat(req.body?.alpha, 0, 1, 0.6),
    };
    if (req.body?.filter && typeof req.body.filter === "object") {
      options.filter = req.body.filter as Record<string, unknown>;
    }

    const synthesize = req.body?.synthesize !== false;
    if (!synthesize) {
      const contexts = await built.pipeline.retrieve(query, options);
      return res.json({ contexts });
    }

    const answer = await built.pipeline.answer(query, options);
    res.json(answer);
  });

  // ── 404 + error handler ───────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
  });

  // Express 5 forwards rejected async handlers here automatically.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[rag-server] error:", message);
    res.status(500).json({ error: message });
  });

  return app;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function clampFloat(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
