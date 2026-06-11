# React Native RAG — On-Device & Cloud Retrieval

Production Retrieval-Augmented Generation for a React Native app, built around a
single framework-agnostic engine that runs **unchanged** on the phone and on the
server. The phone answers questions privately and offline; the server answers
them with Voyage embeddings and **Claude Opus 4.8** synthesis. Same pipeline,
different injected parts.

> **Tutorial**: [Implementing RAG in a React Native App](https://crashbytes.com/tutorials/implementing-rag-react-native-on-device-cloud-retrieval)

## What You'll Learn

- How to structure a RAG pipeline so retrieval logic is identical across platforms and only the embedder/store/synthesizer change
- Sentence-aware chunking with overlap, and why it beats fixed-size windows
- Hybrid retrieval: dense vector search fused with BM25 via reciprocal rank fusion
- The on-device vs server tradeoff — privacy, latency, cost, and recall
- Grounded, cited answer synthesis with Claude Opus 4.8 (adaptive thinking + streaming)
- Graceful degradation: the whole system runs offline with zero API keys
- Persisting on-device embeddings with `expo-sqlite`

## Architecture

```
                         ┌──────────────────────────── @cb/rag-core ────────────────────────────┐
                         │  RagPipeline:  ingest → chunk → embed → store → (hybrid) retrieve → synthesize │
                         └──────────────────────────────────────────────────────────────────────┘
                                   ▲ injected parts differ; pipeline does not ▲
        ON-DEVICE (app/) ──────────┘                                          └────────── CLOUD (server/)
        embedder    = HashingEmbeddingProvider                                 embedder    = VoyageEmbeddingProvider
        store       = InMemoryVectorStore / SqliteVectorStore                  store       = InMemoryVectorStore (→ pgvector)
        synthesizer = ExtractiveSynthesizer                                    synthesizer = ClaudeSynthesizer (Opus 4.8)
        network     = none                                                     secrets     = stay server-side
```

The Expo app talks to the server only in **Cloud** mode; the API key never
leaves the server. In **On-device** mode nothing leaves the phone.

## Project Structure

```
react-native-rag-tutorial/
├── packages/rag-core/      # the engine — chunk, embed, store, rank, synthesize (Vitest)
│   ├── src/
│   │   ├── pipeline.ts             # RagPipeline orchestrator (platform-agnostic)
│   │   ├── chunking.ts             # sentence-aware sliding-window chunker
│   │   ├── ranking.ts              # BM25 + reciprocal rank fusion
│   │   ├── embeddings/             # hashing (offline) + Voyage (cloud) providers
│   │   ├── store/memory.ts         # brute-force in-memory vector store
│   │   └── synthesize/             # extractive + grounded-prompt builder
│   └── test/                       # 50 unit/integration tests
├── server/                 # Express retrieval API + Claude synthesizer (Docker, CI)
│   ├── src/{app,factory,config,claudeSynthesizer,seed,index}.ts
│   └── test/app.test.ts            # supertest, offline + deterministic
└── app/                    # Expo (React Native) client, two retrieval modes
    └── src/{rag,hooks,components,data}
```

## Quick Start

```bash
git clone https://github.com/CrashBytes/ByteSizedExamples.git
cd ByteSizedExamples/react-native-rag-tutorial
npm install
cp .env.example .env        # optional — works without keys

# Run the verifiable core + server
npm test                    # rag-core (50) + server (8) tests, fully offline
npm run dev:server          # http://localhost:8787

# Run the app (separate terminal)
npm run build -w @cb/rag-core
npm start -w app
```

Everything runs with **no API keys** thanks to the offline fallbacks. Add
`VOYAGE_API_KEY` and `ANTHROPIC_API_KEY` to `.env` to switch the server to full
cloud quality.

## Configuration

| Variable | Description | Required | Default |
| -------- | ----------- | -------- | ------- |
| `VOYAGE_API_KEY` | Enables Voyage embeddings; absent → offline hashing embedder | No | — |
| `VOYAGE_MODEL` | Voyage embedding model | No | `voyage-3.5` |
| `VOYAGE_EMBED_DIM` | Embedding dimensionality | No | `1024` |
| `ANTHROPIC_API_KEY` | Enables Claude synthesis; absent → extractive synthesizer | No | — |
| `ANTHROPIC_MODEL` | Claude model id | No | `claude-opus-4-8` |
| `PORT` | Server port | No | `8787` |
| `CORS_ORIGINS` | Comma-separated allowed origins | No | `*` |
| `EXPO_PUBLIC_RAG_API_URL` | API base URL the app uses in Cloud mode | No | `http://localhost:8787` |

## Available Scripts

| Script | Description |
| ------ | ----------- |
| `npm test` | Run rag-core + server test suites |
| `npm run build` | Build rag-core then the server |
| `npm run typecheck` | Type-check rag-core + server |
| `npm run lint` | ESLint over rag-core + server |
| `npm run dev:server` | Start the retrieval API with hot reload |
| `npm start -w app` | Start the Expo dev server |

## API

```bash
# Health / introspection
curl localhost:8787/health

# Ask a question (grounded + cited)
curl -s localhost:8787/query \
  -H 'content-type: application/json' \
  -d '{"query":"how do I get a refund","k":4,"alpha":0.7}'

# Retrieval only (the cheap path you evaluate)
curl -s localhost:8787/query \
  -H 'content-type: application/json' \
  -d '{"query":"export my notes","synthesize":false}'
```

`alpha` blends retrieval signals: `1` = pure semantic, `0` = pure keyword,
`0.6–0.7` = hybrid.

## Testing

```bash
npm test
```

rag-core's tests cover the math, chunker, hashing embedder determinism, vector
store ordering, BM25 + fusion, prompt building, and an end-to-end pipeline run.
The server tests exercise the HTTP API against the deterministic offline
pipeline, so CI is green without any secrets.

## Deployment

```bash
docker compose up --build
# add VOYAGE_API_KEY / ANTHROPIC_API_KEY to your env or .env for cloud quality
```

## Related

- [Full Tutorial](https://crashbytes.com/tutorials/implementing-rag-react-native-on-device-cloud-retrieval) — the step-by-step guide on CrashBytes
- [Production Vector Database RAG](https://github.com/CrashBytes/ByteSizedExamples/tree/main/tutorial-production-vector-database-rag) — the server-scale companion (Pinecone / Weaviate)

## License

MIT — see [LICENSE](./LICENSE)
