import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { loadConfig } from "../src/config.js";
import { buildPipeline } from "../src/factory.js";
import { createApp } from "../src/app.js";
import { SEED_CORPUS } from "../src/seed.js";
import type { Express } from "express";

/**
 * These tests run against the OFFLINE pipeline (no Voyage/Anthropic keys), so
 * they are deterministic and need no secrets — exactly what CI uses.
 */
describe("retrieval API", () => {
  let app: Express;

  beforeAll(async () => {
    // Force offline providers regardless of the developer's local env.
    const config = loadConfig({ PORT: "0", CORS_ORIGINS: "*" });
    const built = buildPipeline(config);
    await built.pipeline.ingest(SEED_CORPUS);
    app = createApp(built);
  });

  it("GET /health reports the indexed corpus and offline providers", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.indexedChunks).toBeGreaterThan(0);
    expect(res.body.embedder).toBe("hashing-trick");
    expect(res.body.synthesizer).toBe("extractive");
    expect(res.body.cloud).toBe(false);
  });

  it("POST /query returns a grounded answer with citations", async () => {
    const res = await request(app)
      .post("/query")
      .send({ query: "how do I request a refund", k: 3 });
    expect(res.status).toBe(200);
    expect(res.body.answer).toBeTypeOf("string");
    expect(res.body.citations.length).toBeGreaterThan(0);
    expect(res.body.contexts.length).toBeGreaterThan(0);
    expect(res.body.meta.embedder).toBe("hashing-trick");
  });

  it("POST /query routes a password question to the right document", async () => {
    const res = await request(app)
      .post("/query")
      .send({ query: "forgot my password reset link", k: 1 });
    expect(res.status).toBe(200);
    expect(res.body.contexts[0].chunk.docId).toBe("account-password");
  });

  it("POST /query with synthesize:false returns retrieval only", async () => {
    const res = await request(app)
      .post("/query")
      .send({ query: "export my notes to pdf", synthesize: false, k: 2 });
    expect(res.status).toBe(200);
    expect(res.body.answer).toBeUndefined();
    expect(res.body.contexts.length).toBeLessThanOrEqual(2);
    expect(res.body.contexts[0].chunk.docId).toBe("export-backup");
  });

  it("POST /query rejects an empty query", async () => {
    const res = await request(app).post("/query").send({ query: "  " });
    expect(res.status).toBe(400);
  });

  it("POST /ingest adds new documents to the index", async () => {
    const before = (await request(app).get("/health")).body.indexedChunks;
    const res = await request(app)
      .post("/ingest")
      .send({ documents: [{ id: "widgets", text: "Widgets glow in the dark and last ten years." }] });
    expect(res.status).toBe(200);
    expect(res.body.ingestedChunks).toBeGreaterThan(0);
    expect(res.body.totalChunks).toBeGreaterThan(before);

    const query = await request(app).post("/query").send({ query: "do widgets glow", k: 1 });
    expect(query.body.contexts[0].chunk.docId).toBe("widgets");
  });

  it("POST /ingest rejects a malformed body", async () => {
    const res = await request(app).post("/ingest").send({ documents: [{ id: 5 }] });
    expect(res.status).toBe(400);
  });

  it("unknown routes return 404 JSON", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not found");
  });
});
