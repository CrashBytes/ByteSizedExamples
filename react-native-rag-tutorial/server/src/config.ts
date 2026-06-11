/**
 * Environment-driven configuration. Validated once at startup so the rest of the
 * server can treat config as a typed, trusted object.
 */
export interface ServerConfig {
  port: number;
  corsOrigins: string[];
  voyage: { apiKey: string | null; model: string; dimensions: number };
  anthropic: { apiKey: string | null; model: string };
}

function int(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const corsRaw = env.CORS_ORIGINS ?? "*";
  return {
    port: int(env.PORT, 8787),
    corsOrigins: corsRaw.split(",").map((s) => s.trim()).filter(Boolean),
    voyage: {
      apiKey: env.VOYAGE_API_KEY?.trim() || null,
      model: env.VOYAGE_MODEL?.trim() || "voyage-3.5",
      dimensions: int(env.VOYAGE_EMBED_DIM, 1024),
    },
    anthropic: {
      apiKey: env.ANTHROPIC_API_KEY?.trim() || null,
      model: env.ANTHROPIC_MODEL?.trim() || "claude-opus-4-8",
    },
  };
}
