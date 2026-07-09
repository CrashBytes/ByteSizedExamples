/**
 * Provider adapters. The router decides *which* model to call; the code here
 * does the actual HTTP for each provider. They are kept separate on purpose.
 *
 * The real adapters below use `fetch` and require API keys. They are never
 * imported by the tests or the demo — those run fully offline against the
 * `FakeAdapter` in `./fake.ts`. `ask()` (src/index.ts) takes the provider call
 * as an injectable dependency so you can swap the real fan-out for the fake.
 */

import type { ModelSpec } from '../registry.js';

export interface CompletionRequest {
  systemPrompt?: string;
  userPrompt: string;
  maxOutputTokens: number;
}

export interface CompletionResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export type ProviderFn = (
  model: ModelSpec,
  req: CompletionRequest
) => Promise<CompletionResponse>;

const providers: Record<ModelSpec['provider'], ProviderFn> = {
  anthropic: async (model, req) => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: model.id,
        max_tokens: req.maxOutputTokens,
        system: req.systemPrompt,
        messages: [{ role: 'user', content: req.userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new ProviderError(
        `Anthropic ${response.status}: ${await response.text()}`,
        response.status === 429 || response.status >= 500,
        response.status
      );
    }

    const json = (await response.json()) as {
      content: { text: string }[];
      usage: { input_tokens: number; output_tokens: number };
    };
    return {
      text: json.content.map((c) => c.text).join(''),
      inputTokens: json.usage.input_tokens,
      outputTokens: json.usage.output_tokens,
    };
  },

  openai: async (model, req) => {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: model.id,
        max_output_tokens: req.maxOutputTokens,
        input: [
          ...(req.systemPrompt
            ? [{ role: 'system', content: req.systemPrompt }]
            : []),
          { role: 'user', content: req.userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new ProviderError(
        `OpenAI ${response.status}: ${await response.text()}`,
        response.status === 429 || response.status >= 500,
        response.status
      );
    }

    const json = (await response.json()) as {
      output_text: string;
      usage: { input_tokens: number; output_tokens: number };
    };
    return {
      text: json.output_text,
      inputTokens: json.usage.input_tokens,
      outputTokens: json.usage.output_tokens,
    };
  },

  google: async (model, req) => {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent` +
      `?key=${process.env.GOOGLE_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: req.systemPrompt
          ? { parts: [{ text: req.systemPrompt }] }
          : undefined,
        contents: [{ role: 'user', parts: [{ text: req.userPrompt }] }],
        generationConfig: { maxOutputTokens: req.maxOutputTokens },
      }),
    });

    if (!response.ok) {
      throw new ProviderError(
        `Google ${response.status}: ${await response.text()}`,
        response.status === 429 || response.status >= 500,
        response.status
      );
    }

    type Part = { text: string };
    const json = (await response.json()) as {
      candidates: { content: { parts: Part[] } }[];
      usageMetadata: {
        promptTokenCount: number;
        candidatesTokenCount: number;
      };
    };
    const text = json.candidates[0].content.parts.map((p) => p.text).join('');
    return {
      text,
      inputTokens: json.usageMetadata.promptTokenCount,
      outputTokens: json.usageMetadata.candidatesTokenCount,
    };
  },

  mistral: async () => {
    throw new ProviderError('Mistral not implemented in this tutorial', false);
  },
};

export async function callProvider(
  model: ModelSpec,
  req: CompletionRequest
): Promise<CompletionResponse> {
  return providers[model.provider](model, req);
}

export { FakeAdapter, type FakeBehavior } from './fake.js';
