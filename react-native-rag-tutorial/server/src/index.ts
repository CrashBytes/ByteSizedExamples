import { loadConfig } from "./config.js";
import { buildPipeline } from "./factory.js";
import { createApp } from "./app.js";
import { SEED_CORPUS } from "./seed.js";

/**
 * Server entrypoint: load config, build the pipeline, seed it, and listen.
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const built = buildPipeline(config);

  const ingested = await built.pipeline.ingest(SEED_CORPUS);

  const app = createApp(built, config.corsOrigins);
  app.listen(config.port, () => {
    console.log(
      `[rag-server] listening on :${config.port}\n` +
        `  embedder    = ${built.embedderName}\n` +
        `  synthesizer = ${built.synthesizerName}\n` +
        `  cloud mode  = ${built.cloud}\n` +
        `  seeded      = ${ingested} chunks from ${SEED_CORPUS.length} documents`,
    );
  });
}

main().catch((err) => {
  console.error("[rag-server] failed to start:", err);
  process.exitCode = 1;
});
