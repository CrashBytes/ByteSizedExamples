/**
 * The model interface the harness runs cases against.
 *
 * The tutorial's `runOnce(cfg, system, user)` is refactored here into a small
 * `Model` interface so the harness is provider-agnostic and, crucially,
 * injectable: tests and the offline demo pass a `FakeModel`, CI runs against
 * the fake with no keys, and a real OpenAI-compatible endpoint slots in behind
 * the same interface. The request layer returns the raw output UNCHANGED —
 * parsing happens in graders, never here — so old outputs can be re-graded
 * against new graders without re-running the model.
 */

export interface ModelRun {
  output: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
}

export interface Model {
  /** Stable identifier for the report header. */
  readonly name: string;
  runOnce(system: string | undefined, user: string): Promise<ModelRun>;
}

/** Config for the optional real OpenAI-compatible adapter. */
export interface ModelConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

/** Rough token estimate — enough for cost/latency reporting without a tokenizer dep. */
export function estimateTokens(text: string): number {
  const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
  return Math.ceil(words * 1.3);
}
