/**
 * OPTIONAL real adapter for any OpenAI-compatible endpoint (OpenAI, Anthropic
 * compat, Gemini, vLLM, Ollama). Dependency-free — it uses `fetch`, so there is
 * no SDK to install and nothing here is required for the gate, demo, or tests,
 * all of which run against the FakeModel with no keys.
 *
 * Temperature is fixed from config, not per-case: eval runs must be reproducible
 * enough to tell a real regression from sampling noise.
 */

import { estimateTokens, type Model, type ModelConfig, type ModelRun } from './model.js';

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export class OpenAICompatibleModel implements Model {
  readonly name: string;
  private readonly cfg: ModelConfig;

  constructor(cfg: ModelConfig) {
    this.cfg = cfg;
    this.name = `openai-compat:${cfg.model}`;
  }

  async runOnce(system: string | undefined, user: string): Promise<ModelRun> {
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: user });

    const t0 = Date.now();
    const res = await fetch(`${this.cfg.baseURL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: this.cfg.model,
        messages,
        temperature: this.cfg.temperature,
        max_tokens: this.cfg.maxTokens,
      }),
    });
    if (!res.ok) {
      throw new Error(`model request failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as ChatCompletionResponse;
    const output = data.choices?.[0]?.message?.content ?? '';
    return {
      output,
      latencyMs: Date.now() - t0,
      inputTokens: data.usage?.prompt_tokens ?? estimateTokens((system ?? '') + ' ' + user),
      outputTokens: data.usage?.completion_tokens ?? estimateTokens(output),
    };
  }
}

/** Build a real model from environment variables (see `.env.example`). */
export function modelFromEnv(): OpenAICompatibleModel {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is required to use the real adapter');
  return new OpenAICompatibleModel({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    model: process.env.EVAL_MODEL ?? 'gpt-5-mini',
    temperature: Number(process.env.EVAL_TEMP ?? '0'),
    maxTokens: Number(process.env.EVAL_MAX_TOKENS ?? '512'),
  });
}
