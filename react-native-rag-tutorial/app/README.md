# Lumen RAG — Expo client

The mobile half of the tutorial. One screen, two retrieval modes over the same
`@cb/rag-core` engine.

- **On-device** — `HashingEmbeddingProvider` + `InMemoryVectorStore` +
  `ExtractiveSynthesizer`. Private, offline, no API key.
- **Cloud** — calls the retrieval server, which uses Voyage embeddings and
  Claude Opus 4.8 synthesis.

## Run it

From the **repo root** (the workspace must be installed and rag-core built so
Metro can resolve `@cb/rag-core`):

```bash
npm install
npm run build -w @cb/rag-core
npm start -w app          # then press i (iOS), a (Android), or w (web)
```

> On a physical device, set `EXPO_PUBLIC_RAG_API_URL` to your machine's LAN IP
> (e.g. `http://192.168.1.20:8787`) — `localhost` resolves to the phone itself.

## Files

```
app/
├── App.tsx                     # single screen, wires everything together
├── index.ts                    # registerRootComponent entry
├── metro.config.js             # monorepo-aware resolver for @cb/rag-core
└── src/
    ├── data/knowledgeBase.ts   # bundled offline corpus + sample questions
    ├── rag/
    │   ├── onDeviceEngine.ts   # offline RagPipeline (singleton)
    │   ├── remoteClient.ts     # calls the retrieval server
    │   └── sqliteStore.ts      # persistent VectorStore (expo-sqlite)
    ├── hooks/useRagSearch.ts   # routes to on-device or cloud, same result shape
    └── components/             # SearchBar, ModeToggle, AnswerCard, SampleChips
```

See the [full tutorial](https://crashbytes.com/tutorials/implementing-rag-react-native-on-device-cloud-retrieval)
for the architecture walkthrough.
